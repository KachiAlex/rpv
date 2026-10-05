import { getAuthToken } from './api';
import { invalidateBookCache, clearTranslationsCache } from './bible';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rpvbible.com';

async function authed<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- Quick verse edit ----
// POSTs a single-verse partial payload; the server deep-merges it into the
// stored translation so no other books/chapters are touched.

export async function updateVerse(params: {
  translationId: string;
  translationName?: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}): Promise<void> {
  await authed('/api/r2/translations', {
    method: 'POST',
    body: JSON.stringify({
      id: params.translationId,
      name: params.translationName || params.translationId,
      books: [
        {
          name: params.book,
          chapters: [
            {
              number: params.chapter,
              verses: [{ number: params.verse, text: params.text }],
            },
          ],
        },
      ],
    }),
  });
  await invalidateBookCache(params.translationId, params.book);
}

// ---- Publication management ----

export async function setBookPublished(
  translationId: string,
  bookName: string,
  published: boolean
): Promise<void> {
  await authed('/api/r2/book-publication', {
    method: 'POST',
    body: JSON.stringify({ translationId, bookName, published }),
  });
  clearTranslationsCache();
}

export async function setBookIntroduction(
  translationId: string,
  bookName: string,
  introduction: string
): Promise<void> {
  await authed('/api/r2/book-publication', {
    method: 'POST',
    body: JSON.stringify({ translationId, bookName, introduction }),
  });
  clearTranslationsCache();
}

// ---- Featured highlights ----

export interface AdminHighlight {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  title?: string;
  description?: string;
  order: number;
}

function mapHighlight(row: any): AdminHighlight {
  return {
    id: row.id,
    translationId: row.translation_id ?? row.translationId,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    order: row.order ?? 0,
  };
}

export async function getHighlights(limit = 50): Promise<AdminHighlight[]> {
  const data = await authed<{ highlights: any[] }>(
    `/api/featured-highlights/?limit=${limit}`
  );
  return (data.highlights || []).map(mapHighlight);
}

export async function addHighlight(
  highlight: Omit<AdminHighlight, 'id'>
): Promise<string> {
  const data = await authed<{ id: string }>('/api/featured-highlights/', {
    method: 'POST',
    body: JSON.stringify({ action: 'add', highlight }),
  });
  return data.id;
}

export async function updateHighlight(
  id: string,
  updates: { title?: string; description?: string; order?: number }
): Promise<void> {
  await authed('/api/featured-highlights/', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', id, updates }),
  });
}

export async function deleteHighlight(id: string): Promise<void> {
  await authed('/api/featured-highlights/', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id }),
  });
}
