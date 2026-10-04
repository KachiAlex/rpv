import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';

export interface BookProgress {
  userId: string;
  translationId: string;
  book: string;
  chaptersRead: number[];
  totalChapters: number;
  lastReadAt: Date;
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

function mapRow(row: any): BookProgress {
  const chapter = row.chapter || 1;
  return {
    userId: row.user_id,
    translationId: row.translation_id,
    book: row.book,
    chaptersRead: Array.from({ length: chapter }, (_, i) => i + 1),
    totalChapters: chapter,
    lastReadAt: new Date(row.last_read_at),
    updatedAt: new Date(row.last_read_at),
  };
}

export class ReadingProgressService {
  async getBookProgress(userId: string, translationId: string, book: string): Promise<BookProgress | null> {
    const data = await apiCall<{ progress: any }>(`/api/reading-progress/?translationId=${translationId}&book=${book}`);
    return data.progress ? mapRow(data.progress) : null;
  }

  async getAllBookProgress(userId: string, translationId?: string): Promise<BookProgress[]> {
    const data = await apiCall<{ progress: any[] }>(`/api/reading-progress/?translationId=${translationId || ''}`);
    return data.progress ? data.progress.map(mapRow) : [];
  }

  async markChapterRead(userId: string, translationId: string, book: string, chapter: number, totalChapters: number): Promise<void> {
    await apiCall('/api/reading-progress/', {
      method: 'POST',
      body: JSON.stringify({
        progress: {
          userId,
          translationId,
          book,
          chapter,
          verse: 1,
          totalChapters,
        },
      }),
    });
  }

  async getProgressPercentage(_userId: string, _translationId: string, _book: string): Promise<number> {
    const progress = await this.getBookProgress(_userId, _translationId, _book);
    if (!progress) return 0;
    return progress.totalChapters ? (progress.chaptersRead.length / progress.totalChapters) * 100 : 0;
  }

  async getTranslationProgress(_userId: string, translationId: string): Promise<Array<{ book: string; progress: number; chaptersRead: number; totalChapters: number }>> {
    const all = await this.getAllBookProgress(_userId, translationId);
    return all.map(p => ({
      book: p.book,
      progress: p.totalChapters ? (p.chaptersRead.length / p.totalChapters) * 100 : 0,
      chaptersRead: p.chaptersRead.length,
      totalChapters: p.totalChapters,
    }));
  }
}
