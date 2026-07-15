import { fc, test } from '@fast-check/jest';
import {
  prefersReducedMotion,
  getAnimationDuration,
  isMobileDevice,
  getViewportDimensions,
  throttle,
  debounce,
  getPerformanceMetrics,
} from '../mobile-performance';

describe('Mobile Performance Optimization Tests', () => {
  // Property 8: Mobile performance loading
  test.prop([fc.integer({ min: 100, max: 5000 })])('should handle animation duration based on motion preferences', (duration) => {
    const result = getAnimationDuration(duration);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(duration);
  });

  // Property 9: Mobile scrolling smoothness
  test.prop([fc.integer({ min: 100, max: 1000 })])('should throttle scroll events efficiently', (throttleLimit) => {
    let callCount = 0;
    const throttledFn = throttle(() => {
      callCount++;
    }, throttleLimit);

    // Simulate rapid calls
    for (let i = 0; i < 10; i++) {
      throttledFn();
    }

    // Should not call immediately for all invocations
    expect(callCount).toBeLessThanOrEqual(2);
  });

  // Property 20: Mobile animation performance
  test.prop([fc.integer({ min: 50, max: 500 })])('should debounce resize events to prevent performance issues', (debounceDelay) => {
    let callCount = 0;
    const debouncedFn = debounce(() => {
      callCount++;
    }, debounceDelay);

    // Simulate rapid calls
    for (let i = 0; i < 10; i++) {
      debouncedFn();
    }

    // Should not call immediately
    expect(callCount).toBe(0);
  });

  test('should provide performance metrics', () => {
    const metrics = getPerformanceMetrics();
    expect(typeof metrics).toBe('object');
  });

  test('should detect mobile device correctly', () => {
    const isMobile = isMobileDevice();
    expect(typeof isMobile).toBe('boolean');
  });

  test('should return valid viewport dimensions', () => {
    const dimensions = getViewportDimensions();
    expect(dimensions.width).toBeGreaterThanOrEqual(0);
    expect(dimensions.height).toBeGreaterThanOrEqual(0);
  });

  test('should handle reduced motion preference', () => {
    const prefersReduced = prefersReducedMotion();
    expect(typeof prefersReduced).toBe('boolean');
  });
});
