"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { createLazyLoadObserver, loadImageFromDataSrc } from '@/lib/utils/mobile-performance';

interface LazyImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  loadingPlaceholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Lazy-loaded image component for mobile performance optimization
 * Uses Intersection Observer to load images only when they become visible
 */
export function LazyImage({
  src,
  fallbackSrc,
  loadingPlaceholder,
  errorPlaceholder,
  threshold = 0.1,
  rootMargin = '50px',
  alt,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = createLazyLoadObserver(
      (entry) => {
        const img = entry.target as HTMLImageElement;
        setImageSrc(src);
        observer.unobserve(img);
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, threshold, rootMargin]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  if (hasError && !fallbackSrc) {
    return <>{errorPlaceholder || <div className="bg-gray-200 w-full h-full" />}</>;
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && loadingPlaceholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          {loadingPlaceholder}
        </div>
      )}
      {imageSrc && (
        <Image
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          onLoadingComplete={handleLoadingComplete}
          onError={handleError}
          {...props}
        />
      )}
      {!imageSrc && !isLoading && (
        <div className="bg-gray-200 w-full h-full" />
      )}
    </div>
  );
}
