import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { Translation } from '../types';

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

export class FeaturedHighlightsService {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  async getFeaturedHighlights(limit_count: number = 5): Promise<FeaturedHighlight[]> {
    const db = this.getDb();
    const q = query(
      collection(db, 'featured-highlights'),
      orderBy('order', 'asc'),
      limit(limit_count)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as FeaturedHighlight));
  }

  async getFeaturedHighlight(id: string): Promise<FeaturedHighlight | null> {
    const db = this.getDb();
    const docRef = doc(db, 'featured-highlights', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as FeaturedHighlight;
  }

  async addFeaturedHighlight(highlight: Omit<FeaturedHighlight, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedHighlight> {
    const db = this.getDb();
    const now = Timestamp.now();

    // Get the next order number
    const q = query(collection(db, 'featured-highlights'), orderBy('order', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const nextOrder = snapshot.empty ? 1 : (snapshot.docs[0].data().order || 0) + 1;

    const docRef = doc(collection(db, 'featured-highlights'));
    const data = {
      ...highlight,
      order: highlight.order || nextOrder,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, data);

    return {
      id: docRef.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as FeaturedHighlight;
  }

  async updateFeaturedHighlight(id: string, updates: Partial<Omit<FeaturedHighlight, 'id' | 'createdAt'>>): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, 'featured-highlights', id);

    await setDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }

  async deleteFeaturedHighlight(id: string): Promise<void> {
    const db = this.getDb();
    await deleteDoc(doc(db, 'featured-highlights', id));
  }

  async reorderFeaturedHighlights(ids: string[]): Promise<void> {
    const db = this.getDb();
    const batch = writeBatch(db);

    ids.forEach((id, index) => {
      const docRef = doc(db, 'featured-highlights', id);
      batch.update(docRef, {
        order: index + 1,
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  }

  async getFeaturedHighlightsWithContent(translations: Translation[]): Promise<Array<FeaturedHighlight & { translationName: string; verseText: string }>> {
    const highlights = await this.getFeaturedHighlights();

    return highlights.map(highlight => {
      const translation = translations.find(t => t.id === highlight.translationId);
      const book = translation?.books.find(b => b.name === highlight.book);
      const chapter = book?.chapters.find(c => c.number === highlight.chapter);
      const verse = chapter?.verses.find(v => v.number === highlight.verse);

      return {
        ...highlight,
        translationName: translation?.name || highlight.translationId,
        verseText: verse?.text || highlight.text,
      };
    });
  }
}
