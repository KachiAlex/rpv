"use client";
import { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';

export function CompactPublicationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);

  // Calculate days until Monday, January 5th, 2026
  useEffect(() => {
    const targetDate = new Date('2026-01-05T00:00:00');
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    setDaysLeft(Math.max(0, days));
  }, []);

  // Check if banner was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('compact-publication-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('compact-publication-banner-dismissed', 'true');
  };

  if (!isVisible || daysLeft <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#a9291c] to-[#c9472c] text-white px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BookOpen className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            <strong>John & Ephesians</strong> coming Jan 5th ({daysLeft} days left!)
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-0.5 hover:bg-white/20 rounded"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}