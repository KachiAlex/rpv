import { OptimizedCacheManager } from './optimized-cache-manager';
import type { Translation, ProjectorRef } from '../types';

export class CacheManager {
  private optimizedManager: OptimizedCacheManager;

  constructor() {
    // Use the optimized cache manager for all operations
    this.optimizedManager = new OptimizedCacheManager();
  }

  // Multi-layer cache: Memory → IndexedDB → Firestore
  async getTranslation(id: string): Promise<Translation | null> {
    return this.optimizedManager.getTranslation(id);
  }

  // NEW: Get translation with lazy loading - loads metadata first, content on demand
  async getTranslationLazy(id: string, loadContent: boolean = false): Promise<Translation | null> {
    if (loadContent) {
      return this.optimizedManager.getTranslationWithContent(id);
    }
    return this.optimizedManager.getTranslation(id);
  }

  // NEW: Load specific book content on demand
  async getBookContent(translationId: string, bookName: string): Promise<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> } | null> {
    return this.optimizedManager.getBookContent(translationId, bookName);
  }

  // NEW: Load specific chapter content on demand
  async getChapterContent(translationId: string, bookName: string, chapterNumber: number): Promise<{ number: number; verses: Array<{ number: number; text: string }> } | null> {
    return this.optimizedManager.getChapterContent(translationId, bookName, chapterNumber);
  }

  async getAllTranslations(): Promise<Translation[]> {
    return this.optimizedManager.getAllTranslations();
  }

  async saveTranslation(translation: Translation): Promise<void> {
    return this.optimizedManager.saveTranslation(translation);
  }

  async mergeTranslation(translation: Translation): Promise<Translation> {
    return this.optimizedManager.mergeTranslation(translation);
  }

  async getProjectionChannel(channelId: string): Promise<ProjectorRef | null> {
    return this.optimizedManager.getProjectionChannel(channelId);
  }

  async saveProjectionChannel(channelId: string, ref: ProjectorRef): Promise<void> {
    return this.optimizedManager.saveProjectionChannel(channelId, ref);
  }

  clearMemoryCache(): void {
    this.optimizedManager.clearMemoryCache();
  }

  async clearAllCaches(): Promise<void> {
    return this.optimizedManager.clearAllCaches();
  }
}

