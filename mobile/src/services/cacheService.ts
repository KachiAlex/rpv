import * as db from './database';
import { SearchResult } from './searchService';

const MAX_CACHE_SIZE_MB = 100; // Maximum cache size in MB
const CACHE_CLEANUP_THRESHOLD_MB = 90; // Trigger cleanup at 90MB

export interface CacheStats {
  verseCount: number;
  translationCount: number;
  bookmarkCount: number;
  queuedChanges: number;
  estimatedSizeMB: number;
}

class CacheService {
  private estimatedBytesPerVerse = 500; // Rough estimate for verse + metadata

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const stats = await db.getDatabaseStats();
      const estimatedSizeMB = (stats.verseCount * this.estimatedBytesPerVerse) / (1024 * 1024);

      return {
        ...stats,
        estimatedSizeMB,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        verseCount: 0,
        translationCount: 0,
        bookmarkCount: 0,
        queuedChanges: 0,
        estimatedSizeMB: 0,
      };
    }
  }

  /**
   * Check if cache needs cleanup
   */
  async shouldCleanupCache(): Promise<boolean> {
    try {
      const stats = await this.getCacheStats();
      return stats.estimatedSizeMB > CACHE_CLEANUP_THRESHOLD_MB;
    } catch (error) {
      console.error('Error checking cache cleanup:', error);
      return false;
    }
  }

  /**
   * Cleanup old cached verses
   */
  async cleanupCache(daysOld: number = 30): Promise<number> {
    try {
      console.log(`Cleaning up verses older than ${daysOld} days`);
      const deletedCount = await db.clearOldCache(daysOld);
      console.log(`Deleted ${deletedCount} old verses`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      return 0;
    }
  }

  /**
   * Cache a translation for offline use
   */
  async cacheTranslation(
    id: string,
    name: string,
    abbreviation: string,
    language: string,
    size: number
  ): Promise<void> {
    try {
      // Check if cleanup is needed before caching
      if (await this.shouldCleanupCache()) {
        await this.cleanupCache();
      }

      await db.runAsync(
        `INSERT OR REPLACE INTO translations (id, name, abbreviation, language, isDownloaded, size, downloadedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, abbreviation, language, 1, size, Date.now()]
      );
    } catch (error) {
      console.error('Error caching translation:', error);
      throw error;
    }
  }

  /**
   * Get cached translations
   */
  async getCachedTranslations(): Promise<any[]> {
    try {
      const results = await db.getAllAsync(
        `SELECT * FROM translations WHERE isDownloaded = 1 ORDER BY downloadedAt DESC`
      );
      return results;
    } catch (error) {
      console.error('Error getting cached translations:', error);
      return [];
    }
  }

  /**
   * Remove a translation from cache
   */
  async removeTranslation(id: string): Promise<void> {
    try {
      // Delete all verses for this translation
      await db.runAsync(
        `DELETE FROM verses WHERE translation = (SELECT abbreviation FROM translations WHERE id = ?)`,
        [id]
      );

      // Mark translation as not downloaded
      await db.runAsync(
        `UPDATE translations SET isDownloaded = 0 WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error('Error removing translation:', error);
      throw error;
    }
  }

  /**
   * Search in cached verses
   */
  async searchCached(query: string, translation?: string): Promise<SearchResult[]> {
    try {
      let sql = `SELECT * FROM verses WHERE (text LIKE ? OR book LIKE ?)`;
      const params: any[] = [`%${query}%`, `%${query}%`];

      if (translation) {
        sql += ` AND translation = ?`;
        params.push(translation);
      }

      sql += ` LIMIT 50`;

      const results = await db.getAllAsync(sql, params);
      return results;
    } catch (error) {
      console.error('Error searching cached verses:', error);
      return [];
    }
  }

  /**
   * Get all cached verses for a translation
   */
  async getCachedVerses(translation: string): Promise<SearchResult[]> {
    try {
      const results = await db.getAllAsync(
        `SELECT * FROM verses WHERE translation = ? ORDER BY book, chapter, verse`,
        [translation]
      );
      return results;
    } catch (error) {
      console.error('Error getting cached verses:', error);
      return [];
    }
  }

  /**
   * Check if a specific verse is cached
   */
  async isVerseCached(
    book: string,
    chapter: number,
    verse: number,
    translation: string
  ): Promise<boolean> {
    try {
      const result = await db.getFirstAsync(
        `SELECT id FROM verses WHERE book = ? AND chapter = ? AND verse = ? AND translation = ?`,
        [book, chapter, verse, translation]
      );
      return !!result;
    } catch (error) {
      console.error('Error checking if verse is cached:', error);
      return false;
    }
  }

  /**
   * Get cache size estimate in MB
   */
  async getCacheSizeMB(): Promise<number> {
    try {
      const stats = await this.getCacheStats();
      return stats.estimatedSizeMB;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      await db.runAsync(`DELETE FROM verses`);
      await db.runAsync(`DELETE FROM translations WHERE isDownloaded = 1`);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }
}

export default new CacheService();
