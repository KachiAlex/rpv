import { getFirebase } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import type { Highlight, HighlightColor } from '../types';

export class HighlightService {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  async getHighlights(
    userId: string,
    translationId?: string,
    book?: string,
    chapter?: number
  ): Promise<Highlight[]> {
    const db = this.getDb();
    const highlightsRef = collection(db, 'users', userId, 'highlights');
    
    const conditions = [];
    if (translationId) {
      conditions.push(where('translationId', '==', translationId));
    }
    if (book) {
      conditions.push(where('book', '==', book));
    }
    if (chapter !== undefined) {
      conditions.push(where('chapter', '==', chapter));
    }

    const q = conditions.length > 0 
      ? query(highlightsRef, ...conditions)
      : query(highlightsRef);

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Highlight[];
  }

  async getHighlight(
    userId: string,
    translationId: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<Highlight | null> {
    const db = this.getDb();
    const highlightsRef = collection(db, 'users', userId, 'highlights');
    const q = query(
      highlightsRef,
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
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Highlight;
  }

  async addHighlight(
    userId: string,
    highlight: Omit<Highlight, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const db = this.getDb();
    
    // Check if highlight already exists for this verse
    const existing = await this.getHighlight(
      userId,
      highlight.translationId,
      highlight.book,
      highlight.chapter,
      highlight.verse
    );

    const now = new Date();
    const highlightData = {
      ...highlight,
      createdAt: now,
      updatedAt: now,
    };

    if (existing) {
      // Update existing highlight
      await updateDoc(doc(db, 'users', userId, 'highlights', existing.id), {
        color: highlight.color,
        note: highlight.note,
        updatedAt: now,
      });
      return existing.id;
    } else {
      // Create new highlight
      const highlightsRef = collection(db, 'users', userId, 'highlights');
      const docRef = doc(highlightsRef);
      await setDoc(docRef, {
        ...highlightData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      return docRef.id;
    }
  }

  async removeHighlight(
    userId: string,
    highlightId: string
  ): Promise<void> {
    const db = this.getDb();
    await deleteDoc(doc(db, 'users', userId, 'highlights', highlightId));
  }

  async removeHighlightByVerse(
    userId: string,
    translationId: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<void> {
    const highlight = await this.getHighlight(userId, translationId, book, chapter, verse);
    if (highlight) {
      await this.removeHighlight(userId, highlight.id);
    }
  }

  async updateHighlightColor(
    userId: string,
    highlightId: string,
    color: HighlightColor
  ): Promise<void> {
    const db = this.getDb();
    await updateDoc(doc(db, 'users', userId, 'highlights', highlightId), {
      color,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  async updateHighlightNote(
    userId: string,
    highlightId: string,
    note: string
  ): Promise<void> {
    const db = this.getDb();
    await updateDoc(doc(db, 'users', userId, 'highlights', highlightId), {
      note,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }
}

