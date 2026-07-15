import { create } from 'zustand';
import { SearchResult } from '../services/searchService';
import * as firebaseService from '../services/firebase';
import offlineQueueService from '../services/offlineQueueService';

interface BookmarkItem extends SearchResult {
  bookmarkId?: string;
  createdAt?: Date;
}

interface BookmarkState {
  bookmarks: BookmarkItem[];
  loading: boolean;
  error: string | null;
  addBookmark: (userId: string, verse: SearchResult) => Promise<void>;
  removeBookmark: (userId: string, bookmarkId: string) => Promise<void>;
  loadBookmarks: (userId: string) => Promise<void>;
  setBookmarks: (bookmarks: BookmarkItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  loading: false,
  error: null,

  addBookmark: async (userId: string, verse: SearchResult) => {
    set({ loading: true, error: null });
    try {
      const verseData = {
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        translation: verse.translation,
      };

      // Save to Firebase
      await firebaseService.saveBookmark(userId, verse.id, verseData);

      // Add to local state
      const newBookmark: BookmarkItem = {
        ...verse,
        bookmarkId: `${userId}-${verse.id}`,
        createdAt: new Date(),
      };

      set({ bookmarks: [...get().bookmarks, newBookmark], loading: false });

      // Queue for offline sync
      await offlineQueueService.queueBookmarkAdd(verse.id, userId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  removeBookmark: async (userId: string, bookmarkId: string) => {
    set({ loading: true, error: null });
    try {
      // Remove from local state
      set({
        bookmarks: get().bookmarks.filter((b) => b.bookmarkId !== bookmarkId),
        loading: false,
      });

      // Queue for offline sync
      await offlineQueueService.queueBookmarkRemove(bookmarkId, userId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadBookmarks: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const bookmarks = await firebaseService.getBookmarks(userId);
      set({ bookmarks: bookmarks as BookmarkItem[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setBookmarks: (bookmarks: BookmarkItem[]) => {
    set({ bookmarks });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
