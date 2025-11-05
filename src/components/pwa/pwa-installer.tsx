"use client";
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { registerServiceWorker, checkUpdateAvailable } from '@/lib/utils/pwa';

export function PWAInstaller() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    checkUpdateAvailable();

    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-brand-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install RPV Bible</h3>
          <p className="text-sm text-brand-100">
            Install this app on your device for a better experience and offline access.
          </p>
        </div>
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="text-white hover:text-brand-200 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstallClick}
          className="flex-1 bg-white text-brand-600 px-4 py-2 rounded-md font-medium hover:bg-brand-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Install
        </button>
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="px-4 py-2 text-brand-100 hover:text-white transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}

