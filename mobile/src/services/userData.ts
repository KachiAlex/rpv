import { getAuthToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rpvbible.com';

async function authed<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Sign in required');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- Highlights ----

export interface VerseHighlight {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  note?: string;
  createdAt?: string;
}

function mapHighlight(row: any): VerseHighlight {
  return {
    id: row.id,
    translationId: row.translation_id ?? row.translationId,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    color: row.color || 'yellow',
    note: row.note ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
  };
}

export async function getHighlights(filters?: {
  translationId?: string;
  book?: string;
  chapter?: number;
}): Promise<VerseHighlight[]> {
  const params = new URLSearchParams();
  if (filters?.translationId) params.set('translationId', filters.translationId);
  if (filters?.book) params.set('book', filters.book);
  if (filters?.chapter) params.set('chapter', String(filters.chapter));
  const q = params.toString();
  const data = await authed<{ highlights: any[] }>(
    `/api/highlights${q ? `?${q}` : ''}`
  );
  return (data.highlights || []).map(mapHighlight);
}

export async function addHighlight(h: {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  color?: string;
  note?: string;
}): Promise<string> {
  const data = await authed<{ id: string }>('/api/highlights', {
    method: 'POST',
    body: JSON.stringify({ action: 'add', highlight: h }),
  });
  return data.id;
}

export async function removeHighlightByVerse(ref: {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
}): Promise<void> {
  await authed('/api/highlights', {
    method: 'POST',
    body: JSON.stringify({ action: 'removeByVerse', ...ref }),
  });
}

export async function updateHighlightColor(id: string, color: string): Promise<void> {
  await authed('/api/highlights', {
    method: 'POST',
    body: JSON.stringify({ action: 'updateColor', highlightId: id, color }),
  });
}

// ---- Notes ----

export interface VerseNote {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  updatedAt?: string;
}

export async function getNotes(filters?: {
  translationId?: string;
  book?: string;
  chapter?: number;
}): Promise<VerseNote[]> {
  const params = new URLSearchParams();
  if (filters?.translationId) params.set('translationId', filters.translationId);
  if (filters?.book) params.set('book', filters.book);
  if (filters?.chapter) params.set('chapter', String(filters.chapter));
  const q = params.toString();
  const data = await authed<{ notes: any[] }>(`/api/notes${q ? `?${q}` : ''}`);
  return (data.notes || []).map((n) => ({
    id: n.id,
    translationId: n.translation_id ?? n.translationId,
    book: n.book,
    chapter: n.chapter,
    verse: n.verse,
    text: n.text,
    updatedAt: n.updated_at ?? n.updatedAt,
  }));
}

export async function addNote(note: {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}): Promise<string> {
  const data = await authed<{ id: string }>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ action: 'add', note }),
  });
  return data.id;
}

export async function deleteNote(noteId: string): Promise<void> {
  await authed('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', noteId }),
  });
}

// ---- Reading history ----

export interface HistoryEntry {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  readAt?: string;
}

export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  const data = await authed<{ history: any[] }>(
    `/api/user/?action=history&limit=${limit}`
  );
  return (data.history || []).map((h) => ({
    translationId: h.translation_id ?? h.translationId,
    book: h.book,
    chapter: h.chapter,
    verse: h.verse,
    readAt: h.read_at ?? h.readAt,
  }));
}

export async function addHistory(entry: {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
}): Promise<void> {
  await authed('/api/user/', {
    method: 'POST',
    body: JSON.stringify({ action: 'addHistory', history: entry }),
  });
}

// ---- Reading progress ----

export interface ProgressEntry {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  lastReadAt?: string;
}

export async function getReadingProgress(): Promise<ProgressEntry[]> {
  const data = await authed<{ progress: any[] | any }>('/api/reading-progress');
  const rows = Array.isArray(data.progress) ? data.progress : [];
  return rows.map((p) => ({
    translationId: p.translation_id ?? p.translationId,
    book: p.book,
    chapter: p.chapter,
    verse: p.verse,
    lastReadAt: p.last_read_at ?? p.lastReadAt,
  }));
}

export async function saveReadingProgress(progress: {
  translationId: string;
  book: string;
  chapter: number;
  verse?: number;
}): Promise<void> {
  await authed('/api/reading-progress', {
    method: 'POST',
    body: JSON.stringify({ progress }),
  });
}

// ---- Store purchases ----

export async function getPurchases(): Promise<string[]> {
  const data = await authed<{ purchases: { bookId: string }[] }>('/api/books/purchase/');
  return (data.purchases || []).map((p) => String(p.bookId));
}

export async function purchaseBook(bookId: string): Promise<{ alreadyPurchased?: boolean }> {
  return authed('/api/books/purchase/', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
}

export async function getBookSignedUrl(bookId: string): Promise<string> {
  const data = await authed<{ signedUrl: string }>('/api/books/signed-url/', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
  return data.signedUrl;
}

// ---- Password ----

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await authed('/api/user/', {
    method: 'POST',
    body: JSON.stringify({ action: 'changePassword', currentPassword, newPassword }),
  });
}
