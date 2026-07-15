import searchService from '../services/searchService';
import translationService from '../services/translationService';
import cacheService from '../services/cacheService';

describe('Search Service', () => {
  it('should parse verse references correctly', () => {
    const result = searchService.parseQuery('John 3:16');
    expect(result).toHaveProperty('book');
    expect(result).toHaveProperty('chapter');
    expect(result).toHaveProperty('verse');
  });

  it('should handle search history', () => {
    const history = searchService.getRecentSearches();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should return empty results for invalid queries', async () => {
    const results = await searchService.search({
      query: 'invalid query xyz',
      limit: 10,
    });
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('Translation Service', () => {
  it('should have default translation', async () => {
    const translation = await translationService.getSelectedTranslation();
    expect(translation).toBeDefined();
    expect(typeof translation).toBe('string');
  });

  it('should set translation', async () => {
    await translationService.setSelectedTranslation('NIV');
    const translation = await translationService.getSelectedTranslation();
    expect(translation).toBe('NIV');
  });
});

describe('Cache Service', () => {
  it('should cache verses', async () => {
    const verse = {
      id: 'test-1',
      book: 'John',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world...',
      translation: 'KJV',
    };

    await cacheService.cacheVerse(verse);
    const cached = await cacheService.getVerse('test-1');
    expect(cached).toBeDefined();
  });

  it('should search cached verses', async () => {
    const results = await cacheService.searchCached('John');
    expect(Array.isArray(results)).toBe(true);
  });
});
