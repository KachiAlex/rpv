"use client";
import { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicationBannerProps {
  variant?: 'header' | 'homepage' | 'floating';
  className?: string;
}

export function PublicationBanner({ variant = 'header', className = '' }: PublicationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>({ days: 0, hours: 0, minutes: 0 });

  // Calculate time until Monday, January 5th, 2026
  useEffect(() => {
    const targetDate = new Date('2026-01-05T00:00:00');
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft({ days, hours, minutes });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Check if banner was dismissed (stored in localStorage)
  useEffect(() => {
    const dismissed = localStorage.getItem('publication-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('publication-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  const baseClasses = "relative overflow-hidden";
  const variantClasses = {
    header: "bg-gradient-to-r from-[#a9291c] via-[#c9472c] to-[#a9291c] text-white",
    homepage: "bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffd700] text-[#4d1c0a] rounded-xl",
    floating: "fixed top-20 left-4 right-4 z-50 bg-gradient-to-r from-[#a9291c] via-[#c9472c] to-[#a9291c] text-white rounded-lg shadow-lg"
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: variant === 'floating' ? -100 : -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: variant === 'floating' ? -100 : -50 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <BookOpen className="w-6 h-6 lg:w-7 lg:h-7" />
                  <Sparkles className="w-3 h-3 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>

              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm lg:text-base mb-1">
                      📖 New Books Coming Soon!
                    </h3>
                    <p className="text-xs lg:text-sm opacity-90 leading-tight">
                      <strong>John</strong> and <strong>Ephesians</strong> will be published on{' '}
                      <strong>Monday, January 5th, 2026</strong>
                    </p>
                  </div>

                  {/* Countdown */}
                  {timeLeft.days > 0 && (
                    <div className="flex items-center gap-2 mt-2 lg:mt-0 flex-shrink-0">
                      <Calendar className="w-4 h-4 opacity-75" />
                      <div className="flex items-center gap-1 text-xs lg:text-sm font-semibold">
                        <span className="bg-white/20 px-2 py-1 rounded">
                          {timeLeft.days}d
                        </span>
                        <span className="bg-white/20 px-2 py-1 rounded">
                          {timeLeft.hours}h
                        </span>
                        <span className="bg-white/20 px-2 py-1 rounded">
                          {timeLeft.minutes}m
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
        </div>

        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse opacity-50"></div>
      </motion.div>
    </AnimatePresence>
  );
}