import type { Translation } from '../types';
import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';

export interface FeaturedHighlight {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  title?: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

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

function mapRow(row: any): FeaturedHighlight {
  return {
    id: row.id,
    translationId: row.translation_id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
    title: row.title,
    description: row.description,
    order: row.order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class FeaturedHighlightsService {
  async getFeaturedHighlights(limit_count?: number): Promise<FeaturedHighlight[]> {
    const params = new URLSearchParams();
    if (limit_count) params.set('limit', String(limit_count));
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await apiCall<{ highlights: any[] }>(`/api/featured-highlights/${query}`);
    return data.highlights.map(mapRow);
  }

  async getFeaturedHighlight(id: string): Promise<FeaturedHighlight | null> {
    const all = await this.getFeaturedHighlights();
    return all.find(h => h.id === id) || null;
  }

  async addFeaturedHighlight(highlight: Omit<FeaturedHighlight, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedHighlight> {
    const data = await apiCall<{ id: string }>('/api/featured-highlights/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        highlight: {
          translationId: highlight.translationId,
          book: highlight.book,
          chapter: highlight.chapter,
          verse: highlight.verse,
          text: highlight.text,
          title: highlight.title,
          description: highlight.description,
          order: highlight.order,
        },
      }),
    });
    const now = new Date();
    return { ...highlight, id: data.id, createdAt: now, updatedAt: now };
  }

  async updateFeaturedHighlight(id: string, updates: Partial<Omit<FeaturedHighlight, 'id' | 'createdAt'>>): Promise<void> {
    await apiCall('/api/featured-highlights/', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', id, updates }),
    });
  }

  async deleteFeaturedHighlight(id: string): Promise<void> {
    await apiCall('/api/featured-highlights/', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    });
  }

  async reorderFeaturedHighlights(ids: string[]): Promise<void> {
    await apiCall('/api/featured-highlights/', {
      method: 'POST',
      body: JSON.stringify({ action: 'reorder', ids }),
    });
  }

  async getFeaturedHighlightsWithContent(translations: Translation[]): Promise<Array<FeaturedHighlight & { translationName: string; verseText: string }>> {
    const highlights = await this.getFeaturedHighlights();
    return highlights.map(h => {
      const translation = translations.find(t => t.id === h.translationId);
      const book = translation?.books.find(b => b.name === h.book);
      const chapter = book?.chapters.find(c => c.number === h.chapter);
      const verse = chapter?.verses.find(v => v.number === h.verse);
      return {
        ...h,
        translationName: translation?.name || h.translationId,
        verseText: verse?.text || h.text,
      };
    });
  }
}
