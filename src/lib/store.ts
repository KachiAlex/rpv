import { create } from 'zustand';

export type Verse = { number: number; text: string };
export type Chapter = { number: number; verses: Verse[] };
export type Book = { name: string; chapters: Chapter[] };
export type Translation = { id: string; name: string; books: Book[] };

type Reference = { book: string; chapter: number; verse: number };

type ProjectorRef = {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleState = {
  translations: Translation[];
  current: Translation | null;
  projectorRef: ProjectorRef;
  channelId: string;
  loadSample: () => void;
  setCurrent: (id: string) => void;
  setReference: (ref: Reference) => void;
  setChannelId: (id: string) => void;
  sendToProjector: (ref: Reference) => void;
  subscribeToChannel: () => void;
  importJson: (data: { translations: Translation[] }) => void;
  mergeTranslation: (translation: Translation) => void;
  addOrUpdateVerse: (args: { translationId: string; book: string; chapter: number; verse: number; text: string }) => void;
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

import { getFirebase } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const useBibleStore = create<BibleState>((set, get) => ({
  translations: [],
  current: null,
  projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
  channelId: 'default',
  loadSample: () => {
    if (get().translations.length) return;
    const t = SAMPLE;
    set({ translations: [t], current: t });
  },
  setCurrent: (id) => {
    const t = get().translations.find((t) => t.id === id) ?? null;
    set({ current: t });
  },
  setReference: (_ref) => {
    // reserved for future state sync
  },
  setChannelId: (id) => set({ channelId: id }),
  sendToProjector: (ref) => {
    const cur = get().current;
    if (!cur) return;
    const book = cur.books.find((b) => b.name === ref.book);
    const chapter = book?.chapters.find((c) => c.number === ref.chapter);
    const verse = chapter?.verses.find((v) => v.number === ref.verse);
    const payload = { translation: cur.name, ...ref, text: verse?.text ?? '' };
    set({ projectorRef: payload });
    const { db } = getFirebase();
    const channelId = get().channelId || 'default';
    if (db) {
      void setDoc(doc(db, 'channels', channelId), payload, { merge: true });
    } else if (typeof window !== 'undefined') {
      localStorage.setItem(`rpv:projector:${channelId}`, JSON.stringify(payload));
      window.dispatchEvent(new StorageEvent('storage', { key: `rpv:projector:${channelId}` }));
    }
  },
  subscribeToChannel: () => {
    const channelId = get().channelId || 'default';
    const { db } = getFirebase();
    if (db) {
      const unsubscribe = onSnapshot(doc(db, 'channels', channelId), (snap) => {
        const data = snap.data() as ProjectorRef | undefined;
        if (data) set({ projectorRef: data });
      });
      // For simple environments, we won't store unsubscribe; page unmount clears it
      return;
    }
    if (typeof window === 'undefined') return;
    const read = () => {
      try {
        const raw = localStorage.getItem(`rpv:projector:${channelId}`);
        if (raw) set({ projectorRef: JSON.parse(raw) });
      } catch {}
    };
    read();
    const handler = (e: StorageEvent) => { if (e.key === `rpv:projector:${channelId}`) read(); };
    window.addEventListener('storage', handler);
  },
  importJson: (data) => {
    const list = data.translations ?? [];
    set({ translations: list, current: list[0] ?? null });
  },
  mergeTranslation: (newTranslation) => {
    const state = get();
    const existingIndex = state.translations.findIndex(t => t.id === newTranslation.id);
    
    if (existingIndex >= 0) {
      // Merge with existing translation
      const existingTranslation = state.translations[existingIndex];
      const existingBook = existingTranslation.books.find(b => b.name === newTranslation.books[0]?.name);
      
      let updatedBooks: Book[];
      if (existingBook) {
        // Merge chapters into existing book
        const newBook = newTranslation.books[0];
        const updatedChapters = [...existingBook.chapters];
        
        newBook.chapters.forEach(newChapter => {
          const chapterIndex = updatedChapters.findIndex(c => c.number === newChapter.number);
          if (chapterIndex >= 0) {
            // Merge verses into existing chapter
            const existingChapter = updatedChapters[chapterIndex];
            const updatedVerses = [...existingChapter.verses];
            
            newChapter.verses.forEach(newVerse => {
              const verseIndex = updatedVerses.findIndex(v => v.number === newVerse.number);
              if (verseIndex >= 0) {
                updatedVerses[verseIndex] = newVerse; // Update existing
              } else {
                updatedVerses.push(newVerse); // Add new
              }
            });
            
            updatedVerses.sort((a, b) => a.number - b.number);
            updatedChapters[chapterIndex] = { ...existingChapter, verses: updatedVerses };
          } else {
            updatedChapters.push(newChapter); // Add new chapter
          }
        });
        
        updatedChapters.sort((a, b) => a.number - b.number);
        updatedBooks = existingTranslation.books.map(b => 
          b.name === existingBook.name ? { ...b, chapters: updatedChapters } : b
        );
      } else {
        // Add new book
        updatedBooks = [...existingTranslation.books, newTranslation.books[0]];
      }
      
      const updatedTranslation: Translation = {
        ...existingTranslation,
        name: newTranslation.name || existingTranslation.name,
        books: updatedBooks
      };
      
      const updatedTranslations = [...state.translations];
      updatedTranslations[existingIndex] = updatedTranslation;
      
      set({ 
        translations: updatedTranslations,
        current: state.current?.id === newTranslation.id ? updatedTranslation : state.current
      });
    } else {
      // Add new translation
      set({ 
        translations: [...state.translations, newTranslation],
        current: state.current ?? newTranslation
      });
    }
  },
  addOrUpdateVerse: ({ translationId, book, chapter, verse, text }) => {
    const state = get();
    const translations = state.translations.map(t => {
      if (t.id !== translationId) return t;
      
      const books = t.books.map(b => {
        if (b.name !== book) return b;
        
        const chapters = b.chapters.map(c => {
          if (c.number !== chapter) return c;
          
          const verses = [...c.verses];
          const verseIndex = verses.findIndex(v => v.number === verse);
          if (verseIndex >= 0) {
            verses[verseIndex] = { number: verse, text };
          } else {
            verses.push({ number: verse, text });
          }
          
          return { ...c, verses };
        });
        
        const chapterIndex = chapters.findIndex(c => c.number === chapter);
        if (chapterIndex < 0) {
          chapters.push({ number: chapter, verses: [{ number: verse, text }] });
        }
        
        return { ...b, chapters };
      });
      
      const bookIndex = books.findIndex(b => b.name === book);
      if (bookIndex < 0) {
        books.push({ 
          name: book, 
          chapters: [{ number: chapter, verses: [{ number: verse, text }] }] 
        });
      }
      
      return { ...t, books };
    });
    
    const translationIndex = translations.findIndex(t => t.id === translationId);
    if (translationIndex < 0) {
      translations.push({
        id: translationId,
        name: translationId,
        books: [{ 
          name: book, 
          chapters: [{ number: chapter, verses: [{ number: verse, text }] }] 
        }]
      });
    }
    
    set({ 
      translations, 
      current: state.current ?? translations.find(t => t.id === translationId) ?? translations[0] ?? null 
    });
  }
}));


