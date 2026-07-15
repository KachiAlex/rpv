import searchService, { SearchResult } from './searchService';
import cacheService from './cacheService';

export interface VerseCache {
  book: string;
  chapter: number;
  verses: SearchResult[];
  timestamp: number;
}

class BibleReaderService {
  private verseCache: Map<string, VerseCache> = new Map();
  private maxCacheSize = 10; // Cache last 10 chapters
  private preloadBuffer = 2; // Preload 2 chapters ahead/behind

  /**
   * Get verses for a chapter with caching
   */
  async getChapterVerses(
    book: string,
    chapter: number,
    translation: string
  ): Promise<SearchResult[]> {
    const cacheKey = `${book}-${chapter}-${translation}`;

    // Check memory cache first
    const cached = this.verseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      // Cache valid for 1 hour
      return cached.verses;
    }

    // Fetch from search service
    const verses = await searchService.getChapter(book, chapter, translation);

    // Store in memory cache
    this.verseCache.set(cacheKey, {
      book,
      chapter,
      verses,
      timestamp: Date.now(),
    });

    // Cleanup old cache if needed
    if (this.verseCache.size > this.maxCacheSize) {
      const oldestKey = Array.from(this.verseCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      this.verseCache.delete(oldestKey);
    }

    return verses;
  }

  /**
   * Preload adjacent chapters for smooth navigation
   */
  async preloadAdjacentChapters(
    book: string,
    chapter: number,
    translation: string
  ): Promise<void> {
    try {
      // Preload previous chapter
      if (chapter > 1) {
        this.getChapterVerses(book, chapter - 1, translation).catch((error) => {
          console.error('Error preloading previous chapter:', error);
        });
      }

      // Preload next chapter
      this.getChapterVerses(book, chapter + 1, translation).catch((error) => {
        console.error('Error preloading next chapter:', error);
      });
    } catch (error) {
      console.error('Error preloading chapters:', error);
    }
  }

  /**
   * Get a specific verse
   */
  async getVerse(
    book: string,
    chapter: number,
    verse: number,
    translation: string
  ): Promise<SearchResult | null> {
    try {
      return await searchService.getVerse(book, chapter, verse, translation);
    } catch (error) {
      console.error('Error getting verse:', error);
      return null;
    }
  }

  /**
   * Search for verses
   */
  async searchVerses(query: string, translation: string): Promise<SearchResult[]> {
    try {
      return await searchService.search({
        query,
        translation,
        limit: 50,
      });
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.verseCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    let size = 0;
    this.verseCache.forEach((cache) => {
      size += cache.verses.length * 500; // Rough estimate
    });
    return {
      size: size / (1024 * 1024), // Convert to MB
      entries: this.verseCache.size,
    };
  }

  /**
   * Format verse reference
   */
  formatVerseReference(verse: SearchResult): string {
    return `${verse.book} ${verse.chapter}:${verse.verse}`;
  }

  /**
   * Format full verse with reference
   */
  formatFullVerse(verse: SearchResult): string {
    return `${this.formatVerseReference(verse)} (${verse.translation})\n\n${verse.text}`;
  }

  /**
   * Get verse range
   */
  async getVerseRange(
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    translation: string
  ): Promise<SearchResult[]> {
    try {
      const verses = await this.getChapterVerses(book, chapter, translation);
      return verses.filter((v) => v.verse >= startVerse && v.verse <= endVerse);
    } catch (error) {
      console.error('Error getting verse range:', error);
      return [];
    }
  }
}

export default new BibleReaderService();
