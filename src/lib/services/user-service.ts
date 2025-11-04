import { getFirebase } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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
  createdAt: Date;
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
    const current = await this.getPreferences(userId);
    
    await updateDoc(userRef, {
      preferences: { ...current, ...preferences },
      updatedAt: new Date(),
    });
  }

  // Bookmarks
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    const db = this.getDb();
    const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const snapshot = await getDocs(bookmarksRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Bookmark[];
  }

  async addBookmark(userId: string, bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<string> {
    const db = this.getDb();
    const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const newBookmark = {
      ...bookmark,
      createdAt: new Date(),
    };
    
    const docRef = doc(bookmarksRef);
    await setDoc(docRef, newBookmark);
    return docRef.id;
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
    } as Bookmark;
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
}

