import type { Translation, Book, Chapter, Verse } from '../types';

export interface SearchResult {
  translationId: string;
  translationName: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  matchedText: string;
  context?: string;
}

export class SearchService {
  searchInTranslations(
    translations: Translation[],
    query: string,
    options: {
      limit?: number;
      includeContext?: boolean;
      caseSensitive?: boolean;
    } = {}
  ): SearchResult[] {
    const { limit = 100, includeContext = false, caseSensitive = false } = options;
    const results: SearchResult[] = [];
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    for (const translation of translations) {
      for (const book of translation.books) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            const verseText = caseSensitive ? verse.text : verse.text.toLowerCase();
            
            if (verseText.includes(searchQuery)) {
              const matchedText = this.highlightMatch(verse.text, query, caseSensitive);
              const context = includeContext ? this.getContext(verse.text, query, 50) : undefined;

              results.push({
                translationId: translation.id,
                translationName: translation.name,
                book: book.name,
                chapter: chapter.number,
                verse: verse.number,
                text: verse.text,
                matchedText,
                context,
              });

              if (results.length >= limit) {
                return results;
              }
            }
          }
        }
      }
    }

    return results;
  }

  searchInBook(
    book: Book,
    query: string,
    options: {
      limit?: number;
      caseSensitive?: boolean;
    } = {}
  ): SearchResult[] {
    const { limit = 100, caseSensitive = false } = options;
    const results: SearchResult[] = [];
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const verseText = caseSensitive ? verse.text : verse.text.toLowerCase();
        
        if (verseText.includes(searchQuery)) {
          const matchedText = this.highlightMatch(verse.text, query, caseSensitive);

          results.push({
            translationId: '',
            translationName: '',
            book: book.name,
            chapter: chapter.number,
            verse: verse.number,
            text: verse.text,
            matchedText,
          });

          if (results.length >= limit) {
            return results;
          }
        }
      }
    }

    return results;
  }

  private highlightMatch(text: string, query: string, caseSensitive: boolean): string {
    if (caseSensitive) {
      return text.replace(
        new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'),
        '<mark>$1</mark>'
      );
    } else {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }
  }

  private getContext(text: string, query: string, contextLength: number): string {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);
    
    let context = text.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  // Advanced search with multiple terms
  searchWithTerms(
    translations: Translation[],
    terms: string[],
    options: {
      matchAll?: boolean; // true = all terms must match, false = any term matches
      limit?: number;
    } = {}
  ): SearchResult[] {
    const { matchAll = false, limit = 100 } = options;
    const results: SearchResult[] = [];

    for (const translation of translations) {
      for (const book of translation.books) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            const verseText = verse.text.toLowerCase();
            
            let matches = false;
            if (matchAll) {
              matches = terms.every(term => verseText.includes(term.toLowerCase()));
            } else {
              matches = terms.some(term => verseText.includes(term.toLowerCase()));
            }

            if (matches) {
              let matchedText = verse.text;
              terms.forEach(term => {
                matchedText = this.highlightMatch(matchedText, term, false);
              });

              results.push({
                translationId: translation.id,
                translationName: translation.name,
                book: book.name,
                chapter: chapter.number,
                verse: verse.number,
                text: verse.text,
                matchedText,
              });

              if (results.length >= limit) {
                return results;
              }
            }
          }
        }
      }
    }

    return results;
  }
}

