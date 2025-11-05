import { IndexedDBCache } from './indexeddb-cache';
import { FirestoreRepository } from '../repositories/firestore-repository';
import { OfflineQueue } from './offline-queue';
import { NetworkStatus } from '../utils/network-status';
import type { Translation, ProjectorRef } from '../types';

export class CacheManager {
  private indexedDB: IndexedDBCache;
  private repository: FirestoreRepository;
  private offlineQueue: OfflineQueue;
  private memoryCache: Map<string, Translation> = new Map();

  constructor() {
    this.indexedDB = new IndexedDBCache();
    this.repository = new FirestoreRepository();
    this.offlineQueue = new OfflineQueue();
    
    // Process queue when coming back online
    NetworkStatus.subscribe(async (online) => {
      if (online) {
        await this.processPendingOperations();
      }
    });
  }

  // Multi-layer cache: Memory → IndexedDB → Firestore
  async getTranslation(id: string): Promise<Translation | null> {
    // Layer 1: Memory cache
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id)!;
    }

    // Layer 2: IndexedDB cache
    try {
      const cached = await this.indexedDB.getTranslation(id);
      if (cached) {
        this.memoryCache.set(id, cached);
        return cached;
      }
    } catch (error) {
      console.warn('IndexedDB cache read failed, trying Firestore:', error);
    }

    // Layer 3: Firestore
    try {
      const { db } = await import('../firebase').then(m => m.getFirebase());
      if (db) {
        const translation = await this.repository.getTranslation(id);
        if (translation) {
          // Update caches
          this.memoryCache.set(id, translation);
          await this.indexedDB.saveTranslation(translation).catch(() => {});
        }
        return translation;
      }
    } catch (error) {
      console.warn('Firestore read failed:', error);
    }

    return null;
  }

  async getAllTranslations(): Promise<Translation[]> {
    // Try IndexedDB first (faster for offline)
    try {
      const cached = await this.indexedDB.getAllTranslations();
      if (cached.length > 0) {
        // Update memory cache
        cached.forEach(t => this.memoryCache.set(t.id, t));
        
        // Try to refresh from Firestore in background
        this.refreshFromFirestore().catch(() => {});
        
        return cached;
      }
    } catch (error) {
      console.warn('IndexedDB read failed, trying Firestore:', error);
    }

    // Fallback to Firestore
    try {
      const { db } = await import('../firebase').then(m => m.getFirebase());
      if (db) {
        const translations = await this.repository.getAllTranslations();
        
        // Update all caches
        translations.forEach(t => {
          this.memoryCache.set(t.id, t);
          this.indexedDB.saveTranslation(t).catch(() => {});
        });
        
        return translations;
      }
    } catch (error) {
      console.warn('Firestore read failed:', error);
    }

    return [];
  }

  async saveTranslation(translation: Translation): Promise<void> {
    // Update memory cache immediately
    this.memoryCache.set(translation.id, translation);

    // Save to IndexedDB (fast, local)
    await this.indexedDB.saveTranslation(translation).catch(() => {});

    // Save to Firestore (async, can fail)
    const isOnline = NetworkStatus.getOnline();
    try {
      const { db, auth } = await import('../firebase').then(m => m.getFirebase());
      const isAuthenticated = !!auth && !!auth.currentUser;
      if (db && isOnline && isAuthenticated) {
        await this.repository.saveTranslation(translation);
      } else if (!isOnline) {
        // Queue for later sync
        await this.offlineQueue.addOperation({
          type: 'saveTranslation',
          data: translation,
        });
      }
    } catch (error) {
      const message = String(error?.toString?.() || error);
      const permissionDenied = message.includes('Missing or insufficient permissions') || message.includes('permission-denied');
      if (!permissionDenied) {
        // Queue for retry only for transient errors
        await this.offlineQueue.addOperation({
          type: 'saveTranslation',
          data: translation,
        });
      }
    }
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

    // Update memory cache immediately
    this.memoryCache.set(merged.id, merged);

    // Save to IndexedDB
    await this.indexedDB.saveTranslation(merged).catch(() => {});

    // Save to Firestore or queue
    const isOnline = NetworkStatus.getOnline();
    try {
      const { db, auth } = await import('../firebase').then(m => m.getFirebase());
      const isAuthenticated = !!auth && !!auth.currentUser;
      if (db && isOnline && isAuthenticated) {
        await this.repository.saveTranslation(merged);
      } else if (!isOnline) {
        await this.offlineQueue.addOperation({
          type: 'mergeTranslation',
          data: merged,
        });
      }
    } catch (error) {
      const message = String(error?.toString?.() || error);
      const permissionDenied = message.includes('Missing or insufficient permissions') || message.includes('permission-denied');
      if (!permissionDenied) {
        await this.offlineQueue.addOperation({
          type: 'mergeTranslation',
          data: merged,
        });
      }
    }

    return merged;
  }

  async getProjectionChannel(channelId: string): Promise<ProjectorRef | null> {
    // Try IndexedDB first
    try {
      const cached = await this.indexedDB.getProjectionChannel(channelId);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('IndexedDB read failed:', error);
    }

    // Try Firestore
    try {
      const { db } = await import('../firebase').then(m => m.getFirebase());
      if (db) {
        const ref = await this.repository.getProjectionChannel(channelId);
        if (ref) {
          await this.indexedDB.saveProjectionChannel(channelId, ref).catch(() => {});
        }
        return ref;
      }
    } catch (error) {
      console.warn('Firestore read failed:', error);
    }

    return null;
  }

  async saveProjectionChannel(channelId: string, ref: ProjectorRef): Promise<void> {
    // Save to IndexedDB immediately
    await this.indexedDB.saveProjectionChannel(channelId, ref).catch(() => {});

    // Save to Firestore
    const isOnline = NetworkStatus.getOnline();
    try {
      const { db } = await import('../firebase').then(m => m.getFirebase());
      if (db && isOnline) {
        await this.repository.saveProjectionChannel(channelId, ref);
      } else if (!isOnline) {
        // Queue for later sync
        await this.offlineQueue.addOperation({
          type: 'sendToProjector',
          data: { channelId, ref },
        });
      }
    } catch (error) {
      console.warn('Firestore save failed, queuing for later:', error);
      await this.offlineQueue.addOperation({
        type: 'sendToProjector',
        data: { channelId, ref },
      });
    }
  }

  private async refreshFromFirestore(): Promise<void> {
    try {
      const { db } = await import('../firebase').then(m => m.getFirebase());
      if (!db) return;

      const translations = await this.repository.getAllTranslations();
      
      // Update caches
      translations.forEach(t => {
        this.memoryCache.set(t.id, t);
        this.indexedDB.saveTranslation(t).catch(() => {});
      });
    } catch (error) {
      // Silent fail - offline mode
    }
  }

  private mergeTranslations(existing: Translation, newTranslation: Translation): Translation {
    const existingBook = existing.books.find(b => b.name === newTranslation.books[0]?.name);
    
    let updatedBooks;
    
    if (existingBook) {
      const newBook = newTranslation.books[0];
      const updatedChapters = [...existingBook.chapters];
      
      newBook.chapters.forEach(newChapter => {
        const chapterIndex = updatedChapters.findIndex(c => c.number === newChapter.number);
        if (chapterIndex >= 0) {
          const existingChapter = updatedChapters[chapterIndex];
          const updatedVerses = [...existingChapter.verses];
          
          newChapter.verses.forEach(newVerse => {
            const verseIndex = updatedVerses.findIndex(v => v.number === newVerse.number);
            if (verseIndex >= 0) {
              updatedVerses[verseIndex] = newVerse;
            } else {
              updatedVerses.push(newVerse);
            }
          });
          
          updatedVerses.sort((a, b) => a.number - b.number);
          updatedChapters[chapterIndex] = { ...existingChapter, verses: updatedVerses };
        } else {
          updatedChapters.push(newChapter);
        }
      });
      
      updatedChapters.sort((a, b) => a.number - b.number);
      updatedBooks = existing.books.map(b => 
        b.name === existingBook.name ? { ...b, chapters: updatedChapters } : b
      );
    } else {
      updatedBooks = [...existing.books, newTranslation.books[0]];
    }
    
    return {
      ...existing,
      name: newTranslation.name || existing.name,
      books: updatedBooks,
      updatedAt: new Date(),
    };
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  async clearAllCaches(): Promise<void> {
    this.memoryCache.clear();
    await this.indexedDB.clearCache();
    await this.offlineQueue.clearQueue();
  }

  private async processPendingOperations(): Promise<void> {
    await this.offlineQueue.processQueue({
      saveTranslation: async (translation: Translation) => {
        const { db } = await import('../firebase').then(m => m.getFirebase());
        if (db) {
          await this.repository.saveTranslation(translation);
        }
      },
      mergeTranslation: async (translation: Translation) => {
        await this.mergeTranslation(translation);
      },
      sendToProjector: async (data: { channelId: string; ref: ProjectorRef }) => {
        const { db } = await import('../firebase').then(m => m.getFirebase());
        if (db) {
          await this.repository.saveProjectionChannel(data.channelId, data.ref);
        }
      },
    });
  }
}

