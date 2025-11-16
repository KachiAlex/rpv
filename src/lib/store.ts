import { create } from 'zustand';
import { TranslationService } from './services/translation-service';
import { ProjectionService } from './services/projection-service';
import type { Translation, Reference, ProjectorRef } from './types';

type BibleState = {
  translations: Translation[];
  current: Translation | null;
  projectorRef: ProjectorRef;
  channelId: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTranslations: () => Promise<void>;
  loadSample: () => Promise<void>;
  setCurrent: (id: string) => void;
  setReference: (ref: Reference) => void;
  setChannelId: (id: string) => void;
  sendToProjector: (ref: Reference) => Promise<void>;
  subscribeToChannel: () => Promise<void>;
  importJson: (data: { translations: Translation[] }) => Promise<void>;
  mergeTranslation: (translation: Translation) => Promise<void>;
  addOrUpdateVerse: (args: { translationId: string; book: string; chapter: number; verse: number; text: string }) => Promise<void>;
  
  // Internal
  _translationService: TranslationService;
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
  const translationService = new TranslationService();
  const projectionService = new ProjectionService();

  return {
    translations: [],
    current: null,
    projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
    channelId: 'default',
    isLoading: false,
    error: null,
    _translationService: translationService,
    _projectionService: projectionService,
    _unsubscribers: {},

    loadTranslations: async () => {
      set({ isLoading: true, error: null });
      try {
        // Load from cache (IndexedDB) or Firestore
        const translations = await translationService.getAllTranslations();
        
        // Ensure permanent RPV translation exists
        const ensureRPVTranslation = async (existingTranslations: Translation[]): Promise<Translation[]> => {
          const hasRPV = existingTranslations.some(t => t.id === 'RPV');
          if (!hasRPV) {
            try {
              // Check if RPV exists in Firestore
              const rpvFromStore = await translationService.getTranslation('RPV');
              if (rpvFromStore) {
                // Use existing RPV from store
                return [rpvFromStore, ...existingTranslations.filter(t => t.id !== 'RPV')];
              } else {
                // Create new RPV translation
                await translationService.saveTranslation(PERMANENT_RPV);
                return [PERMANENT_RPV, ...existingTranslations];
              }
            } catch (error) {
              // If save fails, still add it locally
              console.warn('Could not save RPV translation to store, adding locally:', error);
              return [PERMANENT_RPV, ...existingTranslations];
            }
          } else {
            // RPV exists, but ensure it has the correct name
            const rpvIndex = existingTranslations.findIndex(t => t.id === 'RPV');
            if (rpvIndex >= 0) {
              const updated = [...existingTranslations];
              updated[rpvIndex] = {
                ...updated[rpvIndex],
                name: 'Redemption Project Version'
              };
              return updated;
            }
            return existingTranslations;
          }
        };
        
        if (translations.length === 0) {
          // No translations: try to import built-in seeds (KJV/ASV), then fallback to sample
          try {
            const seeds: Array<{ url: string }> = [
              { url: '/translations/kjv.json' },
              { url: '/translations/asv.json' },
            ];
            const loaded: Translation[] = [];
            for (const seed of seeds) {
              try {
                const res = await fetch(seed.url, { cache: 'no-store' });
                if (res.ok) {
                  const data = await res.json();
                  const list = (data?.translations ?? []) as Translation[];
                  if (Array.isArray(list) && list.length > 0) {
                    // Load seeds locally without writing to Firestore (to avoid permission/write errors)
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

        // If only sample or missing built-in seeds, try to fetch and merge KJV/ASV once
        try {
          const haveIds = new Set(translationsWithRPV.map(t => t.id));
          const wanted = ['kjv', 'asv'];
          const missing = wanted.filter(id => !haveIds.has(id));
          const newlyLoaded: Translation[] = [];
          if (missing.length > 0) {
            for (const id of missing) {
              const res = await fetch(`/translations/${id}.json`, { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                const list = (data?.translations ?? []) as Translation[];
                for (const t of list) {
                  // Do not write seeds to Firestore; keep local
                  newlyLoaded.push(t);
                }
              }
            }
          }

          const mergedList = newlyLoaded.length > 0 ? [...translationsWithRPV, ...newlyLoaded] : translationsWithRPV;

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

        // Subscribe to real-time updates from Firestore
        try {
          const { db } = await import('./firebase').then(m => m.getFirebase());
          if (db) {
            const unsubscribe = translationService.subscribeToAllTranslations((incoming) => {
              const state = get();
              const existing = Array.isArray(state.translations) ? state.translations : [];
              const incomingArray = Array.isArray(incoming) ? incoming : [];

              // If we have incoming data, always use it (it's from Firestore, the source of truth)
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
                    // Only keep existing if it's not in incoming or if it's larger
                    if (!incomingTranslation || sizeOf(t) > sizeOf(incomingTranslation)) {
                      byId.set(t.id, t);
                    }
                  }
                }
                // Always prefer incoming (Firestore) data - it's the source of truth
                for (const t of incomingArray) {
                  if (t && t.id) {
                    const prev = byId.get(t.id) as Translation | undefined;
                    // Prefer incoming if it exists, or if it's larger
                    if (!prev || sizeOf(t) >= sizeOf(prev)) {
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
                      const rpvFromStore = await translationService.getTranslation('RPV');
                      if (rpvFromStore) {
                        return [rpvFromStore, ...translations];
                      } else {
                        await translationService.saveTranslation(PERMANENT_RPV);
                        return [PERMANENT_RPV, ...translations];
                      }
                    } catch {
                      return [PERMANENT_RPV, ...translations];
                    }
                  } else {
                    // Ensure RPV has correct name and is at the beginning
                    const rpvIndex = translations.findIndex(t => t.id === 'RPV');
                    const updated = [...translations];
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
                set({ translations: finalMerged, current: state.current ?? finalMerged[0] ?? null });
              }
            });
            
            const unsubscribers = get()._unsubscribers;
            if (unsubscribers.translations) {
              unsubscribers.translations();
            }
            unsubscribers.translations = unsubscribe;
          }
        } catch (error) {
          console.warn('Firestore subscription failed, using cached data:', error);
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

    loadSample: async () => {
      const state = get();
      if (state.translations.length === 0) {
        // Ensure RPV is always included with sample
        try {
          const rpvFromStore = await translationService.getTranslation('RPV');
          if (rpvFromStore) {
            set({ translations: [rpvFromStore, SAMPLE], current: rpvFromStore });
          } else {
            await translationService.saveTranslation(PERMANENT_RPV);
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
      try {
        const { current, channelId } = get();
        if (!current) return;

        await projectionService.sendToProjector(channelId || 'default', ref);
      } catch (error) {
        console.error('Error sending to projector:', error);
        // Fallback to localStorage for demo
        const { current, channelId } = get();
        if (current && typeof window !== 'undefined') {
          const book = current.books.find((b) => b.name === ref.book);
          const chapter = book?.chapters.find((c) => c.number === ref.chapter);
          const verse = chapter?.verses.find((v) => v.number === ref.verse);
          const payload: ProjectorRef = {
            translation: current.name,
            book: ref.book,
            chapter: ref.chapter,
            verse: ref.verse,
            text: verse?.text ?? '',
          };
          localStorage.setItem(`rpv:projector:${channelId || 'default'}`, JSON.stringify(payload));
          window.dispatchEvent(new StorageEvent('storage', { key: `rpv:projector:${channelId || 'default'}` }));
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

      // Check Firebase availability
      const { getFirebase } = require('./firebase');
      const { db } = getFirebase();
      
      if (db) {
        try {
          // Use Firestore
          const unsubscribe = _projectionService.subscribeToChannel(channel, (ref) => {
            if (ref) {
              set({ projectorRef: ref });
            } else {
              // If ref is null, clear the projector
              set({ projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' } });
            }
          });
          unsubscribers.channel = unsubscribe;
          return;
        } catch (error) {
          console.error('Error subscribing to Firestore channel:', error);
        }
      }
      
      // Fallback to localStorage
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
        
        // Refresh translations from Firestore
        await get().loadTranslations();
      } catch (error) {
        console.error('Error adding/updating verse:', error);
        throw error;
      }
    },
  };
});

// Export types for backward compatibility
export type { Translation, Book, Chapter, Verse } from './types';
