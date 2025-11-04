"use client";
import { useEffect, useState } from 'react';
import { NetworkStatus } from '@/lib/utils/network-status';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetworkStatus.subscribe((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <WifiOff size={16} />
      <span className="text-sm font-medium">Offline Mode</span>
    </div>
  );
}

