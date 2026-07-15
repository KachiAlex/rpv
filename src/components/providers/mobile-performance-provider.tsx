"use client";

import { useEffect } from 'react';
import { initializeMobileOptimizations } from '@/lib/utils/mobile-performance';
import { MobilePerformanceMonitor } from '@/components/debug/mobile-performance-monitor';

/**
 * Mobile Performance Provider Component
 * Initializes mobile performance optimizations and monitoring
 */
export function MobilePerformanceProvider() {
  useEffect(() => {
    // Initialize mobile optimizations
    initializeMobileOptimizations({
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableAnimationOptimization: true,
      enableCaching: true,
    });
  }, []);

  return (
    <>
      {/* Performance monitor only visible in development */}
      <MobilePerformanceMonitor />
    </>
  );
}
