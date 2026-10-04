import type { CrossReference } from '../types';

export class CrossReferenceService {
  async getCrossReferences(_translationId: string, _book: string, _chapter: number, _verse: number): Promise<CrossReference[]> { return []; }
  async addCrossReference(_reference: Omit<CrossReference, 'id'>): Promise<string> { return ''; }

  getCommonCrossReferences(
    book: string,
    chapter: number,
    verse: number
  ): Array<Omit<CrossReference, 'id' | 'fromTranslationId' | 'toTranslationId'>> {
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

  async getReferencedBy(_translationId: string, _book: string, _chapter: number, _verse: number): Promise<CrossReference[]> { return []; }
}
