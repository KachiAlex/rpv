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
  addOrUpdateVerse: ({ translationId, book, chapter, verse, text }) => {
    const state = get();
    const translations = [...state.translations];
    let t = translations.find((x) => x.id === translationId);
    if (!t) {
      t = { id: translationId, name: translationId, books: [] };
      translations.push(t);
    }
    let b = t.books.find((x) => x.name === book);
    if (!b) {
      b = { name: book, chapters: [] };
      t.books.push(b);
    }
    let c = b.chapters.find((x) => x.number === chapter);
    if (!c) {
      c = { number, verses: [] } as Chapter;
      // ensure number is set correctly
      c.number = chapter;
      b.chapters.push(c);
    }
    const v = c.verses.find((x) => x.number === verse);
    if (v) v.text = text; else c.verses.push({ number: verse, text });
    set({ translations, current: state.current ?? translations[0] ?? null });
  }
}));


