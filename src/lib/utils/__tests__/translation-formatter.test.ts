/**
 * Feature: homepage-translation-dropdown, Property 2: Translation names follow consistent format
 * Validates: Requirements 1.2, 2.1, 2.4
 */

import { formatTranslationName, sortTranslations, getDefaultTranslationId } from '../translation-formatter';
import type { Translation } from '../../types';

// Helper function to create test translations
function createTranslation(id: string, name?: string, books: any[] = []): Translation {
  return {
    id,
    name: name || id,
    books,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('Translation Formatter', () => {
  describe('formatTranslationName', () => {
    test('Property 2: Translation names follow consistent format - predefined mappings', () => {
      // Test predefined mappings
      const testCases = [
        { id: 'RPV', expected: 'Redemption Project Version (RPV)' },
        { id: 'kjv', expected: 'King James Version (KJV)' },
        { id: 'asv', expected: 'American Standard Version (ASV)' },
        { id: 'KJV', expected: 'King James Version (KJV)' },
        { id: 'ASV', expected: 'American Standard Version (ASV)' }
      ];

      testCases.forEach(({ id, expected }) => {
        const translation = createTranslation(id);
        const result = formatTranslationName(translation);
        expect(result).toBe(expected);
      });
    });

    test('Property 2: Translation names follow consistent format - fallback patterns', () => {
      // Test fallback to name + ID format
      const translation1 = createTranslation('custom', 'Custom Bible Version');
      expect(formatTranslationName(translation1)).toBe('Custom Bible Version (CUSTOM)');

      // Test fallback to ID only when name equals ID
      const translation2 = createTranslation('unknown');
      expect(formatTranslationName(translation2)).toBe('UNKNOWN');

      // Test with empty name
      const translation3 = createTranslation('test', '');
      expect(formatTranslationName(translation3)).toBe('TEST');
    });

    test('Property 2: All formatted names contain uppercase ID', () => {
      const testIds = ['rpv', 'kjv', 'asv', 'custom', 'test123'];
      
      testIds.forEach(id => {
        const translation = createTranslation(id, `${id} Version`);
        const result = formatTranslationName(translation);
        
        // Should contain uppercase version of ID
        expect(result).toMatch(new RegExp(id.toUpperCase()));
      });
    });
  });

  describe('sortTranslations', () => {
    test('Property 5: RPV translation appears first', () => {
      const translations = [
        createTranslation('asv', 'American Standard Version'),
        createTranslation('kjv', 'King James Version'),
        createTranslation('RPV', 'Redemption Project Version'),
        createTranslation('custom', 'Custom Version')
      ];

      const sorted = sortTranslations(translations);
      
      // RPV should always be first
      expect(sorted[0].id).toBe('RPV');
    });

    test('Property 5: Non-RPV translations sorted alphabetically', () => {
      const translations = [
        createTranslation('zebra', 'Zebra Version'),
        createTranslation('alpha', 'Alpha Version'),
        createTranslation('beta', 'Beta Version')
      ];

      const sorted = sortTranslations(translations);
      
      // Should be sorted alphabetically by display name
      const displayNames = sorted.map(t => formatTranslationName(t));
      const sortedNames = [...displayNames].sort();
      expect(displayNames).toEqual(sortedNames);
    });

    test('Property 5: RPV first, then alphabetical order', () => {
      const translations = [
        createTranslation('zebra', 'Zebra Version'),
        createTranslation('RPV', 'Redemption Project Version'),
        createTranslation('alpha', 'Alpha Version')
      ];

      const sorted = sortTranslations(translations);
      
      expect(sorted[0].id).toBe('RPV');
      expect(sorted[1].id).toBe('alpha'); // Alpha comes before Zebra
      expect(sorted[2].id).toBe('zebra');
    });

    test('Property 5: Original array not mutated', () => {
      const translations = [
        createTranslation('b', 'B Version'),
        createTranslation('a', 'A Version')
      ];
      const originalOrder = translations.map(t => t.id);

      sortTranslations(translations);
      
      // Original array should be unchanged
      expect(translations.map(t => t.id)).toEqual(originalOrder);
    });
  });

  describe('getDefaultTranslationId', () => {
    test('Returns RPV when available', () => {
      const translations = [
        createTranslation('kjv'),
        createTranslation('RPV'),
        createTranslation('asv')
      ];

      expect(getDefaultTranslationId(translations)).toBe('RPV');
    });

    test('Returns first translation when RPV not available', () => {
      const translations = [
        createTranslation('kjv'),
        createTranslation('asv')
      ];

      expect(getDefaultTranslationId(translations)).toBe('kjv');
    });

    test('Returns empty string for empty array', () => {
      expect(getDefaultTranslationId([])).toBe('');
    });
  });

  // Property-based test with multiple random inputs
  describe('Property-based tests', () => {
    test('Property 2: Consistent format across random translations', () => {
      // Generate random translation data
      const randomTranslations = Array.from({ length: 100 }, (_, i) => {
        const id = `test${i}`;
        const name = Math.random() > 0.5 ? `Test Version ${i}` : id;
        return createTranslation(id, name);
      });

      randomTranslations.forEach(translation => {
        const formatted = formatTranslationName(translation);
        
        // Should always contain the ID in uppercase
        expect(formatted).toMatch(new RegExp(translation.id.toUpperCase()));
        
        // Should not be empty
        expect(formatted.length).toBeGreaterThan(0);
        
        // Should follow one of the expected patterns
        const isValidFormat = 
          formatted.includes('(') && formatted.includes(')') || // Name (ID) format
          formatted === translation.id.toUpperCase(); // ID only format
        
        expect(isValidFormat).toBe(true);
      });
    });

    test('Property 5: RPV always first regardless of input order', () => {
      // Test with different arrangements including RPV
      const baseTranslations = [
        createTranslation('z', 'Z Version'),
        createTranslation('a', 'A Version'),
        createTranslation('m', 'M Version')
      ];

      // Test 10 different random arrangements with RPV inserted at different positions
      for (let i = 0; i < 10; i++) {
        const shuffled = [...baseTranslations];
        const rpv = createTranslation('RPV', 'Redemption Project Version');
        
        // Insert RPV at random position
        const insertPos = Math.floor(Math.random() * (shuffled.length + 1));
        shuffled.splice(insertPos, 0, rpv);
        
        const sorted = sortTranslations(shuffled);
        expect(sorted[0].id).toBe('RPV');
      }
    });
  });
});