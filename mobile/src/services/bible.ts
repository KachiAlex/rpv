import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rpvbible.com';

// ---- Types ----

export interface RpvVerse {
  number: number;
  text: string;
}

export interface RpvChapter {
  number: number;
  verses: RpvVerse[];
}

export interface RpvBookMeta {
  name: string;
  published?: boolean;
  introduction?: string;
  chapterCount: number;
}

export interface RpvBook {
  name: string;
  introduction?: string;
  chapters: RpvChapter[];
}

export interface RpvTranslation {
  id: string;
  name: string;
  language?: string;
  books: RpvBookMeta[];
}

export interface SearchHit {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleVerseResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  relevance_score?: number;
  contextualRelevance?: string;
  applicationSuggestion?: string;
}

export interface ConversationResponse {
  text: string;
  verses?: BibleVerseResult[];
  followUpQuestions?: string[];
  conversationState: { sessionId: string; phase?: string };
  confidence?: number;
}

export interface Devotional {
  title?: string;
  date?: string;
  passage?: string;
  content?: string;
  body?: string;
  reading?: string;
  [key: string]: unknown;
}

export interface ReadingPlan {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  durationDays?: number;
  [key: string]: unknown;
}

export interface StoreBook {
  id: string;
  title?: string;
  author?: string;
  description?: string;
  price?: number;
  coverUrl?: string;
  [key: string]: unknown;
}

// ---- HTTP helpers ----

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

async function authedGet<T>(path: string): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- Translations & content ----

let translationsCache: RpvTranslation[] | null = null;
const TRANSLATIONS_KEY = 'rpv:translations-manifest';
const bookKey = (translationId: string, bookName: string): string =>
  `rpv:book:${translationId}:${bookName}`;

function toTranslation(raw: any): RpvTranslation {
  const books = (raw.books || []).map((b: any) => ({
    name: b.name,
    published: b.published,
    introduction: b.introduction,
    chapterCount: Array.isArray(b.chapters) ? b.chapters.length : 0,
  }));
  return {
    id: raw.id,
    name: raw.name || raw.id,
    language: raw.language,
    books,
  };
}

export async function getTranslations(forceRefresh = false): Promise<RpvTranslation[]> {
  if (!forceRefresh && translationsCache) return translationsCache;

  try {
    const data = await get<{ translations: any[] }>('/api/r2/translations');
    const list = (data.translations || []).map(toTranslation);
    translationsCache = list;
    await AsyncStorage.setItem(TRANSLATIONS_KEY, JSON.stringify(list));
    return list;
  } catch (error) {
    // Offline fallback to last-known manifest
    if (translationsCache) return translationsCache;
    const raw = await AsyncStorage.getItem(TRANSLATIONS_KEY).catch(() => null);
    if (raw) {
      translationsCache = JSON.parse(raw);
      return translationsCache!;
    }
    throw error;
  }
}

export async function getBook(translationId: string, bookName: string): Promise<RpvBook> {
  const key = bookKey(translationId, bookName);
  try {
    const data = await get<{ book: any }>(
      `/api/r2/translations/${encodeURIComponent(translationId)}/books/${encodeURIComponent(bookName)}`
    );
    const book: RpvBook = {
      name: data.book.name,
      introduction: data.book.introduction,
      chapters: (data.book.chapters || []).map((c: any) => ({
        number: c.number,
        verses: (c.verses || []).map((v: any) => ({
          number: v.number,
          text: v.text,
        })),
      })),
    };
    await AsyncStorage.setItem(key, JSON.stringify(book));
    return book;
  } catch (error) {
    const raw = await AsyncStorage.getItem(key).catch(() => null);
    if (raw) return JSON.parse(raw);
    throw error;
  }
}

export async function getChapter(
  translationId: string,
  bookName: string,
  chapterNumber: number
): Promise<RpvChapter | null> {
  const book = await getBook(translationId, bookName);
  return book.chapters.find((c) => c.number === chapterNumber) || null;
}

const TRANSLATION_PREF_KEY = 'rpv:selectedTranslation';
const LAST_READ_KEY = 'rpv:lastRead';

export async function getSelectedTranslation(): Promise<string> {
  const saved = await AsyncStorage.getItem(TRANSLATION_PREF_KEY).catch(() => null);
  return saved || 'RPV';
}

export async function setSelectedTranslation(id: string): Promise<void> {
  await AsyncStorage.setItem(TRANSLATION_PREF_KEY, id);
}

export interface LastRead {
  translationId: string;
  book: string;
  chapter: number;
}

export async function getLastRead(): Promise<LastRead | null> {
  const raw = await AsyncStorage.getItem(LAST_READ_KEY).catch(() => null);
  return raw ? JSON.parse(raw) : null;
}

export async function setLastRead(value: LastRead): Promise<void> {
  await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(value));
}

// ---- Verse search (client-side over R2 books) ----

export async function searchVerses(
  query: string,
  translationId: string,
  limit = 50
): Promise<SearchHit[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const translations = await getTranslations();
  const translation = translations.find((t) => t.id === translationId) || translations[0];
  if (!translation) return [];

  const hits: SearchHit[] = [];
  for (const meta of translation.books) {
    if (hits.length >= limit) break;
    try {
      const book = await getBook(translation.id, meta.name);
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          if (verse.text.toLowerCase().includes(needle)) {
            hits.push({
              translation: translation.id,
              book: book.name,
              chapter: chapter.number,
              verse: verse.number,
              text: verse.text,
            });
            if (hits.length >= limit) break;
          }
        }
        if (hits.length >= limit) break;
      }
    } catch {
      // Skip books that fail to load
    }
  }
  return hits;
}

// ---- AI Bible Search ----

export async function askBible(
  text: string,
  sessionId: string,
  isFollowUp: boolean
): Promise<ConversationResponse> {
  return post<ConversationResponse>('/api/bible-search/conversation', {
    text,
    sessionId,
    timestamp: new Date().toISOString(),
    metadata: { followUp: isFollowUp },
  });
}

// ---- Devotionals / Plans / Store ----

export async function getTodayDevotional(): Promise<Devotional | null> {
  try {
    const data = await get<{ devotional: Devotional | null }>('/api/devotionals');
    return data.devotional;
  } catch {
    return null;
  }
}

export async function getReadingPlans(): Promise<ReadingPlan[]> {
  const data = await authedGet<{ plans: ReadingPlan[] }>('/api/reading-plans');
  return data.plans || [];
}

export async function getStoreBooks(): Promise<StoreBook[]> {
  const data = await authedGet<{ books?: StoreBook[] } | StoreBook[]>('/api/books');
  return Array.isArray(data) ? data : data.books || [];
}
