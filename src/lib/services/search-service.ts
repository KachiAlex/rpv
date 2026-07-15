import type { Translation, Book } from '../types';
import { useBibleStore } from '../store';

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
   * OPTIMIZED: Search with lazy loading - only loads content when needed
   */
  async searchInTranslationsOptimized(
    translations: Translation[],
    query: string,
    options: {
      limit?: number;
      includeContext?: boolean;
      caseSensitive?: boolean;
      searchType?: 'keywords' | 'phrases' | 'exact';
      bookFilter?: string[];
      testamentFilter?: 'old' | 'new' | 'all';
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 1000, includeContext = false, caseSensitive = false, searchType = 'keywords', bookFilter, testamentFilter = 'all' } = options;
    
    console.log('[SearchService] Starting optimized search with lazy loading...');
    const startTime = performance.now();
    
    const results: SearchResult[] = [];
    const { loadBookContent } = useBibleStore.getState();
    
    // Filter translations that have content or can load content
    const searchableTranslations = translations.filter(t => t && t.books && t.books.length > 0);
    
    for (const translation of searchableTranslations) {
      console.log(`[SearchService] Searching in translation: ${translation.name} (${translation.books.length} books)`);
      
      // Filter books based on testament and book filters
      let booksToSearch = translation.books;
      
      // IMPORTANT: Filter out unpublished books for end users
      booksToSearch = booksToSearch.filter(book => book.published !== false);
      
      if (testamentFilter !== 'all') {
        booksToSearch = this.filterBooksByTestament(booksToSearch, testamentFilter);
      }
      
      if (bookFilter && bookFilter.length > 0) {
        booksToSearch = booksToSearch.filter(book => bookFilter.includes(book.name));
      }
      
      console.log(`[SearchService] Searching in ${booksToSearch.length} filtered books`);
      
      for (const book of booksToSearch) {
        // Check if book has content loaded
        const hasContent = book.chapters && book.chapters.length > 0 && 
                          book.chapters.some(ch => ch.verses && ch.verses.length > 0);
        
        if (!hasContent) {
          // Lazy load book content on demand
          console.log(`[SearchService] Lazy loading content for book: ${book.name}`);
          try {
            await loadBookContent(translation.id, book.name);
            // Get updated book from store
            const updatedTranslation = useBibleStore.getState().translations.find(t => t.id === translation.id);
            const updatedBook = updatedTranslation?.books.find(b => b.name === book.name);
            if (updatedBook) {
              // Search in the newly loaded book
              const bookResults = this.searchInBook(updatedBook, query, { limit: limit - results.length, caseSensitive });
              results.push(...bookResults.map(result => ({
                ...result,
                translationId: translation.id,
                translationName: translation.name,
              })));
            }
          } catch (error) {
            console.warn(`[SearchService] Failed to load content for book ${book.name}:`, error);
            continue;
          }
        } else {
          // Search in already loaded content
          const bookResults = this.searchInBook(book, query, { limit: limit - results.length, caseSensitive });
          results.push(...bookResults.map(result => ({
            ...result,
            translationId: translation.id,
            translationName: translation.name,
          })));
        }
        
        if (results.length >= limit) {
          break;
        }
      }
      
      if (results.length >= limit) {
        break;
      }
    }
    
    const endTime = performance.now();
    console.log(`[SearchService] Optimized search completed in ${(endTime - startTime).toFixed(2)}ms, found ${results.length} results`);
    
    // Sort by relevance score if available
    return results.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));
  }

  /**
   * Filter books by Old Testament or New Testament
   */
  private filterBooksByTestament(books: { name: string; chapters: any[] }[], testament: 'old' | 'new'): { name: string; chapters: any[] }[] {
    const oldTestamentBooks = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
      '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
      'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
      'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
      'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
      'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ];
    
    const newTestamentBooks = [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts',
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
      'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
      'Jude', 'Revelation'
    ];
    
    const targetBooks = testament === 'old' ? oldTestamentBooks : newTestamentBooks;
    return books.filter(book => targetBooks.includes(book.name));
  }
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
        try {
          const escapedPhrase = phraseLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const occurrences = (lowerText.match(new RegExp(escapedPhrase, 'g')) || []).length;
          score += occurrences * 10;
        } catch (e) {
          // Fallback to simple count if regex fails
          const occurrences = lowerText.split(phraseLower).length - 1;
          score += occurrences * 10;
        }
      }
    });
    
    // Word matches
    words.forEach(word => {
      const wordLower = word.toLowerCase();
      try {
        const escapedWord = wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        const matches = (lowerText.match(wordRegex) || []).length;
        if (matches > 0) {
          score += 50 * matches; // Word boundary matches score higher
          // Check if it's at the start of the verse (higher relevance)
          if (lowerText.startsWith(wordLower + ' ')) {
            score += 20;
          }
        }
      } catch (e) {
        // Fallback to simple includes if regex fails
        if (lowerText.includes(wordLower)) {
          score += 25;
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
      searchType?: 'keywords' | 'phrases' | 'exact';
    } = {}
  ): SearchResult[] {
    const { limit = 1000, includeContext = false, caseSensitive = false, searchType = 'keywords' } = options;
    
    // Handle different search types
    if (searchType === 'exact') {
      return this.exactSearch(translations, query, { limit, caseSensitive, includeContext });
    } else if (searchType === 'phrases') {
      return this.phraseSearch(translations, query, { limit, caseSensitive, includeContext });
    }
    
    // Default keywords search with semantic matching
    const results: SearchResult[] = [];
    const { phrases, words, useAnd } = this.parseQuery(query.trim());
    
    // If no query, return empty
    if (phrases.length === 0 && words.length === 0) {
      return results;
    }

    // Enhanced keyword search - find ALL verses containing any of the keywords
    const searchTerms = [...phrases, ...words];
    const allKeywords = new Set<string>();
    
    // Add original search terms
    searchTerms.forEach(term => {
      allKeywords.add(term.toLowerCase());
      // Add partial matches for longer words
      if (term.length > 4) {
        const termLower = term.toLowerCase();
        // Add common word variations
        if (termLower.endsWith('s')) allKeywords.add(termLower.slice(0, -1));
        if (termLower.endsWith('ed')) allKeywords.add(termLower.slice(0, -2));
        if (termLower.endsWith('ing')) allKeywords.add(termLower.slice(0, -3));
        if (termLower.endsWith('ly')) allKeywords.add(termLower.slice(0, -2));
      }
    });

    for (const translation of translations) {
      if (!translation || !translation.books) continue;
      
      for (const book of translation.books) {
        if (!book || !book.chapters) continue;
        
        // IMPORTANT: Filter out unpublished books for end users
        if (book.published === false) continue;
        
        for (const chapter of book.chapters) {
          if (!chapter || !chapter.verses) continue;
          
          for (const verse of chapter.verses) {
            if (!verse || !verse.text) continue;
            
            const verseText = caseSensitive ? verse.text : verse.text.toLowerCase();
            let matches = false;
            let matchScore = 0;
            const matchReasons: string[] = [];
            
            // Check phrase matches (exact phrases get highest priority)
            const phraseMatches = phrases.length === 0 || phrases.every(phrase => {
              const phraseSearch = caseSensitive ? phrase : phrase.toLowerCase();
              const hasPhrase = verseText.includes(phraseSearch);
              if (hasPhrase) {
                matchScore += 100;
                matchReasons.push(`Exact phrase: "${phrase}"`);
              }
              return hasPhrase;
            });
            
            // Check word matches with expanded keyword search
            let wordMatches = false;
            if (words.length === 0) {
              wordMatches = true; // No words to check
            } else {
              const wordMatchCount = words.filter(word => {
                const wordSearch = caseSensitive ? word : word.toLowerCase();
                try {
                  // Try exact word boundary match first
                  const escapedWord = wordSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const wordRegex = new RegExp(`\\b${escapedWord}\\b`, caseSensitive ? 'g' : 'gi');
                  const hasExactMatch = wordRegex.test(verseText);
                  
                  if (hasExactMatch) {
                    matchScore += 50;
                    matchReasons.push(`Keyword: ${word}`);
                    return true;
                  }
                  
                  // Try partial match for longer words
                  if (wordSearch.length > 3 && verseText.includes(wordSearch)) {
                    matchScore += 25;
                    matchReasons.push(`Partial: ${word}`);
                    return true;
                  }
                  
                  // Try common variations
                  const variations = [
                    wordSearch + 's',
                    wordSearch + 'ed',
                    wordSearch + 'ing',
                    wordSearch + 'ly',
                    wordSearch.endsWith('s') ? wordSearch.slice(0, -1) : null,
                    wordSearch.endsWith('ed') ? wordSearch.slice(0, -2) : null,
                    wordSearch.endsWith('ing') ? wordSearch.slice(0, -3) : null,
                    wordSearch.endsWith('ly') ? wordSearch.slice(0, -2) : null
                  ].filter(Boolean) as string[];
                  
                  for (const variation of variations) {
                    if (variation && verseText.includes(variation)) {
                      matchScore += 15;
                      matchReasons.push(`Variation: ${variation}`);
                      return true;
                    }
                  }
                  
                  return false;
                } catch (e) {
                  // Fallback to simple includes
                  const hasMatch = verseText.includes(wordSearch);
                  if (hasMatch) {
                    matchScore += 10;
                    matchReasons.push(`Contains: ${word}`);
                  }
                  return hasMatch;
                }
              }).length;
              
              if (useAnd) {
                // All words must match (AND logic)
                wordMatches = wordMatchCount === words.length;
              } else {
                // Any word matches (OR logic)
                wordMatches = wordMatchCount > 0;
              }
            }
            
            // Match if phrases match AND words match
            matches = phraseMatches && wordMatches;
            
            // Also include verses that contain any of the expanded keywords (broader search)
            if (!matches && searchTerms.length === 1 && searchTerms[0].length > 2) {
              const searchTerm = searchTerms[0].toLowerCase();
              // Check for semantic matches (common Bible terms)
              const semanticMatches = this.getSemanticMatches(searchTerm);
              for (const semantic of semanticMatches) {
                if (verseText.includes(semantic)) {
                  matches = true;
                  matchScore += 5;
                  matchReasons.push(`Related: ${semantic}`);
                  break;
                }
              }
            }
            
            if (matches && matchScore > 0) {
              // Calculate final match score for ranking
              const finalScore = this.calculateMatchScore(verse.text, query, phrases, words) + matchScore;
              
              // Highlight all matches (phrases first, then words)
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
                _score: finalScore,
                // @ts-ignore - Add match reasons for debugging
                _matchReasons: matchReasons,
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
    try {
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
    } catch (e) {
      // Fallback to simple replacement if regex fails
      const flags = caseSensitive ? 'g' : 'gi';
      try {
        const simpleRegex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
        return text.replace(simpleRegex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 font-semibold">$1</mark>');
      } catch (e2) {
        // Ultimate fallback - just return original text
        return text;
      }
    }
  }

  // Exact search - only exact matches
  private exactSearch(
    translations: Translation[],
    query: string,
    options: { limit: number; caseSensitive: boolean; includeContext: boolean }
  ): SearchResult[] {
    const { limit, caseSensitive, includeContext } = options;
    const results: SearchResult[] = [];
    const searchQuery = caseSensitive ? query.trim() : query.trim().toLowerCase();

    for (const translation of translations) {
      if (!translation || !translation.books) continue;
      
      for (const book of translation.books) {
        if (!book || !book.chapters) continue;
        
        // IMPORTANT: Filter out unpublished books for end users
        if (book.published === false) continue;
        
        for (const chapter of book.chapters) {
          if (!chapter || !chapter.verses) continue;
          
          for (const verse of chapter.verses) {
            if (!verse || !verse.text) continue;
            
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

  // Phrase search - focuses on exact phrases and common Bible terms
  private phraseSearch(
    translations: Translation[],
    query: string,
    options: { limit: number; caseSensitive: boolean; includeContext: boolean }
  ): SearchResult[] {
    const { limit, caseSensitive, includeContext } = options;
    const results: SearchResult[] = [];
    const searchQuery = caseSensitive ? query.trim() : query.trim().toLowerCase();
    
    // Common Bible terms and names for better phrase matching
    const bibleTerms = [
      'pharisees', 'sadducees', 'scribes', 'disciples', 'apostles',
      'jerusalem', 'galilee', 'nazareth', 'bethlehem', 'capernaum',
      'moses', 'abraham', 'david', 'solomon', 'peter', 'paul', 'john',
      'mary', 'martha', 'lazarus', 'nicodemus', 'pilate', 'herod',
      'temple', 'synagogue', 'sabbath', 'passover', 'pentecost',
      'covenant', 'testament', 'prophecy', 'miracle', 'parable',
      'kingdom of heaven', 'kingdom of god', 'son of man', 'son of god',
      'holy spirit', 'word of god', 'lamb of god', 'bread of life'
    ];

    for (const translation of translations) {
      if (!translation || !translation.books) continue;
      
      for (const book of translation.books) {
        if (!book || !book.chapters) continue;
        
        // IMPORTANT: Filter out unpublished books for end users
        if (book.published === false) continue;
        
        for (const chapter of book.chapters) {
          if (!chapter || !chapter.verses) continue;
          
          for (const verse of chapter.verses) {
            if (!verse || !verse.text) continue;
            
            const verseText = caseSensitive ? verse.text : verse.text.toLowerCase();
            let score = 0;
            let matchReasons: string[] = [];
            
            // Check for exact query match
            if (verseText.includes(searchQuery)) {
              score += 100;
              matchReasons.push('Exact phrase match');
            }
            
            // Check for Bible terms
            const queryTerms = searchQuery.split(/\s+/);
            for (const term of queryTerms) {
              if (term.length > 2) {
                for (const bibleTerm of bibleTerms) {
                  if (bibleTerm.includes(term) || term.includes(bibleTerm)) {
                    if (verseText.includes(bibleTerm)) {
                      score += 50;
                      matchReasons.push(`Bible term: ${bibleTerm}`);
                    }
                  }
                }
                
                // Direct term match
                if (verseText.includes(term)) {
                  score += 25;
                  matchReasons.push(`Contains: ${term}`);
                }
              }
            }
            
            if (score > 0) {
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
                // @ts-ignore - Add score for sorting
                _score: score,
                // @ts-ignore - Add match reasons
                _matchReasons: matchReasons,
              });

              if (results.length >= limit) {
                return results.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));
              }
            }
          }
        }
      }
    }

    return results.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));
  }

  private getSemanticMatches(searchTerm: string): string[] {
    const semanticMap: { [key: string]: string[] } = {
      'love': ['beloved', 'charity', 'affection', 'compassion', 'mercy', 'kindness'],
      'peace': ['rest', 'calm', 'tranquil', 'quiet', 'still', 'comfort'],
      'joy': ['rejoice', 'glad', 'happy', 'delight', 'merry', 'cheerful'],
      'hope': ['trust', 'faith', 'confidence', 'expectation', 'assurance'],
      'faith': ['believe', 'trust', 'confidence', 'assurance', 'conviction'],
      'fear': ['afraid', 'terror', 'dread', 'anxiety', 'worry', 'concern'],
      'strength': ['power', 'might', 'strong', 'mighty', 'force', 'vigor'],
      'wisdom': ['wise', 'understanding', 'knowledge', 'prudence', 'insight'],
      'forgiveness': ['forgive', 'pardon', 'mercy', 'grace', 'remission'],
      'salvation': ['save', 'deliver', 'redeem', 'rescue', 'deliverance'],
      'prayer': ['pray', 'supplication', 'petition', 'intercession', 'request'],
      'blessing': ['bless', 'blessed', 'favor', 'grace', 'prosperity'],
      'righteousness': ['righteous', 'just', 'justice', 'upright', 'holy'],
      'sin': ['transgression', 'iniquity', 'wickedness', 'evil', 'wrong'],
      'grace': ['favor', 'mercy', 'kindness', 'blessing', 'goodness'],
      'glory': ['honor', 'praise', 'majesty', 'splendor', 'magnificence'],
      'eternal': ['everlasting', 'forever', 'perpetual', 'endless', 'immortal'],
      'heaven': ['paradise', 'glory', 'celestial', 'divine', 'heavenly'],
      'earth': ['world', 'ground', 'land', 'creation', 'nature'],
      'light': ['brightness', 'illumination', 'radiance', 'shine', 'lamp'],
      'darkness': ['shadow', 'night', 'gloom', 'blackness', 'evil'],
      'truth': ['true', 'honest', 'faithful', 'genuine', 'real'],
      'life': ['living', 'alive', 'existence', 'breath', 'soul'],
      'death': ['die', 'dead', 'grave', 'tomb', 'perish'],
      'heart': ['soul', 'mind', 'spirit', 'inner', 'core'],
      'spirit': ['soul', 'ghost', 'breath', 'wind', 'essence'],
      'word': ['saying', 'speech', 'command', 'promise', 'scripture'],
      'kingdom': ['reign', 'rule', 'dominion', 'authority', 'government'],
      'servant': ['serve', 'minister', 'helper', 'worker', 'slave'],
      'master': ['lord', 'ruler', 'owner', 'commander', 'chief'],
      'father': ['parent', 'ancestor', 'creator', 'patriarch'],
      'son': ['child', 'offspring', 'heir', 'descendant'],
      'holy': ['sacred', 'divine', 'pure', 'sanctified', 'consecrated'],
      'evil': ['wicked', 'bad', 'wrong', 'sinful', 'corrupt'],
      'good': ['righteous', 'pure', 'holy', 'perfect', 'excellent'],
      'great': ['mighty', 'powerful', 'magnificent', 'wonderful', 'awesome'],
      'small': ['little', 'least', 'humble', 'lowly', 'minor']
    };
    
    return semanticMap[searchTerm] || [];
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
      if (!translation || !translation.books) continue;
      
      for (const book of translation.books) {
        if (!book || !book.chapters) continue;
        
        for (const chapter of book.chapters) {
          if (!chapter || !chapter.verses) continue;
          
          for (const verse of chapter.verses) {
            if (!verse || !verse.text) continue;
            
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