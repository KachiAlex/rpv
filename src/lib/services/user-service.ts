import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  defaultTranslation: string | null;
  language: string;
}

export interface Bookmark {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  note?: string;
  folder?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReadingHistory {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  timestamp: Date;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  fontSize: 'medium',
  defaultTranslation: null,
  language: 'en',
};

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

export class UserService {
  async getPreferences(_userId: string): Promise<UserPreferences> {
    const data = await apiCall<{ preferences: Partial<UserPreferences> }>('/api/user/?action=preferences');
    return { ...DEFAULT_PREFERENCES, ...data.preferences };
  }

  async savePreferences(_userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    await apiCall('/api/user/', {
      method: 'POST',
      body: JSON.stringify({ action: 'savePreferences', preferences }),
    });
  }

  async getBookmarks(_userId: string, folder?: string, tag?: string): Promise<Bookmark[]> {
    const params = new URLSearchParams({ action: 'bookmarks' });
    if (folder) params.set('folder', folder);
    if (tag) params.set('tag', tag);
    const data = await apiCall<{ bookmarks: any[] }>(`/api/user/?${params.toString()}`);
    return data.bookmarks.map(row => ({
      id: row.id,
      translationId: row.translation_id,
      book: row.book,
      chapter: row.chapter,
      verse: row.verse,
      note: row.note,
      folder: row.label,
      createdAt: new Date(row.created_at),
    }));
  }

  async addBookmark(_userId: string, bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const data = await apiCall<{ id: string }>('/api/user/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'addBookmark',
        bookmark: {
          translationId: bookmark.translationId,
          book: bookmark.book,
          chapter: bookmark.chapter,
          verse: bookmark.verse,
          label: bookmark.folder,
        },
      }),
    });
    return data.id;
  }

  async updateBookmark(_userId: string, _bookmarkId: string, _updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Promise<void> {
    // Simplified: not supported by current API
  }

  async removeBookmark(_userId: string, bookmarkId: string): Promise<void> {
    await apiCall('/api/user/', {
      method: 'POST',
      body: JSON.stringify({ action: 'removeBookmark', bookmarkId }),
    });
  }

  async getBookmark(_userId: string, translationId: string, book: string, chapter: number, verse: number): Promise<Bookmark | null> {
    const bookmarks = await this.getBookmarks(_userId);
    return bookmarks.find(b => b.translationId === translationId && b.book === book && b.chapter === chapter && b.verse === verse) || null;
  }

  async getFolders(_userId: string): Promise<BookmarkFolder[]> {
    const data = await apiCall<{ folders: any[] }>('/api/user/?action=folders');
    return data.folders.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: new Date(row.created_at),
    }));
  }

  async createFolder(_userId: string, name: string, color?: string): Promise<string> {
    const data = await apiCall<{ id: string }>('/api/user/', {
      method: 'POST',
      body: JSON.stringify({ action: 'createFolder', name, color }),
    });
    return data.id;
  }

  async updateFolder(_userId: string, _folderId: string, _updates: Partial<Omit<BookmarkFolder, 'id' | 'createdAt'>>): Promise<void> {
    // Simplified: not supported by current API
  }

  async deleteFolder(_userId: string, folderId: string): Promise<void> {
    await apiCall('/api/user/', {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteFolder', folderId }),
    });
  }

  async getAllTags(_userId: string): Promise<string[]> {
    const data = await apiCall<{ tags: string[] }>('/api/user/?action=tags');
    return data.tags;
  }

  async getReadingHistory(_userId: string, limit?: number): Promise<ReadingHistory[]> {
    const params = new URLSearchParams({ action: 'history' });
    if (limit) params.set('limit', String(limit));
    const data = await apiCall<{ history: any[] }>(`/api/user/?${params.toString()}`);
    return data.history.map(row => ({
      id: row.id,
      translationId: row.translation_id,
      book: row.book,
      chapter: row.chapter,
      verse: row.verse,
      timestamp: new Date(row.read_at),
    }));
  }

  async addReadingHistory(_userId: string, history: Omit<ReadingHistory, 'id' | 'timestamp'>): Promise<void> {
    await apiCall('/api/user/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'addHistory',
        history: {
          translationId: history.translationId,
          book: history.book,
          chapter: history.chapter,
          verse: history.verse,
        },
      }),
    });
  }

  async createUserProfile(_user: { uid: string; email?: string | null; displayName?: string | null }): Promise<void> {
    await apiCall('/api/user/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'createProfile',
        profile: { email: _user.email, displayName: _user.displayName },
      }),
    });
  }

  async getUserRole(userId: string): Promise<'user' | 'admin'> {
    try {
      if (typeof window === 'undefined') return 'user';
      const token = localStorage.getItem('rpv:authToken');
      if (!token) return 'user';
      const res = await fetch(getApiUrl('/api/me/'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return 'user';
      const data = await res.json();
      return data.role === 'admin' ? 'admin' : 'user';
    } catch {
      return 'user';
    }
  }

  async setAdminRole(_userId: string, isAdmin: boolean): Promise<void> {
    await apiCall('/api/user/', {
      method: 'POST',
      body: JSON.stringify({ action: 'setAdminRole', isAdmin }),
    });
  }

  async changePassword(_userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await apiCall('/api/user/', {
      method: 'POST',
      body: JSON.stringify({ action: 'changePassword', currentPassword, newPassword }),
    });
  }
}
