/**
 * Mobile Performance Optimization Utilities
 * Provides utilities for optimizing performance on mobile devices
 */

/**
 * Lazy loading configuration for images and components
 */
export interface LazyLoadConfig {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}

/**
 * Create an Intersection Observer for lazy loading
 * @param callback - Function to call when element becomes visible
 * @param config - Intersection Observer configuration
 * @returns IntersectionObserver instance
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  config: LazyLoadConfig = {}
): IntersectionObserver {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    root = null,
  } = config;

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      threshold,
      rootMargin,
      root,
    }
  );
}

/**
 * Lazy load an image element
 * @param img - Image element to lazy load
 * @param observer - IntersectionObserver instance
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  observer: IntersectionObserver
): void {
  observer.observe(img);
}

/**
 * Load image from data attribute
 * @param img - Image element
 * @param dataSrc - Data attribute name (default: 'data-src')
 */
export function loadImageFromDataSrc(
  img: HTMLImageElement,
  dataSrc: string = 'data-src'
): void {
  const src = img.getAttribute(dataSrc);
  if (src) {
    img.src = src;
    img.removeAttribute(dataSrc);
  }
}

/**
 * Preload image
 * @param src - Image source URL
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Get optimized image URL for mobile
 * @param url - Original image URL
 * @param width - Target width in pixels
 * @param quality - Image quality (1-100, default: 80)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  url: string,
  width: number,
  quality: number = 80
): string {
  // If using a CDN like Cloudinary, Imgix, or similar
  // This is a placeholder implementation
  // Replace with your actual CDN URL transformation
  try {
    const urlObj = new URL(url);
    // Add query parameters for optimization
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('q', quality.toString());
    urlObj.searchParams.set('auto', 'format');
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original URL
    return url;
  }
}

/**
 * Detect if device supports WebP format
 * @returns Promise that resolves to true if WebP is supported
 */
export async function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAADwAQCdASoBIAEADsAcJaACdLoB/gAA/v8A/v8A';
  });
}

/**
 * Get appropriate image format based on device capabilities
 * @returns 'webp' if supported, otherwise 'jpg'
 */
export async function getOptimalImageFormat(): Promise<'webp' | 'jpg'> {
  const hasWebP = await supportsWebP();
  return hasWebP ? 'webp' : 'jpg';
}

/**
 * Animation performance configuration
 */
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  reduceMotion?: boolean;
}

/**
 * Check if user prefers reduced motion
 * @returns true if user has prefers-reduced-motion enabled
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preferences
 * @param duration - Default duration in milliseconds
 * @returns Adjusted duration (0 if reduced motion is preferred)
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Request animation frame with fallback
 * @param callback - Function to call on next frame
 * @returns Animation frame ID
 */
export function requestAnimFrame(callback: FrameRequestCallback): number {
  if (typeof window === 'undefined') return 0;
  return window.requestAnimationFrame(callback);
}

/**
 * Cancel animation frame
 * @param id - Animation frame ID
 */
export function cancelAnimFrame(id: number): void {
  if (typeof window === 'undefined') return;
  window.cancelAnimationFrame(id);
}

/**
 * Throttle function for scroll and resize events
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function for input and resize events
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Performance monitoring utilities
 */
export interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

/**
 * Get performance metrics
 * @returns Performance metrics object
 */
export function getPerformanceMetrics(): Partial<PerformanceMetrics> {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  const perfData = window.performance.timing;
  const perfNav = window.performance.navigation;

  return {
    navigationStart: perfData.navigationStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
    loadComplete: perfData.loadEventEnd - perfData.navigationStart,
  };
}

/**
 * Measure performance of a function
 * @param name - Name of the measurement
 * @param func - Function to measure
 * @returns Result of the function
 */
export function measurePerformance<T>(
  name: string,
  func: () => T
): T {
  if (typeof window === 'undefined' || !window.performance) {
    return func();
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;

  try {
    window.performance.mark(startMark);
    const result = func();
    window.performance.mark(endMark);
    window.performance.measure(measureName, startMark, endMark);
    return result;
  } catch (error) {
    console.error(`Performance measurement failed for ${name}:`, error);
    return func();
  }
}

/**
 * Get memory usage (if available)
 * @returns Memory usage object or null
 */
export function getMemoryUsage(): any {
  if (typeof window === 'undefined' || !(window.performance as any).memory) {
    return null;
  }

  return (window.performance as any).memory;
}

/**
 * Mobile-specific performance optimization
 */
export interface MobileOptimizationConfig {
  enableLazyLoading?: boolean;
  enableImageOptimization?: boolean;
  enableAnimationOptimization?: boolean;
  enableCaching?: boolean;
  cacheExpiry?: number; // in milliseconds
}

/**
 * Initialize mobile performance optimizations
 * @param config - Configuration object
 */
export function initializeMobileOptimizations(
  config: MobileOptimizationConfig = {}
): void {
  const {
    enableLazyLoading = true,
    enableImageOptimization = true,
    enableAnimationOptimization = true,
    enableCaching = true,
  } = config;

  if (typeof window === 'undefined') return;

  // Initialize lazy loading for images
  if (enableLazyLoading) {
    const observer = createLazyLoadObserver((entry) => {
      const img = entry.target as HTMLImageElement;
      loadImageFromDataSrc(img);
      observer.unobserve(img);
    });

    // Observe all images with data-src attribute
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => lazyLoadImage(img as HTMLImageElement, observer));
  }

  // Optimize animations based on user preferences
  if (enableAnimationOptimization && prefersReducedMotion()) {
    document.documentElement.style.setProperty('--animation-duration', '0ms');
  }

  // Log performance metrics
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('load', () => {
      const metrics = getPerformanceMetrics();
      console.log('Performance Metrics:', metrics);
    });
  }
}

/**
 * Check if device is mobile
 * @returns true if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Get device viewport dimensions
 * @returns Object with width and height
 */
export function getViewportDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Listen for viewport changes
 * @param callback - Function to call when viewport changes
 * @returns Function to remove listener
 */
export function onViewportChange(
  callback: (dimensions: { width: number; height: number }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleResize = throttle(() => {
    callback(getViewportDimensions());
  }, 250);

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}
