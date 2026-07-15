"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createLazyLoadObserver } from '@/lib/utils/mobile-performance';

interface ResponsiveVideoProps {
  src: string;
  title?: string;
  aspectRatio?: 'video' | '16:9' | '4:3' | '1:1' | '21:9';
  allowFullscreen?: boolean;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  lazy?: boolean;
  className?: string;
}

const aspectRatioMap: Record<string, string> = {
  'video': 'aspect-video',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
};

/**
 * Responsive video embed component for mobile optimization
 * Supports lazy loading and maintains aspect ratio across all screen sizes
 */
export function ResponsiveVideo({
  src,
  title = 'Video player',
  aspectRatio = '16:9',
  allowFullscreen = true,
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  lazy = true,
  className = '',
}: ResponsiveVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(!lazy);

  useEffect(() => {
    if (!lazy || isLoaded) return;

    const observer = createLazyLoadObserver(
      (entry) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [lazy, isLoaded]);

  const aspectRatioClass = aspectRatioMap[aspectRatio] || aspectRatioMap['16:9'];

  // Build iframe src with parameters
  const buildIframeSrc = (): string => {
    const url = new URL(src);
    const params = new URLSearchParams(url.search);

    // Add common parameters
    if (controls) params.set('controls', '1');
    if (autoplay) params.set('autoplay', '1');
    if (muted) params.set('mute', '1');
    if (loop) params.set('loop', '1');

    // YouTube specific
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      params.set('modestbranding', '1');
      params.set('rel', '0');
    }

    // Vimeo specific
    if (src.includes('vimeo.com')) {
      params.set('byline', '0');
      params.set('portrait', '0');
    }

    url.search = params.toString();
    return url.toString();
  };

  return (
    <div
      ref={containerRef}
      className={`w-full ${aspectRatioClass} bg-black rounded-lg overflow-hidden shadow-md ${className}`}
    >
      {isLoaded ? (
        <iframe
          ref={iframeRef}
          src={buildIframeSrc()}
          title={title}
          className="w-full h-full border-0"
          allowFullScreen={allowFullscreen}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-gray-600 rounded-full mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Loading video...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Responsive video container for custom video elements
 */
export function ResponsiveVideoContainer({
  children,
  aspectRatio = '16:9',
  className = '',
}: {
  children: React.ReactNode;
  aspectRatio?: string;
  className?: string;
}) {
  const aspectRatioClass = aspectRatioMap[aspectRatio] || aspectRatioMap['16:9'];

  return (
    <div className={`w-full ${aspectRatioClass} bg-black rounded-lg overflow-hidden shadow-md ${className}`}>
      {children}
    </div>
  );
}
