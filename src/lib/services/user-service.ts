import { getFirebase } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

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

export class UserService {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  // Preferences
  async getPreferences(userId: string): Promise<UserPreferences> {
    const db = this.getDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return DEFAULT_PREFERENCES;
    }
    
    const data = userDoc.data();
    return {
      ...DEFAULT_PREFERENCES,
      ...(data.preferences || {}),
    };
  }

  async savePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const db = this.getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    const current = await this.getPreferences(userId);
    
    // Use setDoc with merge to handle both create and update cases
    if (userDoc.exists()) {
      // Document exists, update it
      await updateDoc(userRef, {
        preferences: { ...current, ...preferences },
        updatedAt: new Date(),
      });
    } else {
      // Document doesn't exist, create it
      await setDoc(userRef, {
        uid: userId,
        preferences: { ...DEFAULT_PREFERENCES, ...preferences },
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
    }
  }

  // Bookmarks
  async getBookmarks(userId: string, folder?: string, tag?: string): Promise<Bookmark[]> {
    const db = this.getDb();
    const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
    
    let q = query(bookmarksRef);
    if (folder) {
      q = query(bookmarksRef, where('folder', '==', folder));
    }
    
    const snapshot = await getDocs(q);
    let bookmarks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || undefined,
    })) as Bookmark[];
    
    // Filter by tag if provided (client-side for array-contains)
    if (tag) {
      bookmarks = bookmarks.filter(b => b.tags && b.tags.includes(tag));
    }
    
    return bookmarks;
  }

  async addBookmark(userId: string, bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = this.getDb();
    const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const now = new Date();
    const newBookmark = {
      ...bookmark,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    const docRef = doc(bookmarksRef);
    await setDoc(docRef, newBookmark);
    return docRef.id;
  }

  async updateBookmark(userId: string, bookmarkId: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Promise<void> {
    const db = this.getDb();
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);
    await updateDoc(bookmarkRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  async removeBookmark(userId: string, bookmarkId: string): Promise<void> {
    const db = this.getDb();
    await deleteDoc(doc(db, 'users', userId, 'bookmarks', bookmarkId));
  }

  async getBookmark(userId: string, translationId: string, book: string, chapter: number, verse: number): Promise<Bookmark | null> {
    const db = this.getDb();
    const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const q = query(
      bookmarksRef,
      where('translationId', '==', translationId),
      where('book', '==', book),
      where('chapter', '==', chapter),
      where('verse', '==', verse)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || undefined,
    } as Bookmark;
  }

  // Folders
  async getFolders(userId: string): Promise<BookmarkFolder[]> {
    const db = this.getDb();
    const foldersRef = collection(db, 'users', userId, 'bookmarkFolders');
    const snapshot = await getDocs(foldersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || undefined,
    })) as BookmarkFolder[];
  }

  async createFolder(userId: string, name: string, color?: string): Promise<string> {
    const db = this.getDb();
    const foldersRef = collection(db, 'users', userId, 'bookmarkFolders');
    const now = new Date();
    const folder = {
      name,
      color: color || 'blue',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    const docRef = doc(foldersRef);
    await setDoc(docRef, folder);
    return docRef.id;
  }

  async updateFolder(userId: string, folderId: string, updates: Partial<Omit<BookmarkFolder, 'id' | 'createdAt'>>): Promise<void> {
    const db = this.getDb();
    const folderRef = doc(db, 'users', userId, 'bookmarkFolders', folderId);
    await updateDoc(folderRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  async deleteFolder(userId: string, folderId: string): Promise<void> {
    const db = this.getDb();
    // First, move all bookmarks in this folder to no folder
    const bookmarks = await this.getBookmarks(userId, folderId);
    for (const bookmark of bookmarks) {
      await this.updateBookmark(userId, bookmark.id, { folder: undefined });
    }
    
    // Then delete the folder
    await deleteDoc(doc(db, 'users', userId, 'bookmarkFolders', folderId));
  }

  // Get all unique tags from user's bookmarks
  async getAllTags(userId: string): Promise<string[]> {
    const bookmarks = await this.getBookmarks(userId);
    const tagSet = new Set<string>();
    
    bookmarks.forEach(bookmark => {
      if (bookmark.tags) {
        bookmark.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }

  // Reading History
  async getReadingHistory(userId: string, limit: number = 50): Promise<ReadingHistory[]> {
    const db = this.getDb();
    const historyRef = collection(db, 'users', userId, 'readingHistory');
    const snapshot = await getDocs(historyRef);
    
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit) as ReadingHistory[];
  }

  async addReadingHistory(
    userId: string,
    history: Omit<ReadingHistory, 'id' | 'timestamp'>
  ): Promise<void> {
    const db = this.getDb();
    const historyRef = collection(db, 'users', userId, 'readingHistory');
    
    // Check if entry already exists
    const existing = await this.getReadingHistoryEntry(
      userId,
      history.translationId,
      history.book,
      history.chapter,
      history.verse
    );
    
    if (existing) {
      // Update timestamp
      await setDoc(doc(db, 'users', userId, 'readingHistory', existing.id), {
        ...history,
        timestamp: new Date(),
      }, { merge: true });
    } else {
      // Add new entry
      await setDoc(doc(historyRef), {
        ...history,
        timestamp: new Date(),
      });
    }
  }

  private async getReadingHistoryEntry(
    userId: string,
    translationId: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<ReadingHistory | null> {
    const db = this.getDb();
    const historyRef = collection(db, 'users', userId, 'readingHistory');
    const q = query(
      historyRef,
      where('translationId', '==', translationId),
      where('book', '==', book),
      where('chapter', '==', chapter),
      where('verse', '==', verse)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    } as ReadingHistory;
  }

  // User Profile
  async createUserProfile(user: User): Promise<void> {
    const db = this.getDb();
    const userRef = doc(db, 'users', user.uid);
    
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        createdAt: new Date(),
        preferences: DEFAULT_PREFERENCES,
        role: 'user', // Default role
      });
    }
  }

  async getUserRole(userId: string): Promise<'user' | 'admin'> {
    const db = this.getDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return 'user';
    }
    
    return (userDoc.data().role || 'user') as 'user' | 'admin';
  }

  async setAdminRole(userId: string, isAdmin: boolean): Promise<void> {
    const db = this.getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile does not exist. Create user profile first.');
    }
    
    await updateDoc(userRef, {
      role: isAdmin ? 'admin' : 'user',
      updatedAt: new Date(),
    });
  }
}

