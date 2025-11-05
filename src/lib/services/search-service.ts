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
  /**
   * Parse search query to extract:
   * - Exact phrases (quoted strings)
   * - AND/OR operators
   * - Individual words
   */
  private parseQuery(query: string): {
    phrases: string[];
    words: string[];
    operators: ('AND' | 'OR')[];
    useAnd: boolean;
  } {
    const trimmed = query.trim();
    const phrases: string[] = [];
    const words: string[] = [];
    const operators: ('AND' | 'OR')[] = [];
    
    // Extract quoted phrases
    const phraseRegex = /"([^"]+)"/g;
    let match;
    let processedQuery = trimmed;
    
    while ((match = phraseRegex.exec(trimmed)) !== null) {
      phrases.push(match[1]);
      processedQuery = processedQuery.replace(match[0], '');
    }
    
    // Check for AND/OR operators
    const upperQuery = processedQuery.toUpperCase();
    const hasAnd = upperQuery.includes(' AND ');
    const hasOr = upperQuery.includes(' OR ');
    const useAnd = hasAnd && !hasOr;
    
    // Extract individual words
    const wordRegex = /\b\w+\b/g;
    const extractedWords = processedQuery.match(wordRegex) || [];
    
    // Filter out AND/OR from words
    extractedWords.forEach(word => {
      const upperWord = word.toUpperCase();
      if (upperWord !== 'AND' && upperWord !== 'OR') {
        words.push(word);
      }
    });
    
    return { phrases, words, operators, useAnd };
  }

  /**
   * Calculate match score for ranking results
   */
  private calculateMatchScore(text: string, query: string, phrases: string[], words: string[]): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    // Exact phrase matches get highest score
    phrases.forEach(phrase => {
      const phraseLower = phrase.toLowerCase();
      if (lowerText.includes(phraseLower)) {
        score += 100;
        // Bonus for multiple occurrences
        const occurrences = (lowerText.match(new RegExp(phraseLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += occurrences * 10;
      }
    });
    
    // Word matches
    words.forEach(word => {
      const wordLower = word.toLowerCase();
      const wordRegex = new RegExp(`\\b${wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = (lowerText.match(wordRegex) || []).length;
      if (matches > 0) {
        score += 50 * matches; // Word boundary matches score higher
        // Check if it's at the start of the verse (higher relevance)
        if (lowerText.startsWith(wordLower + ' ')) {
          score += 20;
        }
      }
    });
    
    // Exact query match (if not already counted)
    if (phrases.length === 0 && words.length === 1) {
      const queryLower = query.toLowerCase();
      if (lowerText.includes(queryLower)) {
        const exactMatch = lowerText === queryLower;
        if (exactMatch) score += 200;
      }
    }
    
    return score;
  }

  searchInTranslations(
    translations: Translation[],
    query: string,
    options: {
      limit?: number;
      includeContext?: boolean;
      caseSensitive?: boolean;
    } = {}
  ): SearchResult[] {
    const { limit = 500, includeContext = false, caseSensitive = false } = options;
    const results: SearchResult[] = [];
    const { phrases, words, useAnd } = this.parseQuery(query.trim());
    
    // If no query, return empty
    if (phrases.length === 0 && words.length === 0) {
      return results;
    }

    for (const translation of translations) {
      for (const book of translation.books) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            const verseText = caseSensitive ? verse.text : verse.text.toLowerCase();
            let matches = false;
            
            // Check phrase matches
            const phraseMatches = phrases.length === 0 || phrases.every(phrase => {
              const phraseSearch = caseSensitive ? phrase : phrase.toLowerCase();
              return verseText.includes(phraseSearch);
            });
            
            // Check word matches
            let wordMatches = false;
            if (words.length === 0) {
              wordMatches = true; // No words to check
            } else if (useAnd) {
              // All words must match (AND logic)
              wordMatches = words.every(word => {
                const wordSearch = caseSensitive ? word : word.toLowerCase();
                // Use word boundary for better matching
                const wordRegex = new RegExp(`\\b${wordSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseSensitive ? 'g' : 'gi');
                return wordRegex.test(verseText);
              });
            } else {
              // Any word matches (OR logic)
              wordMatches = words.some(word => {
                const wordSearch = caseSensitive ? word : word.toLowerCase();
                const wordRegex = new RegExp(`\\b${wordSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseSensitive ? 'g' : 'gi');
                return wordRegex.test(verseText);
              });
            }
            
            // Match if phrases match AND words match
            matches = phraseMatches && wordMatches;
            
            if (matches) {
              // Calculate match score for ranking
              const score = this.calculateMatchScore(verse.text, query, phrases, words);
              
              // Highlight all matches (phrases first, then words)
              // Use a temporary marker to avoid double-highlighting
              let matchedText = verse.text;
              const highlighted = new Set<string>();
              
              // Highlight phrases first
              phrases.forEach(phrase => {
                if (!highlighted.has(phrase.toLowerCase())) {
                  matchedText = this.highlightMatch(matchedText, phrase, caseSensitive);
                  highlighted.add(phrase.toLowerCase());
                }
              });
              
              // Then highlight individual words (but skip words already in phrases)
              words.forEach(word => {
                const wordLower = word.toLowerCase();
                // Check if this word is part of any phrase
                const inPhrase = phrases.some(phrase => phrase.toLowerCase().includes(wordLower));
                if (!inPhrase && !highlighted.has(wordLower)) {
                  matchedText = this.highlightMatch(matchedText, word, caseSensitive);
                  highlighted.add(wordLower);
                }
              });
              
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
                // @ts-ignore - Add score for sorting
                _score: score,
              });

              if (results.length >= limit) {
                // Sort by score before returning
                return results.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));
              }
            }
          }
        }
      }
    }

    // Sort by score (highest first)
    return results.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));
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
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    if (caseSensitive) {
      // Use word boundary for better word matching
      const regex = new RegExp(`\\b(${escapedQuery})\\b`, 'g');
      return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 font-semibold">$1</mark>');
    } else {
      // Case-insensitive with word boundary
      const regex = new RegExp(`\\b(${escapedQuery})\\b`, 'gi');
      return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 font-semibold">$1</mark>');
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

