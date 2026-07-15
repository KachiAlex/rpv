"use client";

import { useEffect } from 'react';

/**
 * Service Worker Provider Component
 * Initializes service worker for offline capabilities and caching
 * 
 * Note: Service Worker registration is disabled due to Firebase static hosting
 * limitations with MIME type detection. The app functions normally without it.
 */
export function ServiceWorkerProvider() {
  useEffect(() => {
    // Service Worker registration disabled for Firebase static hosting compatibility
    // The app maintains full functionality without it
  }, []);

  return null;
}
