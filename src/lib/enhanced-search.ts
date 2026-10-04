import { BibleVerse, enhancedBibleVerses, enhancedKeywordMappings } from './enhanced-bible-data';

export interface SearchResult extends BibleVerse {
  relevance_score: number;
  match_reasons: string[];
}

export class EnhancedBibleSearch {
  private verses: BibleVerse[];
  private keywordMappings: { [key: string]: string[] };

  constructor() {
    this.verses = enhancedBibleVerses;
    this.keywordMappings = enhancedKeywordMappings;
  }

  /**
   * Enhanced search with multiple scoring factors
   */
  search(query: string, limit: number = 10): SearchResult[] {
    const queryLower = query.toLowerCase().trim();
    
    if (!queryLower) {
      return [];
    }

    // Extract search terms and map to keywords
    const searchTerms = this.extractSearchTerms(queryLower);
    const expandedKeywords = this.expandKeywords(searchTerms);
    
    // Score all verses
    const scoredVerses = this.verses.map(verse => {
      const score = this.calculateRelevanceScore(verse, queryLower, searchTerms, expandedKeywords);
      return {
        ...verse,
        relevance_score: score.total,
        match_reasons: score.reasons
      };
    }).filter(verse => verse.relevance_score > 0);

    // Sort by relevance and limit results
    return scoredVerses
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
  }

  /**
   * Extract meaningful search terms from query
   */
  private extractSearchTerms(query: string): string[] {
    // Remove common stop words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'what', 'how', 'when', 'where', 'why', 'does', 'do', 'is', 'are', 'can', 'should', 'will', 'would'];
    
    return query
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.includes(term))
      .map(term => term.replace(/[^\w]/g, ''));
  }

  /**
   * Expand search terms using keyword mappings
   */
  private expandKeywords(searchTerms: string[]): string[] {
    const expanded = new Set<string>();
    
    searchTerms.forEach(term => {
      expanded.add(term);
      
      // Add mapped keywords
      if (this.keywordMappings[term]) {
        this.keywordMappings[term].forEach(keyword => expanded.add(keyword));
      }
      
      // Check if term is contained in any mapping key
      Object.entries(this.keywordMappings).forEach(([key, keywords]) => {
        if (key.includes(term) || term.includes(key)) {
          keywords.forEach(keyword => expanded.add(keyword));
        }
      });
    });
    
    return Array.from(expanded);
  }

  /**
   * Calculate comprehensive relevance score
   */
  private calculateRelevanceScore(
    verse: BibleVerse, 
    originalQuery: string, 
    searchTerms: string[], 
    expandedKeywords: string[]
  ): { total: number; reasons: string[] } {
    const verseText = verse.text.toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    // 1. Exact phrase matching (highest weight)
    if (verseText.includes(originalQuery)) {
      score += 100;
      reasons.push('Exact phrase match');
    }

    // 2. Topic matching (high weight)
    const topicMatches = verse.topics.filter(topic => 
      searchTerms.some(term => topic.includes(term) || term.includes(topic))
    );
    if (topicMatches.length > 0) {
      score += topicMatches.length * 50;
      reasons.push(`Topic match: ${topicMatches.join(', ')}`);
    }

    // 3. Direct keyword matching (medium-high weight)
    const directMatches = searchTerms.filter(term => verseText.includes(term));
    if (directMatches.length > 0) {
      score += directMatches.length * 30;
      reasons.push(`Direct keyword match: ${directMatches.join(', ')}`);
    }

    // 4. Expanded keyword matching (medium weight)
    const expandedMatches = expandedKeywords.filter(keyword => 
      verseText.includes(keyword) && !searchTerms.includes(keyword)
    );
    if (expandedMatches.length > 0) {
      score += expandedMatches.length * 20;
      reasons.push(`Related keyword match: ${expandedMatches.slice(0, 3).join(', ')}`);
    }

    // 5. Semantic similarity bonus (low weight)
    const semanticScore = this.calculateSemanticSimilarity(originalQuery, verseText);
    if (semanticScore > 0) {
      score += semanticScore * 10;
      reasons.push('Semantic similarity');
    }

    // 6. Length penalty for very long verses (readability)
    if (verse.text.length > 200) {
      score *= 0.9;
    }

    // 7. Popular verse bonus (well-known verses)
    if (this.isPopularVerse(verse)) {
      score *= 1.1;
      reasons.push('Popular verse');
    }

    // Normalize score to 0-1 range
    const normalizedScore = Math.min(score / 100, 1);

    return {
      total: Math.round(normalizedScore * 10000) / 10000,
      reasons: reasons.length > 0 ? reasons : ['General relevance']
    };
  }

  /**
   * Simple semantic similarity calculation
   */
  private calculateSemanticSimilarity(query: string, text: string): number {
    const queryWords = new Set(query.split(/\s+/));
    const textWords = new Set(text.split(/\s+/));
    
    const intersection = new Set([...queryWords].filter(word => textWords.has(word)));
    const union = new Set([...queryWords, ...textWords]);
    
    return intersection.size / union.size;
  }

  /**
   * Check if verse is commonly referenced
   */
  private isPopularVerse(verse: BibleVerse): boolean {
    const popularVerses = [
      'John 3:16',
      'Romans 8:28',
      'Philippians 4:13',
      'Psalm 23:1',
      'Isaiah 41:10',
      'Jeremiah 29:11',
      'Matthew 11:28',
      'Philippians 4:6',
      'Philippians 4:7',
      '1 John 4:8'
    ];
    
    const verseRef = `${verse.book} ${verse.chapter}:${verse.verse}`;
    return popularVerses.includes(verseRef);
  }

  /**
   * Get search suggestions based on query
   */
  getSuggestions(query: string): string[] {
    const queryLower = query.toLowerCase();
    const suggestions: string[] = [];
    
    // Find related topics
    Object.keys(this.keywordMappings).forEach(topic => {
      if (topic.includes(queryLower) || queryLower.includes(topic)) {
        suggestions.push(`Find verses about ${topic}`);
      }
    });
    
    // Add common search patterns
    if (queryLower.includes('how')) {
      suggestions.push('How to find peace', 'How to overcome fear', 'How to have faith');
    }
    
    if (queryLower.includes('what')) {
      suggestions.push('What does the Bible say about love', 'What is faith', 'What is salvation');
    }
    
    return suggestions.slice(0, 5);
  }

  /**
   * Get statistics about the search engine
   */
  getStats() {
    const topicCounts: { [key: string]: number } = {};
    
    this.verses.forEach(verse => {
      verse.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    
    return {
      total_verses: this.verses.length,
      total_topics: Object.keys(topicCounts).length,
      most_common_topics: Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count })),
      books_covered: [...new Set(this.verses.map(v => v.book))].length
    };
  }
}