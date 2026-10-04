import { IndexedDBCache } from './indexeddb-cache';
import { OfflineQueue } from './offline-queue';
import { NetworkStatus } from '../utils/network-status';
import type { Translation, ProjectorRef } from '../types';

export class OptimizedCacheManager {
  private indexedDB: IndexedDBCache;
  private offlineQueue: OfflineQueue;
  private metadataCache: Map<string, Translation> = new Map();
  private contentCache: Map<string, Translation> = new Map();
  private bookCache: Map<string, { name: string; chapters: any[]; published?: boolean }> = new Map();
  private chapterCache: Map<string, { number: number; verses: any[] }> = new Map();

  constructor() {
    this.indexedDB = new IndexedDBCache();
    this.offlineQueue = new OfflineQueue();
    
    // Process queue when coming back online
    NetworkStatus.subscribe(async (online) => {
      if (online) {
        await this.processPendingOperations();
      }
    });
  }

  // OPTIMIZED: Load only metadata initially (10-100x faster)
  async getAllTranslations(): Promise<Translation[]> {
    const isOnline = NetworkStatus.getOnline();
    
    console.log('[OptimizedCacheManager] getAllTranslations - Starting metadata load, isOnline:', isOnline);
    
    // Check if we're in a server environment (during build/SSR)
    if (typeof window === 'undefined') {
      console.log('[OptimizedCacheManager] Server-side environment detected, returning empty array');
      return [];
    }
    
    // Load from IndexedDB
    try {
      console.log('[OptimizedCacheManager] Loading translations from IndexedDB...');
      const cached = await this.indexedDB.getAllTranslations();
      console.log('[OptimizedCacheManager] Loaded', cached.length, 'translations from IndexedDB');
      
      if (cached.length > 0) {
        cached.forEach(t => this.metadataCache.set(t.id, t));
        console.log('[OptimizedCacheManager] Returning', cached.length, 'translations from IndexedDB');
        return cached;
      }
    } catch (error) {
      console.warn('[OptimizedCacheManager] IndexedDB read failed:', error);
    }

    return [];
  }

  // NEW: Load full translation content on demand
  async getTranslationWithContent(id: string): Promise<Translation | null> {
    // Check content cache first
    if (this.contentCache.has(id)) {
      console.log('[OptimizedCacheManager] Returning translation from content cache:', id);
      return this.contentCache.get(id)!;
    }

    // Check if we have metadata and need to load content
    const metadata = this.metadataCache.get(id);
    if (metadata && (metadata as any)._isMetadataOnly) {
      console.log('[OptimizedCacheManager] Loading full content for metadata-only translation:', id);
      
      try {
        const fullTranslation = await this.indexedDB.getTranslation(id);
        if (fullTranslation) {
          this.contentCache.set(id, fullTranslation);
          return fullTranslation;
        }
      } catch (error) {
        console.warn('[OptimizedCacheManager] Error loading full translation content:', error);
      }
    }

    // Fallback to regular cache lookup
    return this.getTranslation(id);
  }

  // NEW: Load specific book content on demand
  async getBookContent(translationId: string, bookName: string): Promise<{ name: string; chapters: any[]; published?: boolean } | null> {
    const cacheKey = `${translationId}:${bookName}`;
    
    // Check book cache first
    if (this.bookCache.has(cacheKey)) {
      console.log('[OptimizedCacheManager] Returning book from cache:', bookName);
      return this.bookCache.get(cacheKey)!;
    }

    try {
      console.log('[OptimizedCacheManager] Loading book content on demand:', bookName, 'from translation:', translationId);
      const translation = await this.indexedDB.getTranslation(translationId);
      if (translation) {
        const book = translation.books.find(b => b.name === bookName);
        if (book) {
          this.bookCache.set(cacheKey, book);
          return book;
        }
      }
    } catch (error) {
      console.warn('[OptimizedCacheManager] Error loading book content:', error);
    }

    return null;
  }

  // NEW: Load specific chapter content on demand (most granular)
  async getChapterContent(translationId: string, bookName: string, chapterNumber: number): Promise<{ number: number; verses: any[] } | null> {
    const cacheKey = `${translationId}:${bookName}:${chapterNumber}`;
    
    // Check chapter cache first
    if (this.chapterCache.has(cacheKey)) {
      console.log('[OptimizedCacheManager] Returning chapter from cache:', bookName, chapterNumber);
      return this.chapterCache.get(cacheKey)!;
    }

    try {
      console.log('[OptimizedCacheManager] Loading chapter content on demand:', bookName, chapterNumber, 'from translation:', translationId);
      const translation = await this.indexedDB.getTranslation(translationId);
      if (translation) {
        const book = translation.books.find(b => b.name === bookName);
        const chapter = book?.chapters.find(c => c.number === chapterNumber);
        if (chapter) {
          this.chapterCache.set(cacheKey, chapter);
          return chapter;
        }
      }
    } catch (error) {
      console.warn('[OptimizedCacheManager] Error loading chapter content:', error);
    }

    return null;
  }

  // Original method for backward compatibility
  async getTranslation(id: string): Promise<Translation | null> {
    // Check metadata cache first
    if (this.metadataCache.has(id)) {
      return this.metadataCache.get(id)!;
    }

    // Check content cache
    if (this.contentCache.has(id)) {
      return this.contentCache.get(id)!;
    }

    // Try IndexedDB
    try {
      const cached = await this.indexedDB.getTranslation(id);
      if (cached) {
        this.metadataCache.set(id, cached);
        return cached;
      }
    } catch (error) {
      console.warn('IndexedDB cache read failed:', error);
    }

    return null;
  }

  async saveTranslation(translation: Translation): Promise<void> {
    // Update both caches immediately
    this.metadataCache.set(translation.id, translation);
    this.contentCache.set(translation.id, translation);

    // Save to IndexedDB (fast, local)
    await this.indexedDB.saveTranslation(translation).catch(() => {});
  }

  async mergeTranslation(translation: Translation): Promise<Translation> {
    // Get existing from cache
    const existing = await this.getTranslation(translation.id);
    
    let merged: Translation;
    if (existing) {
      merged = this.mergeTranslations(existing, translation);
    } else {
      merged = translation;
    }

    // Update both caches immediately
    this.metadataCache.set(merged.id, merged);
    this.contentCache.set(merged.id, merged);

    // Save to IndexedDB
    await this.indexedDB.saveTranslation(merged).catch(() => {});

    return merged;
  }

  // Projection channel methods
  async getProjectionChannel(channelId: string): Promise<ProjectorRef | null> {
    try {
      const cached = await this.indexedDB.getProjectionChannel(channelId);
      return cached;
    } catch (error) {
      console.warn('IndexedDB read failed:', error);
    }

    return null;
  }

  async saveProjectionChannel(channelId: string, ref: ProjectorRef): Promise<void> {
    await this.indexedDB.saveProjectionChannel(channelId, ref).catch(() => {});
  }

  // Cache management methods
  private mergeTranslations(existing: Translation, newTranslation: Translation): Translation {
    // Same merge logic as before
    const existingBooksMap = new Map<string, typeof existing.books[number]>();
    existing.books.forEach(book => {
      existingBooksMap.set(book.name, book);
    });

    newTranslation.books.forEach(newBook => {
      const existingBook = existingBooksMap.get(newBook.name);
      
      if (existingBook) {
        const chaptersMap = new Map<number, typeof existingBook.chapters[number]>();
        existingBook.chapters.forEach(ch => {
          chaptersMap.set(ch.number, ch);
        });

        newBook.chapters.forEach(newChapter => {
          const existingChapter = chaptersMap.get(newChapter.number);
          
          if (existingChapter) {
            const versesMap = new Map<number, typeof existingChapter.verses[number]>();
            existingChapter.verses.forEach(v => {
              versesMap.set(v.number, v);
            });

            newChapter.verses.forEach(newVerse => {
              versesMap.set(newVerse.number, newVerse);
            });

            const mergedVerses = Array.from(versesMap.values()).sort((a, b) => a.number - b.number);
            chaptersMap.set(newChapter.number, { ...existingChapter, verses: mergedVerses });
          } else {
            chaptersMap.set(newChapter.number, newChapter);
          }
        });

        const mergedChapters = Array.from(chaptersMap.values()).sort((a, b) => a.number - b.number);
        existingBooksMap.set(newBook.name, { ...existingBook, chapters: mergedChapters });
      } else {
        existingBooksMap.set(newBook.name, newBook);
      }
    });

    const updatedBooks = Array.from(existingBooksMap.values());
    
    return {
      ...existing,
      name: newTranslation.name || existing.name,
      books: updatedBooks,
      updatedAt: new Date(),
    };
  }

  // Cache size management
  clearMemoryCache(): void {
    this.metadataCache.clear();
    this.contentCache.clear();
    this.bookCache.clear();
    this.chapterCache.clear();
  }

  // Limit cache sizes to prevent memory issues
  private limitCacheSize(): void {
    const MAX_CONTENT_CACHE = 5; // Only keep 5 full translations in memory
    const MAX_BOOK_CACHE = 20; // Keep 20 books in memory
    const MAX_CHAPTER_CACHE = 100; // Keep 100 chapters in memory

    if (this.contentCache.size > MAX_CONTENT_CACHE) {
      const entries = Array.from(this.contentCache.entries());
      const toRemove = entries.slice(0, entries.length - MAX_CONTENT_CACHE);
      toRemove.forEach(([key]) => this.contentCache.delete(key));
    }

    if (this.bookCache.size > MAX_BOOK_CACHE) {
      const entries = Array.from(this.bookCache.entries());
      const toRemove = entries.slice(0, entries.length - MAX_BOOK_CACHE);
      toRemove.forEach(([key]) => this.bookCache.delete(key));
    }

    if (this.chapterCache.size > MAX_CHAPTER_CACHE) {
      const entries = Array.from(this.chapterCache.entries());
      const toRemove = entries.slice(0, entries.length - MAX_CHAPTER_CACHE);
      toRemove.forEach(([key]) => this.chapterCache.delete(key));
    }
  }

  async clearAllCaches(): Promise<void> {
    this.clearMemoryCache();
    await this.indexedDB.clearCache();
    await this.offlineQueue.clearQueue();
  }

  // Book Publication Management Methods
  async updateBookPublicationStatus(translationId: string, bookName: string, published: boolean): Promise<void> {
    console.log('[OptimizedCacheManager] Updating book publication status in cache:', bookName, 'to:', published);
    
    // Update metadata cache
    const metadataTranslation = this.metadataCache.get(translationId);
    if (metadataTranslation) {
      const updatedBooks = metadataTranslation.books.map(book => 
        book.name === bookName ? { ...book, published } : book
      );
      this.metadataCache.set(translationId, { ...metadataTranslation, books: updatedBooks });
    }

    // Update content cache
    const contentTranslation = this.contentCache.get(translationId);
    if (contentTranslation) {
      const updatedBooks = contentTranslation.books.map(book => 
        book.name === bookName ? { ...book, published } : book
      );
      this.contentCache.set(translationId, { ...contentTranslation, books: updatedBooks });
    }

    // Update book cache
    const bookCacheKey = `${translationId}:${bookName}`;
    const cachedBook = this.bookCache.get(bookCacheKey);
    if (cachedBook) {
      this.bookCache.set(bookCacheKey, { ...cachedBook, published });
    }

    // Update IndexedDB
    try {
      const translation = await this.indexedDB.getTranslation(translationId);
      if (translation) {
        const updatedBooks = translation.books.map(book => 
          book.name === bookName ? { ...book, published } : book
        );
        await this.indexedDB.saveTranslation({ ...translation, books: updatedBooks });
      }
    } catch (error) {
      console.warn('Error updating book publication status in IndexedDB:', error);
    }
  }

  async filterTranslationsWithPublishedBooks(translations: Translation[]): Promise<Translation[]> {
    return translations.map(translation => ({
      ...translation,
      books: translation.books.filter(book => book.published !== false) // Include books where published is true or undefined
    })).filter(translation => translation.books.length > 0); // Only include translations that have published books
  }

  private async processPendingOperations(): Promise<void> {
    await this.offlineQueue.processQueue({
      saveTranslation: async (translation: Translation) => {
        await this.saveTranslation(translation);
      },
      mergeTranslation: async (translation: Translation) => {
        await this.mergeTranslation(translation);
      },
      sendToProjector: async (data: { channelId: string; ref: ProjectorRef }) => {
        await this.saveProjectionChannel(data.channelId, data.ref);
      },
      updateBookPublication: async (data: { translationId: string; bookName: string; published: boolean }) => {
        await this.updateBookPublicationStatus(data.translationId, data.bookName, data.published);
      },
      bulkUpdateBookPublication: async (data: { translationId: string; bookUpdates: Array<{ bookName: string; published: boolean }> }) => {
        for (const update of data.bookUpdates) {
          await this.updateBookPublicationStatus(data.translationId, update.bookName, update.published);
        }
      },
    });
  }

  async updateBookPublicationStatusWithOffline(translationId: string, bookName: string, published: boolean): Promise<void> {
    console.log('[OptimizedCacheManager] Updating book publication status with offline support:', bookName, 'to:', published);
    
    try {
      await this.updateBookPublicationStatus(translationId, bookName, published);
      await this.updateBookPublicationInLocalCache(translationId, bookName, published);
    } catch (error) {
      console.error('Error updating book publication status:', error);
      await this.offlineQueue.addOperation({
        type: 'updateBookPublication',
        data: { translationId, bookName, published }
      });
      await this.updateBookPublicationInLocalCache(translationId, bookName, published);
      throw error;
    }
  }

  async bulkUpdateBookPublicationStatusWithOffline(translationId: string, bookUpdates: Array<{ bookName: string; published: boolean }>): Promise<void> {
    console.log('[OptimizedCacheManager] Bulk updating book publication status with offline support for translation:', translationId);
    
    try {
      for (const update of bookUpdates) {
        await this.updateBookPublicationStatus(translationId, update.bookName, update.published);
      }
      for (const update of bookUpdates) {
        await this.updateBookPublicationInLocalCache(translationId, update.bookName, update.published);
      }
    } catch (error) {
      console.error('Error in bulk book publication status update:', error);
      await this.offlineQueue.addOperation({
        type: 'bulkUpdateBookPublication',
        data: { translationId, bookUpdates }
      });
      for (const update of bookUpdates) {
        await this.updateBookPublicationInLocalCache(translationId, update.bookName, update.published);
      }
      throw error;
    }
  }

  private async updateBookPublicationInLocalCache(translationId: string, bookName: string, published: boolean): Promise<void> {
    try {
      // Update in IndexedDB
      const translation = await this.indexedDB.getTranslation(translationId);
      if (translation) {
        const updatedBooks = translation.books.map(book => 
          book.name === bookName ? { ...book, published } : book
        );
        await this.indexedDB.saveTranslation({ ...translation, books: updatedBooks });
      }
    } catch (error) {
      console.warn('Error updating book publication status in IndexedDB:', error);
    }
  }
}