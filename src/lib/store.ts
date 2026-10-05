import { create } from 'zustand';
import { HybridTranslationService } from './services/hybrid-translation-service';
import { ProjectionService } from './services/projection-service';
import type { Translation, Reference, ProjectorRef } from './types';

type BibleState = {
  translations: Translation[];
  current: Translation | null;
  projectorRef: ProjectorRef;
  channelId: string;
  isLoading: boolean;
  isLoadingContent: boolean; // NEW: Track content loading separately
  error: string | null;
  
  // Actions
  loadTranslations: () => Promise<void>;
  loadTranslationContent: (id: string) => Promise<Translation | null>; // NEW: Load full content on demand
  loadBookContent: (translationId: string, bookName: string) => Promise<void>; // NEW: Load specific book
  loadChapterContent: (translationId: string, bookName: string, chapterNumber: number) => Promise<void>; // NEW: Load specific chapter
  loadSample: () => Promise<void>;
  setCurrent: (id: string) => void;
  setReference: (ref: Reference) => void;
  setChannelId: (id: string) => void;
  sendToProjector: (ref: Reference) => Promise<void>;
  subscribeToChannel: () => Promise<void>;
  importJson: (data: { translations: Translation[] }) => Promise<void>;
  mergeTranslation: (translation: Translation) => Promise<void>;
  addOrUpdateVerse: (args: { translationId: string; book: string; chapter: number; verse: number; text: string }) => Promise<void>;
  
  // Book Publication Management Actions
  toggleBookPublicationStatus: (translationId: string, bookName: string) => Promise<boolean>;
  publishBook: (translationId: string, bookName: string) => Promise<void>;
  unpublishBook: (translationId: string, bookName: string) => Promise<void>;
  deleteBook: (translationId: string, bookName: string) => Promise<void>;
  bulkUpdateBookPublicationStatus: (translationId: string, bookUpdates: Array<{ bookName: string; published: boolean }>) => Promise<void>;
  getTranslationsWithPublishedBooks: () => Promise<Translation[]>;
  updateBookIntroduction: (translationId: string, bookName: string, introduction: string) => Promise<void>;
  
  // NEW: Get translations filtered for end users (only published books)
  getTranslationsForEndUsers: () => Translation[];
  loadTranslationsForEndUsers: () => Promise<void>;
  
  // Internal
  _translationService: HybridTranslationService;
  _projectionService: ProjectionService;
  _unsubscribers: { translations?: () => void; channel?: () => void };
};

const SAMPLE: Translation = {
  id: 'sample',
  name: 'Sample Translation',
  books: [
    {
      name: 'John',
      chapters: [
        { number: 3, verses: [ { number: 16, text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' } ] }
      ]
    }
  ]
};

// Permanent RPV translation - always available in the app
const PERMANENT_RPV: Translation = {
  id: 'RPV',
  name: 'Redemption Project Version',
  books: []
};

export const useBibleStore = create<BibleState>((set, get) => {
  const translationService = new HybridTranslationService();
  const projectionService = new ProjectionService();

  return {
    translations: [],
    current: null,
    projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
    channelId: 'default',
    isLoading: false,
    isLoadingContent: false,
    error: null,
    _translationService: translationService,
    _projectionService: projectionService,
    _unsubscribers: {},

    loadTranslations: async () => {
      // Skip loading during server-side rendering
      if (typeof window === 'undefined') {
        return;
      }
      
      set({ isLoading: true, error: null });
      try {
        console.log('[BibleStore] Starting OPTIMIZED translation loading (metadata-first)...');
        
        // OPTIMIZATION: Load metadata-only first for fast initial rendering
        const translations = await translationService.getAllTranslations();
        
        // Ensure permanent RPV translation exists
        const ensureRPVTranslation = async (existingTranslations: Translation[]): Promise<Translation[]> => {
          const hasRPV = existingTranslations.some(t => t.id === 'RPV');
          if (!hasRPV) {
            try {
              // Check if RPV exists in Firestore
              const rpvFromStore = await translationService.getTranslationLazy('RPV', false); // metadata only
              if (rpvFromStore) {
                // Use existing RPV from store
                return [rpvFromStore, ...existingTranslations.filter(t => t.id !== 'RPV')];
              } else {
                // Add RPV locally — do NOT write an empty manifest to the backend
                return [PERMANENT_RPV, ...existingTranslations];
              }
            } catch (error) {
              // If save fails, still add it locally
              console.warn('Could not save RPV translation to store, adding locally:', error);
              return [PERMANENT_RPV, ...existingTranslations];
            }
          } else {
            // RPV exists, but ensure it has the correct name and books
            const rpvIndex = existingTranslations.findIndex(t => t.id === 'RPV');
            if (rpvIndex >= 0) {
              const updated = [...existingTranslations];
              const rpv = updated[rpvIndex];
              // If RPV has no books, try to fetch them from the backend
              if (!rpv.books || rpv.books.length === 0) {
                try {
                  const rpvWithBooks = await translationService.getTranslationLazy('RPV', false);
                  if (rpvWithBooks && rpvWithBooks.books && rpvWithBooks.books.length > 0) {
                    updated[rpvIndex] = {
                      ...rpvWithBooks,
                      name: 'Redemption Project Version'
                    };
                    return updated;
                  }
                } catch (error) {
                  console.warn('[BibleStore] Could not fetch RPV books from backend:', error);
                }
              }
              updated[rpvIndex] = {
                ...rpv,
                name: 'Redemption Project Version'
              };
              return updated;
            }
            return existingTranslations;
          }
        };
        
        if (translations.length === 0) {
          // No translations: try to import built-in seed (KJV), then fallback to sample
          try {
            const seeds: Array<{ url: string }> = [
              { url: '/translations/kjv.json' },
            ];
            const loaded: Translation[] = [];
            for (const seed of seeds) {
              try {
                const res = await fetch(seed.url, { cache: 'no-store' });
                if (res.ok) {
                  const data = await res.json();
                  const list = (data?.translations ?? []) as Translation[];
                  if (Array.isArray(list) && list.length > 0) {
                    // Load seeds locally without writing to backend
                    for (const t of list) {
                      loaded.push(t);
                    }
                  }
                }
              } catch {}
            }

            if (loaded.length > 0) {
              const withRPV = await ensureRPVTranslation(loaded);
              set({ translations: withRPV, current: withRPV[0], isLoading: false });
              return;
            }
          } catch {}

          // Fallback to sample
          const withRPV = await ensureRPVTranslation([SAMPLE]);
          set({ translations: withRPV, current: withRPV[0], isLoading: false });
          return;
        }

        // Ensure RPV is present and at the beginning
        const translationsWithRPV = await ensureRPVTranslation(translations);

        // If only sample or missing the built-in seed, try to fetch and merge KJV once
        try {
          const haveIds = new Set(translationsWithRPV.map(t => t.id));
          const wanted = ['kjv'];
          const missing = wanted.filter(id => !haveIds.has(id));
          const newlyLoaded: Translation[] = [];
          if (missing.length > 0) {
            for (const id of missing) {
              const res = await fetch(`/translations/${id}.json`, { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                const list = (data?.translations ?? []) as Translation[];
                for (const t of list) {
                  // Do not write seeds to local storage; keep local
                  newlyLoaded.push(t);
                }
              }
            }
          }

          const mergedList = newlyLoaded.length > 0 ? [...translationsWithRPV, ...newlyLoaded] : translationsWithRPV;

          console.log('[BibleStore] Loaded', mergedList.length, 'translations (metadata-first optimization)');
          set({ 
            translations: mergedList, 
            current: mergedList[0] ?? null,
            isLoading: false 
          });
        } catch {
          set({ 
            translations: translationsWithRPV, 
            current: translationsWithRPV[0] ?? null,
            isLoading: false 
          });
        }

        // Subscribe to updates from backend (R2 via HybridTranslationService)
        try {
            const unsubscribe = translationService.subscribeToAllTranslations(async (incoming: Translation[]) => {
              const state = get();
              const existing = Array.isArray(state.translations) ? state.translations : [];
              const incomingArray = Array.isArray(incoming) ? incoming : [];

              // If we have incoming data, always use it
              if (incomingArray.length > 0) {
                const byId = new Map<string, typeof incomingArray[number] | typeof existing[number]>();
                const sizeOf = (t: Translation | undefined) => {
                  if (!t || !Array.isArray(t.books)) return 0;
                  return t.books.reduce((sumB, b) => {
                    if (!b || !Array.isArray(b.chapters)) return sumB;
                    return sumB + b.chapters.reduce((sumC, c) => {
                      if (!c || !Array.isArray(c.verses)) return sumC;
                      return sumC + c.verses.length;
                    }, 0);
                  }, 0);
                };

                // Seed existing first (for any translations not in incoming)
                for (const t of existing) {
                  if (t && t.id) {
                    const incomingTranslation = incomingArray.find(inc => inc && inc.id === t.id);
                    // Only keep existing if it's not in incoming or if it's larger (has more content)
                    if (!incomingTranslation || sizeOf(t) > sizeOf(incomingTranslation)) {
                      byId.set(t.id, t);
                    }
                  }
                }
                // Always prefer incoming data for metadata updates
                for (const t of incomingArray) {
                  if (t && t.id) {
                    const prev = byId.get(t.id) as Translation | undefined;
                    if (!prev) {
                      byId.set(t.id, t);
                    } else if ((t as any)._isMetadataOnly) {
                      // Incoming is metadata-only: merge metadata (book names, published status)
                      // but preserve existing loaded chapter/verse content
                      const existingBooksMap = new Map<string, typeof prev.books[number]>();
                      if (prev.books) {
                        for (const b of prev.books) {
                          existingBooksMap.set(b.name, b);
                        }
                      }
                      const mergedBooks = (t.books || []).map(metaBook => {
                        const existingBook = existingBooksMap.get(metaBook.name);
                        if (existingBook && existingBook.chapters && existingBook.chapters.length > 0) {
                          // Keep existing content, update metadata fields
                          return {
                            ...existingBook,
                            published: metaBook.published,
                            introduction: metaBook.introduction ?? existingBook.introduction,
                          };
                        }
                        // No existing content, use metadata-only book
                        return metaBook;
                      });
                      byId.set(t.id, {
                        ...t,
                        name: t.name || prev.name,
                        books: mergedBooks,
                      });
                    } else if (sizeOf(t) >= sizeOf(prev)) {
                      byId.set(t.id, t);
                    }
                  }
                }

                const merged = Array.from(byId.values()).filter((t): t is Translation => t !== null && t !== undefined) as Translation[];
                
                // Ensure RPV is always present and at the beginning
                const ensureRPVInMerged = async (translations: Translation[]): Promise<Translation[]> => {
                  const hasRPV = translations.some(t => t.id === 'RPV');
                  if (!hasRPV) {
                    try {
                      const rpvFromStore = await translationService.getTranslationLazy('RPV', false);
                      if (rpvFromStore) {
                        return [rpvFromStore, ...translations];
                      } else {
                        return [PERMANENT_RPV, ...translations];
                      }
                    } catch {
                      return [PERMANENT_RPV, ...translations];
                    }
                  } else {
                    // Ensure RPV has correct name, books, and is at the beginning
                    const rpvIndex = translations.findIndex(t => t.id === 'RPV');
                    const updated = [...translations];
                    const rpv = updated[rpvIndex];
                    // If RPV has no books, try to fetch from backend
                    if (rpv && (!rpv.books || rpv.books.length === 0)) {
                      try {
                        const rpvWithBooks = await translationService.getTranslationLazy('RPV', false);
                        if (rpvWithBooks && rpvWithBooks.books && rpvWithBooks.books.length > 0) {
                          if (rpvIndex > 0) {
                            updated.splice(rpvIndex, 1);
                            updated[0] = { ...rpvWithBooks, name: 'Redemption Project Version' };
                            return [updated[0], ...updated.slice(1)];
                          } else {
                            updated[0] = { ...rpvWithBooks, name: 'Redemption Project Version' };
                            return updated;
                          }
                        }
                      } catch {
                        // Fall through to default handling
                      }
                    }
                    if (rpvIndex > 0) {
                      const rpv = updated.splice(rpvIndex, 1)[0];
                      updated[0] = { ...rpv, name: 'Redemption Project Version' };
                      return [updated[0], ...updated.slice(1)];
                    } else if (rpvIndex === 0) {
                      updated[0] = { ...updated[0], name: 'Redemption Project Version' };
                      return updated;
                    }
                  }
                  return translations;
                };
                
                const finalMerged = await ensureRPVInMerged(merged);
                // Update current to reflect the latest merged data (preserves loaded book content)
                const updatedCurrent = state.current
                  ? finalMerged.find(t => t.id === state.current!.id) ?? finalMerged[0] ?? null
                  : finalMerged[0] ?? null;
                set({ translations: finalMerged, current: updatedCurrent });
              }
            });
            
            const unsubscribers = get()._unsubscribers;
            if (unsubscribers.translations) {
              unsubscribers.translations();
            }
            unsubscribers.translations = unsubscribe;
        } catch (error) {
          console.warn('Backend subscription failed, using cached data:', error);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load translations',
          isLoading: false 
        });
        // Fallback to sample data
        await get().loadSample();
      }
    },

    updateBookIntroduction: async (translationId: string, bookName: string, introduction: string) => {
      try {
        console.log('[BibleStore] Updating book introduction:', bookName, 'in translation:', translationId);
        const { _translationService } = get();
        await _translationService.updateBookIntroduction(translationId, bookName, introduction);

        const state = get();
        const updatedTranslations = state.translations.map((translation) => {
          if (translation.id !== translationId) return translation;
          return {
            ...translation,
            books: translation.books.map((book) =>
              book.name === bookName ? { ...book, introduction } : book
            ),
          };
        });

        set({
          translations: updatedTranslations,
          current:
            state.current?.id === translationId
              ? updatedTranslations.find((t) => t.id === translationId) || state.current
              : state.current,
        });
      } catch (error) {
        console.error('Error updating book introduction:', error);
        throw error;
      }
    },

    // NEW: Load full content for a specific translation on demand
    loadTranslationContent: async (id: string) => {
      set({ isLoadingContent: true });
      try {
        console.log('[BibleStore] Loading FULL CONTENT for translation:', id);
        const fullTranslation = await translationService.getTranslationLazy(id, true); // Load full content
        
        if (fullTranslation) {
          // Update the translation in the list with full content
          const state = get();
          const updatedTranslations = state.translations.map(t => 
            t.id === id ? fullTranslation : t
          );
          
          set({ 
            translations: updatedTranslations,
            current: state.current?.id === id ? fullTranslation : state.current,
            isLoadingContent: false
          });
          
          console.log('[BibleStore] Loaded full content for translation:', id, 'with', fullTranslation.books?.length || 0, 'books');
          return fullTranslation;
        }
        
        set({ isLoadingContent: false });
        return null;
      } catch (error) {
        console.error('Error loading translation content:', error);
        set({ isLoadingContent: false });
        return null;
      }
    },

    // NEW: Load specific book content on demand
    loadBookContent: async (translationId: string, bookName: string) => {
      try {
        console.log('[BibleStore] Loading book content on demand:', bookName, 'from translation:', translationId);
        const bookContent = await translationService.getBookContent(translationId, bookName);
        
        if (bookContent) {
          // Update the specific book in the translation
          const state = get();
          const updatedTranslations = state.translations.map(t => {
            if (t.id === translationId) {
              const updatedBooks = t.books.map(b => 
                b.name === bookName ? { ...b, ...bookContent } : b
              );
              return { ...t, books: updatedBooks };
            }
            return t;
          });
          
          set({ 
            translations: updatedTranslations,
            current: state.current?.id === translationId 
              ? updatedTranslations.find(t => t.id === translationId) || state.current
              : state.current
          });
          
          console.log('[BibleStore] Loaded book content:', bookName, 'with', bookContent.chapters?.length || 0, 'chapters');
        }
      } catch (error) {
        console.error('Error loading book content:', error);
      }
    },

    // NEW: Load specific chapter content on demand
    loadChapterContent: async (translationId: string, bookName: string, chapterNumber: number) => {
      try {
        console.log('[BibleStore] Loading chapter content on demand:', bookName, chapterNumber, 'from translation:', translationId);
        const chapterContent = await translationService.getChapterContent(translationId, bookName, chapterNumber);
        
        if (chapterContent) {
          // Update the specific chapter in the book
          const state = get();
          const updatedTranslations = state.translations.map(t => {
            if (t.id === translationId) {
              const updatedBooks = t.books.map(b => {
                if (b.name === bookName) {
                  const updatedChapters = b.chapters.map(c => 
                    c.number === chapterNumber ? chapterContent : c
                  );
                  // If chapter doesn't exist, add it
                  if (!updatedChapters.find(c => c.number === chapterNumber)) {
                    updatedChapters.push(chapterContent);
                    updatedChapters.sort((a, b) => a.number - b.number);
                  }
                  return { ...b, chapters: updatedChapters };
                }
                return b;
              });
              return { ...t, books: updatedBooks };
            }
            return t;
          });
          
          set({ 
            translations: updatedTranslations,
            current: state.current?.id === translationId 
              ? updatedTranslations.find(t => t.id === translationId) || state.current
              : state.current
          });
          
          console.log('[BibleStore] Loaded chapter content:', bookName, chapterNumber, 'with', chapterContent.verses?.length || 0, 'verses');
        }
      } catch (error) {
        console.error('Error loading chapter content:', error);
      }
    },

    loadSample: async () => {
      const state = get();
      if (state.translations.length === 0) {
        // Ensure RPV is always included with sample
        try {
          const rpvFromStore = await translationService.getTranslation('RPV');
          if (rpvFromStore) {
            set({ translations: [rpvFromStore, SAMPLE], current: rpvFromStore });
          } else {
            set({ translations: [PERMANENT_RPV, SAMPLE], current: PERMANENT_RPV });
          }
        } catch {
          // If save fails, still add it locally
          set({ translations: [PERMANENT_RPV, SAMPLE], current: PERMANENT_RPV });
        }
      }
    },

    setCurrent: (id) => {
      const translation = get().translations.find((t) => t.id === id) ?? null;
      set({ current: translation });
    },

    setReference: (_ref) => {
      // Reserved for future state sync
    },

    setChannelId: (id) => {
      set({ channelId: id });
      // Resubscribe to new channel
      get().subscribeToChannel();
    },

    sendToProjector: async (ref) => {
      const { current, channelId } = get();
      if (!current) return;

      try {
        await projectionService.sendToProjector(channelId || 'default', ref);
      } catch (error) {
        console.error('Error sending to projector:', error);
        // Fallback to localStorage for demo-only environments
        try {
          const payload = {
            translation: current.name,
            book: ref.book,
            chapter: ref.chapter,
            verse: ref.verse,
            text:
              current.books
                .find((book) => book.name === ref.book)
                ?.chapters.find((chapter) => chapter.number === ref.chapter)
                ?.verses.find((verse) => verse.number === ref.verse)?.text ?? '',
            timestamp: new Date().toISOString(),
          };

          const storageKey = `rpv:projector:${channelId || 'default'}`;
          localStorage.setItem(storageKey, JSON.stringify(payload));
          window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));
        } catch {
          // Ignore fallback failures
        }
      }
    },

    subscribeToChannel: async () => {
      const { channelId, _projectionService } = get();
      const channel = channelId || 'default';

      // Clean up previous subscription
      const unsubscribers = get()._unsubscribers;
      if (unsubscribers.channel) {
        unsubscribers.channel();
      }

      // Load initial channel data first
      try {
        const initialRef = await _projectionService.getChannel(channel);
        if (initialRef) {
          set({ projectorRef: initialRef });
        }
      } catch (error) {
        console.warn('Error loading initial channel data:', error);
      }

      // Use localStorage for projector channel sync
      if (typeof window === 'undefined') return;
      
      const read = () => {
        try {
          const raw = localStorage.getItem(`rpv:projector:${channel}`);
          if (raw) {
            set({ projectorRef: JSON.parse(raw) });
          } else {
            // Clear if no data
            set({ projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' } });
          }
        } catch {}
      };
      
      read();
      const handler = (e: StorageEvent) => {
        if (e.key === `rpv:projector:${channel}`) {
          read();
        }
      };
      window.addEventListener('storage', handler);
      
      unsubscribers.channel = () => {
        window.removeEventListener('storage', handler);
      };
    },

    importJson: async (data) => {
      try {
        const list = data.translations ?? [];
        
        // Save to Firestore
        const { _translationService } = get();
        for (const translation of list) {
          await _translationService.saveTranslation(translation);
        }

        // Update local state
        set({ translations: list, current: list[0] ?? null });
      } catch (error) {
        console.error('Error importing JSON:', error);
        // Fallback: update local state only
        const list = data.translations ?? [];
        set({ translations: list, current: list[0] ?? null });
      }
    },

    mergeTranslation: async (translation) => {
      try {
        const { _translationService } = get();
        const merged = await _translationService.mergeTranslation(translation);
        
        // Update local state
        const state = get();
        const existingIndex = state.translations.findIndex(t => t.id === translation.id);
        
        if (existingIndex >= 0) {
          const updatedTranslations = [...state.translations];
          updatedTranslations[existingIndex] = merged;
          set({ 
            translations: updatedTranslations,
            current: state.current?.id === translation.id ? merged : state.current
          });
        } else {
          set({ 
            translations: [...state.translations, merged],
            current: state.current ?? merged
          });
        }
      } catch (error) {
        console.error('Error merging translation:', error);
        throw error;
      }
    },

    addOrUpdateVerse: async ({ translationId, book, chapter, verse, text }) => {
      try {
        const { _translationService } = get();
        await _translationService.addOrUpdateVerse(translationId, book, chapter, verse, text);
        
        // Refresh translations from backend
        await get().loadTranslations();
      } catch (error) {
        console.error('Error adding/updating verse:', error);
        throw error;
      }
    },

    // Book Publication Management Actions
    toggleBookPublicationStatus: async (translationId: string, bookName: string) => {
      try {
        console.log('[BibleStore] Toggling book publication status:', bookName, 'in translation:', translationId);
        
        const { _translationService } = get();
        const newStatus = await _translationService.toggleBookPublicationStatus(translationId, bookName);
        
        // Update local state immediately for responsive UI
        const state = get();
        const updatedTranslations = state.translations.map(t => {
          if (t.id === translationId) {
            const updatedBooks = t.books.map(b => 
              b.name === bookName ? { ...b, published: newStatus } : b
            );
            return { ...t, books: updatedBooks };
          }
          return t;
        });
        
        set({ 
          translations: updatedTranslations,
          current: state.current?.id === translationId 
            ? updatedTranslations.find(t => t.id === translationId) || state.current
            : state.current
        });
        
        console.log('[BibleStore] Successfully toggled book publication status to:', newStatus);
        return newStatus;
      } catch (error) {
        console.error('Error toggling book publication status:', error);
        throw error;
      }
    },

    publishBook: async (translationId: string, bookName: string) => {
      console.log('[BibleStore] Publishing book:', bookName, 'in translation:', translationId);
      await get()._translationService.publishBook(translationId, bookName);
      const state = get();
      const updatedTranslations = state.translations.map(t => {
        if (t.id === translationId) {
          return {
            ...t,
            books: t.books.map(b => b.name === bookName ? { ...b, published: true } : b)
          };
        }
        return t;
      });

      set({
        translations: updatedTranslations,
        current: state.current?.id === translationId
          ? updatedTranslations.find(t => t.id === translationId) || state.current
          : state.current
      });
    },

    unpublishBook: async (translationId: string, bookName: string) => {
      console.log('[BibleStore] Unpublishing book:', bookName, 'in translation:', translationId);
      await get()._translationService.unpublishBook(translationId, bookName);
      const state = get();
      const updatedTranslations = state.translations.map(t => {
        if (t.id === translationId) {
          return {
            ...t,
            books: t.books.map(b => b.name === bookName ? { ...b, published: false } : b)
          };
        }
        return t;
      });

      set({
        translations: updatedTranslations,
        current: state.current?.id === translationId
          ? updatedTranslations.find(t => t.id === translationId) || state.current
          : state.current
      });
    },

    deleteBook: async (translationId: string, bookName: string) => {
      console.log('[BibleStore] Deleting book:', bookName, 'from translation:', translationId);
      await get()._translationService.deleteBook(translationId, bookName);
      const state = get();
      const updatedTranslations = state.translations.map(t => {
        if (t.id === translationId) {
          return {
            ...t,
            books: t.books.filter(b => b.name !== bookName)
          };
        }
        return t;
      });

      set({
        translations: updatedTranslations,
        current: state.current?.id === translationId
          ? updatedTranslations.find(t => t.id === translationId) || state.current
          : state.current
      });
    },

    bulkUpdateBookPublicationStatus: async (
      translationId: string,
      bookUpdates: Array<{ bookName: string; published: boolean }>
    ) => {
      try {
        console.log('[BibleStore] Bulk updating book publication status:', translationId, bookUpdates.length);

        const { _translationService } = get();
        await _translationService.bulkUpdateBookPublicationStatus(translationId, bookUpdates);

        const state = get();
        const updatedTranslations = state.translations.map(t => {
          if (t.id === translationId) {
            const updatedBooks = t.books.map(b => {
              const update = bookUpdates.find(u => u.bookName === b.name);
              return update ? { ...b, published: update.published } : b;
            });
            return { ...t, books: updatedBooks };
          }
          return t;
        });

        set({
          translations: updatedTranslations,
          current: state.current?.id === translationId
            ? updatedTranslations.find(t => t.id === translationId) || state.current
            : state.current,
        });

        console.log('[BibleStore] Successfully completed bulk book publication status update');
      } catch (error) {
        console.error('Error in bulk book publication status update:', error);
        throw error;
      }
    },

    getTranslationsWithPublishedBooks: async () => {
      try {
        console.log('[BibleStore] Getting translations with published books only');
        
        const { _translationService } = get();
        return await _translationService.getTranslationsWithPublishedBooks();
      } catch (error) {
        console.error('Error getting translations with published books:', error);
        throw error;
      }
    },

    // NEW: Get translations filtered for end users (only published books)
    getTranslationsForEndUsers: () => {
      const state = get();
      return state.translations.map(translation => ({
        ...translation,
        books: translation.books.filter(book => book.published !== false) // Include books where published is true or undefined
      })).filter(translation => translation.books.length > 0); // Only include translations that have published books
    },

    loadTranslationsForEndUsers: async () => {
      // Load all translations first
      await get().loadTranslations();
      
      // The filtering happens in getTranslationsForEndUsers()
      // This method is just for consistency and future enhancements
    },
  };
});

// Export types for backward compatibility
export type { Translation, Book, Chapter, Verse } from './types';
