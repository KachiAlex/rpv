import { getFirebase } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { CrossReference } from '../types';

export class CrossReferenceService {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  /**
   * Get cross-references for a specific verse
   */
  async getCrossReferences(
    translationId: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<CrossReference[]> {
    const db = this.getDb();
    const crossRefsRef = collection(db, 'crossReferences');
    
    // Query for references that point FROM this verse
    const fromQuery = query(
      crossRefsRef,
      where('fromTranslationId', '==', translationId),
      where('fromBook', '==', book),
      where('fromChapter', '==', chapter),
      where('fromVerse', '==', verse)
    );
    
    const fromSnapshot = await getDocs(fromQuery);
    const results: CrossReference[] = [];
    
    fromSnapshot.docs.forEach(doc => {
      const data = doc.data();
      results.push({
        id: doc.id,
        fromTranslationId: data.fromTranslationId,
        fromBook: data.fromBook,
        fromChapter: data.fromChapter,
        fromVerse: data.fromVerse,
        toTranslationId: data.toTranslationId || translationId, // Default to same translation
        toBook: data.toBook,
        toChapter: data.toChapter,
        toVerse: data.toVerse,
        type: data.type || 'related',
        note: data.note,
      } as CrossReference);
    });
    
    return results;
  }

  /**
   * Add a cross-reference
   */
  async addCrossReference(reference: Omit<CrossReference, 'id'>): Promise<string> {
    const db = this.getDb();
    const crossRefsRef = collection(db, 'crossReferences');
    const docRef = doc(crossRefsRef);
    
    await setDoc(docRef, {
      ...reference,
      toTranslationId: reference.toTranslationId || reference.fromTranslationId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  }

  /**
   * Get commonly referenced verses for popular verses
   * This is a static helper that can be used for initial cross-references
   */
  getCommonCrossReferences(
    book: string,
    chapter: number,
    verse: number
  ): Array<Omit<CrossReference, 'id' | 'fromTranslationId' | 'toTranslationId'>> {
    // Common cross-references - can be expanded
    const commonRefs: Record<string, Array<{ book: string; chapter: number; verse: number; type?: CrossReference['type'] }>> = {
      'John 3:16': [
        { book: 'Romans', chapter: 5, verse: 8, type: 'similar' },
        { book: '1 John', chapter: 4, verse: 9, type: 'similar' },
        { book: 'Ephesians', chapter: 2, verse: 8, type: 'related' },
      ],
      'Romans 8:28': [
        { book: 'Philippians', chapter: 4, verse: 13, type: 'similar' },
        { book: 'Jeremiah', chapter: 29, verse: 11, type: 'related' },
      ],
      'Philippians 4:13': [
        { book: '2 Corinthians', chapter: 12, verse: 9, type: 'similar' },
        { book: 'Isaiah', chapter: 40, verse: 31, type: 'related' },
      ],
      'Jeremiah 29:11': [
        { book: 'Romans', chapter: 8, verse: 28, type: 'related' },
        { book: 'Proverbs', chapter: 3, verse: 5, type: 'related' },
      ],
      'Proverbs 3:5': [
        { book: 'Proverbs', chapter: 3, verse: 6, type: 'parallel' },
        { book: 'Jeremiah', chapter: 29, verse: 11, type: 'related' },
      ],
      'Matthew 6:33': [
        { book: 'Matthew', chapter: 6, verse: 34, type: 'parallel' },
        { book: 'Philippians', chapter: 4, verse: 19, type: 'related' },
      ],
      '1 Corinthians 13:4': [
        { book: '1 Corinthians', chapter: 13, verse: 5, type: 'parallel' },
        { book: '1 John', chapter: 4, verse: 16, type: 'similar' },
      ],
    };

    const key = `${book} ${chapter}:${verse}`;
    const refs = commonRefs[key];
    
    if (!refs) return [];
    
    return refs.map(ref => ({
      fromBook: book,
      fromChapter: chapter,
      fromVerse: verse,
      toBook: ref.book,
      toChapter: ref.chapter,
      toVerse: ref.verse,
      type: ref.type || 'related',
    }));
  }

  /**
   * Get all cross-references that point TO a specific verse
   * Useful for showing "this verse is referenced by..."
   */
  async getReferencedBy(
    translationId: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<CrossReference[]> {
    const db = this.getDb();
    const crossRefsRef = collection(db, 'crossReferences');
    
    const toQuery = query(
      crossRefsRef,
      where('toTranslationId', '==', translationId),
      where('toBook', '==', book),
      where('toChapter', '==', chapter),
      where('toVerse', '==', verse)
    );
    
    const toSnapshot = await getDocs(toQuery);
    const results: CrossReference[] = [];
    
    toSnapshot.docs.forEach(doc => {
      const data = doc.data();
      results.push({
        id: doc.id,
        fromTranslationId: data.fromTranslationId,
        fromBook: data.fromBook,
        fromChapter: data.fromChapter,
        fromVerse: data.fromVerse,
        toTranslationId: data.toTranslationId || translationId,
        toBook: data.toBook,
        toChapter: data.toChapter,
        toVerse: data.toVerse,
        type: data.type || 'related',
        note: data.note,
      } as CrossReference);
    });
    
    return results;
  }
}

