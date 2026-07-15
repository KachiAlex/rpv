"use client";

import React, { useEffect, useState } from 'react';
import {
  getPerformanceMetrics,
  getMemoryUsage,
  isMobileDevice,
  getViewportDimensions,
  prefersReducedMotion,
} from '@/lib/utils/mobile-performance';

interface PerformanceData {
  metrics: any;
  memory: any;
  isMobile: boolean;
  viewport: { width: number; height: number };
  prefersReducedMotion: boolean;
  fps: number;
}

/**
 * Mobile Performance Monitor Component
 * Displays real-time performance metrics for debugging
 * Only visible in development mode
 */
export function MobilePerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    // Update performance data
    const updateMetrics = () => {
      setPerformanceData({
        metrics: getPerformanceMetrics(),
        memory: getMemoryUsage(),
        isMobile: isMobileDevice(),
        viewport: getViewportDimensions(),
        prefersReducedMotion: prefersReducedMotion(),
        fps,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [fps]);

  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrames);
    };

    const frameId = requestAnimationFrame(countFrames);

    return () => cancelAnimationFrame(frameId);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !performanceData) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-gray-800 transition-colors"
      >
        {isVisible ? 'Hide' : 'Show'} Perf
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs font-mono max-w-xs">
          <div className="space-y-2">
            {/* FPS */}
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
                {fps}
              </span>
            </div>

            {/* Device Info */}
            <div className="flex justify-between">
              <span>Mobile:</span>
              <span>{performanceData.isMobile ? 'Yes' : 'No'}</span>
            </div>

            {/* Viewport */}
            <div className="flex justify-between">
              <span>Viewport:</span>
              <span>
                {performanceData.viewport.width}x{performanceData.viewport.height}
              </span>
            </div>

            {/* Reduced Motion */}
            <div className="flex justify-between">
              <span>Reduced Motion:</span>
              <span>{performanceData.prefersReducedMotion ? 'Yes' : 'No'}</span>
            </div>

            {/* Performance Metrics */}
            {performanceData.metrics && (
              <>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="text-gray-400 mb-1">Metrics:</div>
                  {performanceData.metrics.domContentLoaded && (
                    <div className="flex justify-between">
                      <span>DOM Ready:</span>
                      <span>{performanceData.metrics.domContentLoaded.toFixed(0)}ms</span>
                    </div>
                  )}
                  {performanceData.metrics.loadComplete && (
                    <div className="flex justify-between">
                      <span>Load Complete:</span>
                      <span>{performanceData.metrics.loadComplete.toFixed(0)}ms</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Memory Usage */}
            {performanceData.memory && (
              <>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="text-gray-400 mb-1">Memory:</div>
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span>{(performanceData.memory.usedJSHeapSize / 1048576).toFixed(1)}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limit:</span>
                    <span>{(performanceData.memory.jsHeapSizeLimit / 1048576).toFixed(1)}MB</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
