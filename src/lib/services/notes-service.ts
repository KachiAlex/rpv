import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';

export interface Note {
  id: string;
  userId: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
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

function mapRow(row: any): Note {
  return {
    id: row.id,
    userId: row.user_id,
    translationId: row.translation_id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class NotesService {
  async getNotes(_userId: string, translationId: string, book: string, chapter: number, verse: number): Promise<Note[]> {
    const data = await apiCall<{ notes: any[] }>(`/api/notes/?translationId=${translationId}&book=${book}&chapter=${chapter}&verse=${verse}`);
    return data.notes.map(mapRow);
  }

  async getAllNotes(_userId: string, limit?: number): Promise<Note[]> {
    const url = limit ? `/api/notes/?limit=${limit}` : '/api/notes/';
    const data = await apiCall<{ notes: any[] }>(url);
    return data.notes.map(mapRow);
  }

  async addNote(_userId: string, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const data = await apiCall<{ id: string }>('/api/notes/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        note: {
          translationId: note.translationId,
          book: note.book,
          chapter: note.chapter,
          verse: note.verse,
          text: note.text,
        },
      }),
    });
    return data.id;
  }

  async updateNote(_userId: string, noteId: string, text: string): Promise<void> {
    await apiCall('/api/notes/', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', noteId, text }),
    });
  }

  async deleteNote(_userId: string, noteId: string): Promise<void> {
    await apiCall('/api/notes/', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', noteId }),
    });
  }
}
