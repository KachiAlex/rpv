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
    const isOnline = NetworkStatus.getOnline();
    
    console.log('[CacheManager] getAllTranslations - Starting load, isOnline:', isOnline);
    
    // When online, always try Firestore first to get the latest data
    if (isOnline) {
      try {
        const { db } = await import('../firebase').then(m => m.getFirebase());
        if (db) {
          console.log('[CacheManager] Loading translations from Firestore...');
          const translations = await this.repository.getAllTranslations();
          console.log('[CacheManager] Loaded', translations.length, 'translations from Firestore:', translations.map(t => ({ id: t.id, name: t.name, booksCount: t.books?.length || 0 })));
          
          // Update all caches with latest Firestore data
          if (translations.length > 0) {
            translations.forEach(t => {
              this.memoryCache.set(t.id, t);
              this.indexedDB.saveTranslation(t).catch(() => {});
            });
            
            console.log('[CacheManager] Returning', translations.length, 'translations from Firestore');
            return translations;
          } else {
            console.log('[CacheManager] No translations found in Firestore, trying IndexedDB...');
          }
        } else {
          console.warn('[CacheManager] Firestore DB not available');
        }
      } catch (error) {
        console.warn('[CacheManager] Firestore read failed, trying IndexedDB:', error);
      }
    }

    // Fallback to IndexedDB (for offline or if Firestore fails)
    try {
      console.log('[CacheManager] Loading translations from IndexedDB...');
      const cached = await this.indexedDB.getAllTranslations();
      console.log('[CacheManager] Loaded', cached.length, 'translations from IndexedDB:', cached.map(t => ({ id: t.id, name: t.name, booksCount: t.books?.length || 0 })));
      
      if (cached.length > 0) {
        // Update memory cache
        cached.forEach(t => this.memoryCache.set(t.id, t));
        
        // If online, try to refresh from Firestore in background
        if (isOnline) {
          console.log('[CacheManager] Refreshing from Firestore in background...');
          this.refreshFromFirestore().catch((err) => {
            console.warn('[CacheManager] Background refresh failed:', err);
          });
        }
        
        console.log('[CacheManager] Returning', cached.length, 'translations from IndexedDB');
        return cached;
      }
    } catch (error) {
      console.warn('[CacheManager] IndexedDB read failed:', error);
    }

    // If offline and Firestore failed, try Firestore one more time (might be cached)
    if (!isOnline) {
      try {
        const { db } = await import('../firebase').then(m => m.getFirebase());
        if (db) {
          const translations = await this.repository.getAllTranslations();
          
          if (translations.length > 0) {
            // Update all caches
            translations.forEach(t => {
              this.memoryCache.set(t.id, t);
              this.indexedDB.saveTranslation(t).catch(() => {});
            });
            
            return translations;
          }
        }
      } catch (error) {
        console.warn('Firestore read failed (offline fallback):', error);
      }
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
        // Always save all books to Firestore
        const booksToWrite = translation.books || [];
        if (booksToWrite.length > 0) {
          // Save all books (chunked storage handles large datasets)
          await this.repository.saveBooks(translation.id, translation.name, booksToWrite);
        } else {
          // Save empty translation metadata
          await this.repository.saveTranslation(translation);
        }
      } else if (!isOnline) {
        // Queue for later sync
        await this.offlineQueue.addOperation({
          type: 'saveTranslation',
          data: translation,
        });
      } else if (!isAuthenticated) {
        // Queue for when user authenticates
        console.warn('User not authenticated, queuing translation save');
        await this.offlineQueue.addOperation({
          type: 'saveTranslation',
          data: translation,
        });
      }
    } catch (error) {
      const message = String(error?.toString?.() || error);
      const permissionDenied = message.includes('Missing or insufficient permissions') || message.includes('permission-denied');
      console.error('Error saving translation to Firestore:', error);
      if (!permissionDenied) {
        // Queue for retry only for transient errors
        await this.offlineQueue.addOperation({
          type: 'saveTranslation',
          data: translation,
        });
      } else {
        console.warn('Permission denied saving translation - user may need to authenticate');
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
      
      console.log('[CacheManager] mergeTranslation - Saving to Firestore:', {
        translationId: merged.id,
        translationName: merged.name,
        booksCount: merged.books?.length || 0,
        isOnline,
        isAuthenticated,
        hasDb: !!db,
        userId: auth?.currentUser?.uid || 'none'
      });
      
      if (db && isOnline && isAuthenticated) {
        // Save ALL merged books (not just incoming ones) to ensure persistence
        if ((merged.books || []).length > 0) {
          console.log('[CacheManager] Saving', merged.books.length, 'books to Firestore for translation:', merged.id);
          await this.repository.saveBooks(merged.id, merged.name, merged.books);
          console.log('[CacheManager] Successfully saved translation to Firestore:', merged.id);
        } else {
          await this.repository.saveTranslation(merged);
          console.log('[CacheManager] Saved empty translation metadata to Firestore:', merged.id);
        }
      } else if (!isOnline) {
        console.warn('[CacheManager] Offline - queuing translation for later sync:', merged.id);
        await this.offlineQueue.addOperation({
          type: 'mergeTranslation',
          data: merged,
        });
      } else if (!isAuthenticated) {
        console.warn('[CacheManager] Not authenticated - queuing translation for later sync:', merged.id);
        await this.offlineQueue.addOperation({
          type: 'mergeTranslation',
          data: merged,
        });
      } else if (!db) {
        console.warn('[CacheManager] Firestore not initialized - queuing translation:', merged.id);
        await this.offlineQueue.addOperation({
          type: 'mergeTranslation',
          data: merged,
        });
      }
    } catch (error) {
      const message = String(error?.toString?.() || error);
      const permissionDenied = message.includes('Missing or insufficient permissions') || message.includes('permission-denied');
      console.error('[CacheManager] Error saving translation to Firestore:', {
        translationId: merged.id,
        error: message,
        permissionDenied
      });
      if (!permissionDenied) {
        await this.offlineQueue.addOperation({
          type: 'mergeTranslation',
          data: merged,
        });
      } else {
        console.error('[CacheManager] Permission denied - user may need to authenticate or have admin role');
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
    // Merge all books from newTranslation into existing
    const existingBooksMap = new Map<string, typeof existing.books[number]>();
    existing.books.forEach(book => {
      existingBooksMap.set(book.name, book);
    });

    // Process each book in newTranslation
    newTranslation.books.forEach(newBook => {
      const existingBook = existingBooksMap.get(newBook.name);
      
      if (existingBook) {
        // Merge chapters for this book
        const chaptersMap = new Map<number, typeof existingBook.chapters[number]>();
        existingBook.chapters.forEach(ch => {
          chaptersMap.set(ch.number, ch);
        });

        // Process each chapter in newBook
        newBook.chapters.forEach(newChapter => {
          const existingChapter = chaptersMap.get(newChapter.number);
          
          if (existingChapter) {
            // Merge verses for this chapter
            const versesMap = new Map<number, typeof existingChapter.verses[number]>();
            existingChapter.verses.forEach(v => {
              versesMap.set(v.number, v);
            });

            // Update or add verses from newChapter
            newChapter.verses.forEach(newVerse => {
              versesMap.set(newVerse.number, newVerse);
            });

            // Update the chapter with merged verses
            const mergedVerses = Array.from(versesMap.values()).sort((a, b) => a.number - b.number);
            chaptersMap.set(newChapter.number, { ...existingChapter, verses: mergedVerses });
          } else {
            // Add new chapter
            chaptersMap.set(newChapter.number, newChapter);
          }
        });

        // Update the book with merged chapters
        const mergedChapters = Array.from(chaptersMap.values()).sort((a, b) => a.number - b.number);
        existingBooksMap.set(newBook.name, { ...existingBook, chapters: mergedChapters });
      } else {
        // Add new book
        existingBooksMap.set(newBook.name, newBook);
      }
    });

    // Convert back to array
    const updatedBooks = Array.from(existingBooksMap.values());
    
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
    try {
      const { auth } = await import('../firebase').then(m => m.getFirebase());
      const isAuthenticated = !!auth && !!auth.currentUser;
      if (!isAuthenticated) {
        // Skip processing when user is not signed in to avoid permission errors
        return;
      }
    } catch {
      return;
    }

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

