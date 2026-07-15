import { fc, test } from '@fast-check/jest';
import {
  calculateResponsiveFontSize,
  getOptimalLineLength,
  calculateLetterSpacing,
  getContrastRatio,
  meetsWCAGAA,
} from '../mobile-typography';

describe('Mobile Readability Tests', () => {
  // Property 18: Mobile contrast compliance
  test.prop([
    fc.tuple(
      fc.hexaString({ minLength: 6, maxLength: 6 }),
      fc.hexaString({ minLength: 6, maxLength: 6 })
    ),
  ])('should calculate valid contrast ratios', ([fg, bg]) => {
    const ratio = getContrastRatio(`#${fg}`, `#${bg}`);
    expect(typeof ratio).toBe('number');
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(21); // Maximum possible contrast
  });

  // Property 19: Mobile line length optimization
  test.prop([fc.integer({ min: 12, max: 32 })])('should calculate optimal line lengths', (fontSize) => {
    const lineLength = getOptimalLineLength(fontSize);
    expect(lineLength).toBeGreaterThan(0);
    // Optimal range is roughly 45-75 characters
    // At average 0.5em per character, that's 22.5-37.5em
    expect(lineLength).toBeGreaterThan(fontSize * 20);
    expect(lineLength).toBeLessThan(fontSize * 40);
  });

  test.prop([fc.integer({ min: 12, max: 32 })])('should calculate appropriate letter spacing', (fontSize) => {
    const spacing = calculateLetterSpacing(fontSize);
    expect(typeof spacing).toBe('number');
    expect(spacing).toBeGreaterThanOrEqual(0);
    expect(spacing).toBeLessThanOrEqual(0.1);
  });

  test.prop([fc.integer({ min: 320, max: 1440 })])('should calculate responsive font sizes', (viewportWidth) => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: viewportWidth,
    });

    const fontSize = calculateResponsiveFontSize(16);
    expect(fontSize).toBeGreaterThanOrEqual(14);
    expect(fontSize).toBeLessThanOrEqual(24);
  });

  test('should validate WCAG AA contrast compliance', () => {
    // High contrast (should pass)
    expect(meetsWCAGAA(4.5, false)).toBe(true);
    expect(meetsWCAGAA(3, true)).toBe(true);

    // Low contrast (should fail)
    expect(meetsWCAGAA(2, false)).toBe(false);
    expect(meetsWCAGAA(2, true)).toBe(false);
  });

  test('should handle edge case contrast ratios', () => {
    // Minimum passing ratio
    expect(meetsWCAGAA(4.5, false)).toBe(true);
    expect(meetsWCAGAA(3, true)).toBe(true);

    // Just below minimum
    expect(meetsWCAGAA(4.49, false)).toBe(false);
    expect(meetsWCAGAA(2.99, true)).toBe(false);
  });
});
