import axios, { AxiosInstance } from 'axios';
import * as db from './database';

export interface SearchResult {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface SearchQuery {
  query: string;
  translation?: string;
  limit?: number;
}

class SearchService {
  private apiClient: AxiosInstance;
  private apiUrl: string;
  private recentSearches: string[] = [];
  private maxRecentSearches = 10;

  constructor() {
    this.apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
    });
  }

  /**
   * Search for verses online
   */
  async searchOnline(params: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await this.apiClient.get('/api/search', {
        params: {
          q: params.query,
          translation: params.translation || 'KJV',
          limit: params.limit || 50,
        },
      });

      const results = response.data.results || [];
      
      // Cache results locally
      for (const result of results) {
        await db.cacheVerse(
          result.id,
          result.book,
          result.chapter,
          result.verse,
          result.text,
          result.translation
        );
      }

      // Add to recent searches
      this.addRecentSearch(params.query);

      return results;
    } catch (error) {
      console.error('Online search error:', error);
      // Fall back to offline search
      return this.searchOffline(params);
    }
  }

  /**
   * Search for verses offline using cached data
   */
  async searchOffline(params: SearchQuery): Promise<SearchResult[]> {
    try {
      const translation = params.translation || 'KJV';
      const results = await db.searchVerses(params.query, translation);
      
      // Add to recent searches
      this.addRecentSearch(params.query);

      return results;
    } catch (error) {
      console.error('Offline search error:', error);
      return [];
    }
  }

  /**
   * Search with automatic online/offline fallback
   */
  async search(params: SearchQuery): Promise<SearchResult[]> {
    try {
      // Try online first
      return await this.searchOnline(params);
    } catch (error) {
      console.error('Search error:', error);
      // Fall back to offline
      return this.searchOffline(params);
    }
  }

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return this.recentSearches;
  }

  /**
   * Add to recent searches
   */
  private addRecentSearch(query: string): void {
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter((s) => s !== query);
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Keep only max recent searches
    if (this.recentSearches.length > this.maxRecentSearches) {
      this.recentSearches = this.recentSearches.slice(0, this.maxRecentSearches);
    }
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.recentSearches = [];
  }

  /**
   * Get a specific verse
   */
  async getVerse(
    book: string,
    chapter: number,
    verse: number,
    translation: string = 'KJV'
  ): Promise<SearchResult | null> {
    try {
      // Try to get from cache first
      const cached = await db.getVerse(book, chapter, verse, translation);
      if (cached) {
        return cached;
      }

      // Try to fetch from API
      const response = await this.apiClient.get('/api/verse', {
        params: {
          book,
          chapter,
          verse,
          translation,
        },
      });

      const result = response.data;
      
      // Cache it
      if (result) {
        await db.cacheVerse(
          result.id,
          result.book,
          result.chapter,
          result.verse,
          result.text,
          result.translation
        );
      }

      return result || null;
    } catch (error) {
      console.error('Get verse error:', error);
      return null;
    }
  }

  /**
   * Get verses for a book chapter
   */
  async getChapter(
    book: string,
    chapter: number,
    translation: string = 'KJV'
  ): Promise<SearchResult[]> {
    try {
      const response = await this.apiClient.get('/api/chapter', {
        params: {
          book,
          chapter,
          translation,
        },
      });

      const verses = response.data.verses || [];
      
      // Cache all verses
      for (const verse of verses) {
        await db.cacheVerse(
          verse.id,
          verse.book,
          verse.chapter,
          verse.verse,
          verse.text,
          verse.translation
        );
      }

      return verses;
    } catch (error) {
      console.error('Get chapter error:', error);
      return [];
    }
  }

  /**
   * Parse search query for book/chapter/verse format
   */
  parseQuery(query: string): { book?: string; chapter?: number; verse?: number } {
    // Match patterns like "John 3:16", "Genesis 1", etc.
    const patterns = [
      /^(\w+)\s+(\d+):(\d+)$/, // Book Chapter:Verse
      /^(\w+)\s+(\d+)$/, // Book Chapter
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return {
          book: match[1],
          chapter: parseInt(match[2], 10),
          verse: match[3] ? parseInt(match[3], 10) : undefined,
        };
      }
    }

    return {};
  }
}

export default new SearchService();
