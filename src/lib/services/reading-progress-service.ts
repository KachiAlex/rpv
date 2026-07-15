import { getFirebase } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, Timestamp, limit } from 'firebase/firestore';

export interface BookProgress {
  userId: string;
  translationId: string;
  book: string;
  chaptersRead: number[]; // array of chapter numbers that have been read
  totalChapters: number;
  lastReadAt: Date;
  updatedAt: Date;
}

export class ReadingProgressService {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  async getBookProgress(
    userId: string,
    translationId: string,
    book: string
  ): Promise<BookProgress | null> {
    const db = this.getDb();
    const progressRef = collection(db, 'users', userId, 'bookProgress');
    const q = query(
      progressRef,
      where('translationId', '==', translationId),
      where('book', '==', book),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      translationId: data.translationId,
      book: data.book,
      chaptersRead: data.chaptersRead || [],
      totalChapters: data.totalChapters || 0,
      lastReadAt: data.lastReadAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as BookProgress & { id: string };
  }

  async getAllBookProgress(
    userId: string,
    translationId?: string
  ): Promise<BookProgress[]> {
    const db = this.getDb();
    const progressRef = collection(db, 'users', userId, 'bookProgress');
    
    const q = translationId
      ? query(progressRef, where('translationId', '==', translationId))
      : query(progressRef);
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data.userId,
        translationId: data.translationId,
        book: data.book,
        chaptersRead: data.chaptersRead || [],
        totalChapters: data.totalChapters || 0,
        lastReadAt: data.lastReadAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BookProgress;
    });
  }

  async markChapterRead(
    userId: string,
    translationId: string,
    book: string,
    chapter: number,
    totalChapters: number
  ): Promise<void> {
    const db = this.getDb();
    const progressRef = collection(db, 'users', userId, 'bookProgress');
    
    // Check if progress exists
    const q = query(
      progressRef,
      where('translationId', '==', translationId),
      where('book', '==', book),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    const now = new Date();
    
    if (snapshot.empty) {
      // Create new progress
      const docRef = doc(progressRef);
      await setDoc(docRef, {
        userId,
        translationId,
        book,
        chaptersRead: [chapter],
        totalChapters,
        lastReadAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    } else {
      // Update existing progress
      const existingDoc = snapshot.docs[0];
      const existingData = existingDoc.data();
      const chaptersRead = existingData.chaptersRead || [];
      
      if (!chaptersRead.includes(chapter)) {
        chaptersRead.push(chapter);
        chaptersRead.sort((a: number, b: number) => a - b);
      }
      
      await updateDoc(existingDoc.ref, {
        chaptersRead,
        totalChapters: Math.max(totalChapters, existingData.totalChapters || 0),
        lastReadAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    }
  }

  async getProgressPercentage(
    userId: string,
    translationId: string,
    book: string
  ): Promise<number> {
    const progress = await this.getBookProgress(userId, translationId, book);
    if (!progress || progress.totalChapters === 0) return 0;
    
    return Math.round((progress.chaptersRead.length / progress.totalChapters) * 100);
  }

  async getTranslationProgress(
    userId: string,
    translationId: string
  ): Promise<Array<{ book: string; progress: number; chaptersRead: number; totalChapters: number }>> {
    const allProgress = await this.getAllBookProgress(userId, translationId);
    
    return allProgress.map(progress => ({
      book: progress.book,
      progress: progress.totalChapters > 0
        ? Math.round((progress.chaptersRead.length / progress.totalChapters) * 100)
        : 0,
      chaptersRead: progress.chaptersRead.length,
      totalChapters: progress.totalChapters,
    }));
  }
}

