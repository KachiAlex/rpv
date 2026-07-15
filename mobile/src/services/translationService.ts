import axios, { AxiosInstance } from 'axios';
import cacheService from './cacheService';
import * as db from './database';

export interface Translation {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  size: number;
  isDownloaded: boolean;
  downloadedAt?: number;
}

export interface TranslationDownloadProgress {
  translationId: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

class TranslationService {
  private apiClient: AxiosInstance;
  private apiUrl: string;
  private downloadProgress: Map<string, TranslationDownloadProgress> = new Map();
  private selectedTranslation: string = 'KJV';

  constructor() {
    this.apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
    });
  }

  /**
   * Fetch available translations from backend
   */
  async fetchAvailableTranslations(): Promise<Translation[]> {
    try {
      const response = await this.apiClient.get('/api/translations');
      const translations = response.data.translations || [];

      // Check which ones are already downloaded
      const cachedTranslations = await cacheService.getCachedTranslations();
      const cachedIds = new Set(cachedTranslations.map((t: any) => t.id));

      return translations.map((t: any) => ({
        ...t,
        isDownloaded: cachedIds.has(t.id),
      }));
    } catch (error) {
      console.error('Error fetching translations:', error);
      // Return cached translations as fallback
      const cached = await cacheService.getCachedTranslations();
      return cached.map((t: any) => ({
        ...t,
        isDownloaded: true,
      }));
    }
  }

  /**
   * Get locally available translations
   */
  async getLocalTranslations(): Promise<Translation[]> {
    try {
      const cached = await cacheService.getCachedTranslations();
      return cached.map((t: any) => ({
        ...t,
        isDownloaded: true,
      }));
    } catch (error) {
      console.error('Error getting local translations:', error);
      return [];
    }
  }

  /**
   * Download a translation
   */
  async downloadTranslation(translationId: string): Promise<boolean> {
    try {
      this.setDownloadProgress(translationId, 0, 'downloading');

      // Get translation metadata
      const translations = await this.fetchAvailableTranslations();
      const translation = translations.find((t) => t.id === translationId);

      if (!translation) {
        this.setDownloadProgress(translationId, 0, 'failed', 'Translation not found');
        return false;
      }

      // Download translation data
      const response = await this.apiClient.get(`/api/translations/${translationId}/download`, {
        onDownloadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded / (progressEvent.total || 1)) * 100
          );
          this.setDownloadProgress(translationId, progress, 'downloading');
        },
      });

      const verses = response.data.verses || [];

      // Cache all verses
      for (let i = 0; i < verses.length; i++) {
        const verse = verses[i];
        await db.cacheVerse(
          verse.id,
          verse.book,
          verse.chapter,
          verse.verse,
          verse.text,
          translation.abbreviation
        );

        // Update progress
        const progress = Math.round(((i + 1) / verses.length) * 100);
        this.setDownloadProgress(translationId, progress, 'downloading');
      }

      // Cache translation metadata
      await cacheService.cacheTranslation(
        translation.id,
        translation.name,
        translation.abbreviation,
        translation.language,
        translation.size
      );

      this.setDownloadProgress(translationId, 100, 'completed');
      return true;
    } catch (error) {
      console.error(`Error downloading translation ${translationId}:`, error);
      this.setDownloadProgress(
        translationId,
        0,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }

  /**
   * Remove a translation
   */
  async removeTranslation(translationId: string): Promise<boolean> {
    try {
      await cacheService.removeTranslation(translationId);
      this.downloadProgress.delete(translationId);
      return true;
    } catch (error) {
      console.error(`Error removing translation ${translationId}:`, error);
      return false;
    }
  }

  /**
   * Set selected translation
   */
  async setSelectedTranslation(abbreviation: string): Promise<void> {
    try {
      this.selectedTranslation = abbreviation;
      await db.savePreference('selected_translation', abbreviation);
    } catch (error) {
      console.error('Error setting selected translation:', error);
    }
  }

  /**
   * Get selected translation
   */
  async getSelectedTranslation(): Promise<string> {
    try {
      const saved = await db.getPreference('selected_translation');
      if (saved) {
        this.selectedTranslation = saved;
        return saved;
      }
      return this.selectedTranslation;
    } catch (error) {
      console.error('Error getting selected translation:', error);
      return this.selectedTranslation;
    }
  }

  /**
   * Get download progress
   */
  getDownloadProgress(translationId: string): TranslationDownloadProgress | undefined {
    return this.downloadProgress.get(translationId);
  }

  /**
   * Get all download progress
   */
  getAllDownloadProgress(): TranslationDownloadProgress[] {
    return Array.from(this.downloadProgress.values());
  }

  /**
   * Set download progress
   */
  private setDownloadProgress(
    translationId: string,
    progress: number,
    status: 'pending' | 'downloading' | 'completed' | 'failed',
    error?: string
  ): void {
    this.downloadProgress.set(translationId, {
      translationId,
      progress,
      status,
      error,
    });
  }

  /**
   * Check if translation is downloaded
   */
  async isTranslationDownloaded(abbreviation: string): Promise<boolean> {
    try {
      const cached = await cacheService.getCachedTranslations();
      return cached.some((t: any) => t.abbreviation === abbreviation);
    } catch (error) {
      console.error('Error checking if translation is downloaded:', error);
      return false;
    }
  }

  /**
   * Get translation by abbreviation
   */
  async getTranslationByAbbreviation(abbreviation: string): Promise<Translation | null> {
    try {
      const cached = await cacheService.getCachedTranslations();
      const translation = cached.find((t: any) => t.abbreviation === abbreviation);
      return translation || null;
    } catch (error) {
      console.error('Error getting translation:', error);
      return null;
    }
  }

  /**
   * Get cache size for a translation
   */
  async getTranslationCacheSize(abbreviation: string): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM verses WHERE translation = ?',
        [abbreviation]
      );
      const verseCount = result?.count || 0;
      // Rough estimate: 500 bytes per verse
      return (verseCount * 500) / (1024 * 1024); // Convert to MB
    } catch (error) {
      console.error('Error getting translation cache size:', error);
      return 0;
    }
  }

  /**
   * Get total cache size for all translations
   */
  async getTotalCacheSize(): Promise<number> {
    try {
      const stats = await cacheService.getCacheStats();
      return stats.estimatedSizeMB;
    } catch (error) {
      console.error('Error getting total cache size:', error);
      return 0;
    }
  }
}

export default new TranslationService();
