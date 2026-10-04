import type { Highlight, HighlightColor } from '../types';
import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';

async function apiCall<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any).error || 'Request failed');
  return data as T;
}

export class HighlightService {
  async getHighlights(_userId: string, translationId?: string, book?: string, chapter?: number): Promise<Highlight[]> {
    const params = new URLSearchParams();
    if (translationId) params.set('translationId', translationId);
    if (book) params.set('book', book);
    if (chapter !== undefined) params.set('chapter', String(chapter));
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await apiCall<{ highlights: any[] }>(`/api/highlights/${query}`);
    return data.highlights.map(row => ({
      id: row.id,
      userId: row.user_id,
      translationId: row.translation_id,
      book: row.book,
      chapter: row.chapter,
      verse: row.verse,
      color: row.color,
      note: row.note,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getHighlight(_userId: string, translationId: string, book: string, chapter: number, verse: number): Promise<Highlight | null> {
    const highlights = await this.getHighlights(_userId, translationId, book, chapter);
    return highlights.find(h => h.verse === verse) || null;
  }

  async addHighlight(_userId: string, highlight: Omit<Highlight, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const data = await apiCall<{ id: string }>('/api/highlights/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        highlight: {
          translationId: highlight.translationId,
          book: highlight.book,
          chapter: highlight.chapter,
          verse: highlight.verse,
          color: highlight.color,
          note: highlight.note,
        },
      }),
    });
    return data.id;
  }

  async removeHighlight(_userId: string, highlightId: string): Promise<void> {
    await apiCall('/api/highlights/', {
      method: 'POST',
      body: JSON.stringify({ action: 'remove', highlightId }),
    });
  }

  async removeHighlightByVerse(_userId: string, translationId: string, book: string, chapter: number, verse: number): Promise<void> {
    await apiCall('/api/highlights/', {
      method: 'POST',
      body: JSON.stringify({ action: 'removeByVerse', translationId, book, chapter, verse }),
    });
  }

  async updateHighlightColor(_userId: string, highlightId: string, color: HighlightColor): Promise<void> {
    await apiCall('/api/highlights/', {
      method: 'POST',
      body: JSON.stringify({ action: 'updateColor', highlightId, color }),
    });
  }

  async updateHighlightNote(_userId: string, highlightId: string, note: string): Promise<void> {
    await apiCall('/api/highlights/', {
      method: 'POST',
      body: JSON.stringify({ action: 'updateNote', highlightId, note }),
    });
  }
}
