// Enhanced Bible search functionality for frontend
import { useBibleStore } from '@/lib/store';
import type { Translation } from '@/lib/types';

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  topics?: string[];
  relevance_score?: number;
}

export interface SearchResult extends BibleVerse {
  relevance_score: number;
  match_reasons: string[];
}

// Enhanced keyword mappings for AI search
export const enhancedKeywordMappings: { [key: string]: string[] } = {
  'anxiety': ['careful', 'peace', 'worry', 'fear', 'care', 'anxious', 'troubled', 'distressed'],
  'worry': ['careful', 'peace', 'anxiety', 'fear', 'care', 'thought', 'troubled'],
  'fear': ['fear', 'afraid', 'dismayed', 'courage', 'strong', 'terror', 'dread'],
  'depression': ['comfort', 'healing', 'broken', 'rest', 'peace', 'sorrow', 'mourning'],
  'sadness': ['comfort', 'healing', 'broken', 'joy', 'peace', 'sorrow', 'weep'],
  'love': ['love', 'loved', 'charity', 'kindness', 'beloved', 'affection'],
  'faith': ['faith', 'believeth', 'trust', 'believing', 'confidence', 'assurance'],
  'hope': ['hope', 'expected', 'future', 'renewal', 'expectation', 'confidence'],
  'peace': ['peace', 'rest', 'comfort', 'understanding', 'calm', 'tranquil'],
  'forgiveness': ['forgive', 'forgiven', 'cleanse', 'mercy', 'pardon', 'remission'],
  'strength': ['strength', 'strengthen', 'strong', 'power', 'might', 'mighty'],
  'comfort': ['comfort', 'rest', 'healing', 'shepherd', 'peace', 'consolation'],
  'guidance': ['direct', 'paths', 'light', 'lamp', 'direction', 'lead', 'guide'],
  'wisdom': ['wisdom', 'understanding', 'knowledge', 'wise', 'prudence', 'insight'],
  'god': ['god', 'lord', 'father', 'christ', 'jesus', 'almighty', 'creator'],
  'prayer': ['prayer', 'ask', 'seek', 'knock', 'supplication', 'petition'],
  'pharisees': ['pharisee', 'pharisees', 'scribes', 'lawyers', 'hypocrites'],
  'disciples': ['disciple', 'disciples', 'apostles', 'followers', 'twelve'],
  'jerusalem': ['jerusalem', 'zion', 'holy city', 'city of david'],
  'temple': ['temple', 'house of god', 'sanctuary', 'tabernacle'],
  'salvation': ['salvation', 'save', 'saved', 'deliver', 'deliverance', 'redeem'],
  'sin': ['sin', 'sins', 'transgression', 'iniquity', 'wickedness', 'evil'],
  'righteousness': ['righteousness', 'righteous', 'just', 'justice', 'holy'],
  'kingdom': ['kingdom', 'reign', 'rule', 'dominion', 'authority'],
  'eternal': ['eternal', 'everlasting', 'forever', 'perpetual', 'endless'],
  'heaven': ['heaven', 'paradise', 'glory', 'celestial', 'heavenly'],
  'miracle': ['miracle', 'miracles', 'sign', 'signs', 'wonder', 'wonders'],
  'parable': ['parable', 'parables', 'story', 'teaching', 'example']
};

export class EnhancedBibleSearch {
  private translations: Translation[] = [];

  constructor() {
    // Get translations from the store
    this.loadTranslations();
  }

  private loadTranslations() {
    // Access the store to get current translations
    const store = useBibleStore.getState();
    this.translations = store.translations || [];
    
    // If no translations, try to load them
    if (this.translations.length === 0) {
      store.loadTranslations().then(() => {
        this.translations = useBibleStore.getState().translations || [];
      });
    }
  }

  search(query: string, limit: number = 10): SearchResult[] {
    const queryLower = query.toLowerCase().trim();
    
    if (!queryLower) return [];
    
    // Ensure we have translations
    if (this.translations.length === 0) {
      this.loadTranslations();
      if (this.translations.length === 0) {
        return [];
      }
    }

    const searchTerms = this.extractSearchTerms(queryLower);
    const expandedKeywords = this.expandKeywords(searchTerms);
    const allVerses = this.getAllVerses();
    
    const scoredVerses = allVerses.map(verse => {
      const score = this.calculateRelevanceScore(verse, queryLower, searchTerms, expandedKeywords);
      return {
        ...verse,
        relevance_score: score.total,
        match_reasons: score.reasons
      };
    }).filter(verse => verse.relevance_score > 0);

    return scoredVerses
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
  }

  private getAllVerses(): BibleVerse[] {
    const allVerses: BibleVerse[] = [];
    
    for (const translation of this.translations) {
      if (!translation || !translation.books) continue;
      
      for (const book of translation.books) {
        if (!book || !book.chapters) continue;
        
        for (const chapter of book.chapters) {
          if (!chapter || !chapter.verses) continue;
          
          for (const verse of chapter.verses) {
            if (!verse || !verse.text) continue;
            
            allVerses.push({
              book: book.name,
              chapter: chapter.number,
              verse: verse.number,
              text: verse.text,
              topics: this.inferTopics(verse.text)
            });
          }
        }
      }
    }
    
    return allVerses;
  }

  private inferTopics(text: string): string[] {
    const textLower = text.toLowerCase();
    const topics: string[] = [];
    
    // Infer topics based on keywords in the text
    Object.entries(enhancedKeywordMappings).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  private extractSearchTerms(query: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'what', 'how', 'when', 'where', 'why', 'does', 'do', 'is', 'are', 'can', 'should', 'will', 'would'];
    
    return query
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.includes(term))
      .map(term => term.replace(/[^\w]/g, ''));
  }

  private expandKeywords(searchTerms: string[]): string[] {
    const expanded = new Set<string>();
    
    searchTerms.forEach(term => {
      expanded.add(term);
      
      // Direct mapping
      if (enhancedKeywordMappings[term]) {
        enhancedKeywordMappings[term].forEach(keyword => expanded.add(keyword));
      }
      
      // Partial matching
      Object.entries(enhancedKeywordMappings).forEach(([key, keywords]) => {
        if (key.includes(term) || term.includes(key)) {
          keywords.forEach(keyword => expanded.add(keyword));
        }
      });
      
      // Check if term matches any keyword in mappings
      Object.entries(enhancedKeywordMappings).forEach(([key, keywords]) => {
        if (keywords.some(keyword => keyword.includes(term) || term.includes(keyword))) {
          expanded.add(key);
          keywords.forEach(keyword => expanded.add(keyword));
        }
      });
    });
    
    return Array.from(expanded);
  }

  private calculateRelevanceScore(
    verse: BibleVerse, 
    originalQuery: string, 
    searchTerms: string[], 
    expandedKeywords: string[]
  ): { total: number; reasons: string[] } {
    const verseText = verse.text.toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    // Exact phrase matching (highest priority)
    if (verseText.includes(originalQuery)) {
      score += 100;
      reasons.push('Exact phrase match');
    }

    // Topic matching (if topics are available)
    if (verse.topics && verse.topics.length > 0) {
      const topicMatches = verse.topics.filter(topic => 
        searchTerms.some(term => topic.includes(term) || term.includes(topic))
      );
      if (topicMatches.length > 0) {
        score += topicMatches.length * 50;
        reasons.push(`Topic: ${topicMatches.join(', ')}`);
      }
    }

    // Direct keyword matching
    const directMatches = searchTerms.filter(term => verseText.includes(term));
    if (directMatches.length > 0) {
      score += directMatches.length * 30;
      reasons.push(`Keywords: ${directMatches.join(', ')}`);
    }

    // Expanded keyword matching
    const expandedMatches = expandedKeywords.filter(keyword => 
      verseText.includes(keyword) && !searchTerms.includes(keyword)
    );
    if (expandedMatches.length > 0) {
      score += expandedMatches.length * 20;
      reasons.push(`Related: ${expandedMatches.slice(0, 2).join(', ')}`);
    }

    // Popular verse bonus
    if (this.isPopularVerse(verse)) {
      score *= 1.1;
      reasons.push('Popular verse');
    }

    const normalizedScore = Math.min(score / 100, 1);
    return {
      total: Math.round(normalizedScore * 10000) / 10000,
      reasons: reasons.length > 0 ? reasons : ['General relevance']
    };
  }

  private isPopularVerse(verse: BibleVerse): boolean {
    const popularVerses = [
      'John 3:16', 'Romans 8:28', 'Philippians 4:13', 'Psalm 23:1',
      'Isaiah 41:10', 'Jeremiah 29:11', 'Matthew 11:28', 'Philippians 4:6'
    ];
    
    const verseRef = `${verse.book} ${verse.chapter}:${verse.verse}`;
    return popularVerses.includes(verseRef);
  }

  getSuggestions(query: string): string[] {
    const queryLower = query.toLowerCase();
    const suggestions: string[] = [];
    
    Object.keys(enhancedKeywordMappings).forEach(topic => {
      if (topic.includes(queryLower) || queryLower.includes(topic)) {
        suggestions.push(`Find verses about ${topic}`);
      }
    });
    
    if (queryLower.includes('how')) {
      suggestions.push('How to find peace', 'How to overcome fear', 'How to have faith');
    }
    
    return suggestions.slice(0, 5);
  }

  getStats() {
    const allVerses = this.getAllVerses();
    return {
      total_verses: allVerses.length,
      total_topics: Object.keys(enhancedKeywordMappings).length,
      books_covered: [...new Set(allVerses.map(v => v.book))].length,
      translations_loaded: this.translations.length
    };
  }
}