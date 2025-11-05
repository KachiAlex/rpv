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
  loadSample: () => void;
  setCurrent: (id: string) => void;
  setReference: (ref: Reference) => void;
  setChannelId: (id: string) => void;
  sendToProjector: (ref: Reference) => Promise<void>;
  subscribeToChannel: () => void;
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
                    // Save via service so they persist
                    for (const t of list) {
                      await translationService.saveTranslation(t);
                      loaded.push(t);
                    }
                  }
                }
              } catch {}
            }

            if (loaded.length > 0) {
              set({ translations: loaded, current: loaded[0], isLoading: false });
              return;
            }
          } catch {}

          // Fallback to sample
          get().loadSample();
          set({ isLoading: false });
          return;
        }

        // If only sample or missing built-in seeds, try to fetch and merge KJV/ASV once
        try {
          const haveIds = new Set(translations.map(t => t.id));
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
                  await translationService.saveTranslation(t);
                  newlyLoaded.push(t);
                }
              }
            }
          }

          const mergedList = newlyLoaded.length > 0 ? [...translations, ...newlyLoaded] : translations;

          set({ 
            translations: mergedList, 
            current: mergedList[0] ?? null,
            isLoading: false 
          });
        } catch {
          set({ 
            translations, 
            current: translations[0] ?? null,
            isLoading: false 
          });
        }

        // Subscribe to real-time updates from Firestore
        try {
          const { db } = await import('./firebase').then(m => m.getFirebase());
          if (db) {
            const unsubscribe = translationService.subscribeToAllTranslations((translations) => {
              set({ translations, current: get().current ?? translations[0] ?? null });
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
        get().loadSample();
      }
    },

    loadSample: () => {
      const state = get();
      if (state.translations.length === 0) {
        set({ translations: [SAMPLE], current: SAMPLE });
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

    subscribeToChannel: () => {
      const { channelId, _projectionService } = get();
      const channel = channelId || 'default';

      // Clean up previous subscription
      const unsubscribers = get()._unsubscribers;
      if (unsubscribers.channel) {
        unsubscribers.channel();
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
