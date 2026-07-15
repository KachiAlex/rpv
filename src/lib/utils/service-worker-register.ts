/**
 * Service Worker Registration Utility
 * Handles registration and management of service workers for offline capabilities
 */

export interface ServiceWorkerConfig {
  path?: string;
  scope?: string;
  updateInterval?: number; // in milliseconds
  onUpdate?: () => void;
  onInstall?: () => void;
  onError?: (error: Error) => void;
}

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Register service worker
 * @param config - Service worker configuration
 * @returns Promise that resolves to ServiceWorkerRegistration or null
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  const {
    path = '/service-worker.js',
    scope = '/',
    updateInterval = 60000, // 1 minute
    onUpdate,
    onInstall,
    onError,
  } = config;

  // Return cached promise if already registering
  if (registrationPromise) {
    return registrationPromise;
  }

  // Check if service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  registrationPromise = (async () => {
    try {
      const registration = await navigator.serviceWorker.register(path, { scope });

      console.log('Service Worker registered successfully:', registration);

      // Call onInstall callback
      if (onInstall) {
        onInstall();
      }

      // Check for updates periodically
      if (updateInterval > 0) {
        setInterval(() => {
          registration.update().catch((error) => {
            console.error('Service Worker update check failed:', error);
          });
        }, updateInterval);
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready
              console.log('New Service Worker available');
              if (onUpdate) {
                onUpdate();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Service Worker registration failed:', err);

      if (onError) {
        onError(err);
      }

      return null;
    }
  })();

  return registrationPromise;
}

/**
 * Unregister service worker
 * @returns Promise that resolves when unregistration is complete
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
    }

    console.log('Service Worker unregistered successfully');
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
  }
}

/**
 * Get current service worker registration
 * @returns Promise that resolves to ServiceWorkerRegistration or null
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch (error) {
    console.error('Failed to get Service Worker registration:', error);
    return null;
  }
}

/**
 * Check if service worker is active
 * @returns true if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  return !!navigator.serviceWorker.controller;
}

/**
 * Send message to service worker
 * @param message - Message to send
 * @returns Promise that resolves when message is sent
 */
export async function sendMessageToServiceWorker(message: any): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (!navigator.serviceWorker.controller) {
    console.warn('No active Service Worker to send message to');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Clear service worker cache
 * @returns Promise that resolves when cache is cleared
 */
export async function clearServiceWorkerCache(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
    }

    console.log('Service Worker cache cleared');
  } catch (error) {
    console.error('Failed to clear Service Worker cache:', error);
  }
}

/**
 * Get service worker cache size
 * @returns Promise that resolves to cache size in bytes
 */
export async function getServiceWorkerCacheSize(): Promise<number> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Failed to get Service Worker cache size:', error);
    return 0;
  }
}

/**
 * Listen for service worker controller change
 * @param callback - Function to call when controller changes
 * @returns Function to remove listener
 */
export function onServiceWorkerControllerChange(
  callback: (registration: ServiceWorkerRegistration | null) => void
): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleControllerChange = async () => {
    const registration = await getServiceWorkerRegistration();
    callback(registration);
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  };
}

/**
 * Check if offline
 * @returns true if device is offline
 */
export function isOffline(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return !navigator.onLine;
}

/**
 * Listen for online/offline status changes
 * @param callback - Function to call when status changes
 * @returns Function to remove listener
 */
export function onOnlineStatusChange(
  callback: (isOnline: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
