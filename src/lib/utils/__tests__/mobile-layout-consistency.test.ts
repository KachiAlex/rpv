import { fc, test } from '@fast-check/jest';
import {
  getMobileSpacing,
  getAllMobileSpacing,
  getDeviceOrientation,
  isPortrait,
  isLandscape,
  getOrientationLayout,
  getSafeAreaInsets,
} from '../mobile-layout-consistency';

describe('Mobile Layout Consistency Tests', () => {
  // Property 13: Mobile layout consistency
  test('should provide consistent spacing scale', () => {
    const spacing = getAllMobileSpacing();
    expect(spacing.xs).toBe(8);
    expect(spacing.sm).toBe(12);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
    expect(spacing['2xl']).toBe(40);
  });

  test.prop([fc.constantFrom('xs', 'sm', 'md', 'lg', 'xl', '2xl') as any])(
    'should return valid spacing for all sizes',
    (size) => {
      const spacing = getMobileSpacing(size);
      expect(typeof spacing).toBe('number');
      expect(spacing).toBeGreaterThan(0);
      expect(spacing).toBeLessThanOrEqual(40);
    }
  );

  // Property 15: Mobile orientation adaptation
  test('should detect device orientation', () => {
    const orientation = getDeviceOrientation();
    expect(['portrait', 'landscape']).toContain(orientation);
  });

  test('should correctly identify portrait orientation', () => {
    const isPortraitMode = isPortrait();
    const isLandscapeMode = isLandscape();
    expect(typeof isPortraitMode).toBe('boolean');
    expect(typeof isLandscapeMode).toBe('boolean');
    // One should be true, one should be false
    expect(isPortraitMode !== isLandscapeMode).toBe(true);
  });

  test('should provide orientation layout configuration', () => {
    const layout = getOrientationLayout();
    expect(layout.portrait).toBeDefined();
    expect(layout.landscape).toBeDefined();
    expect(layout.portrait.width).toBeGreaterThan(0);
    expect(layout.portrait.height).toBeGreaterThan(0);
    expect(layout.landscape.width).toBeGreaterThan(0);
    expect(layout.landscape.height).toBeGreaterThan(0);
  });

  test('should provide safe area insets', () => {
    const insets = getSafeAreaInsets();
    expect(insets.top).toBeGreaterThanOrEqual(0);
    expect(insets.right).toBeGreaterThanOrEqual(0);
    expect(insets.bottom).toBeGreaterThanOrEqual(0);
    expect(insets.left).toBeGreaterThanOrEqual(0);
  });

  test('should handle orientation changes', () => {
    let callCount = 0;
    const unsubscribe = require('../mobile-layout-consistency').onOrientationChange(() => {
      callCount++;
    });

    // Cleanup
    unsubscribe();
    expect(typeof unsubscribe).toBe('function');
  });
});
