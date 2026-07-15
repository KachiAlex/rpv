"use client";
import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';

import { X, Calendar, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementBannerService } from '@/lib/services/announcement-banner-service';
import { DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS } from '@/lib/constants/announcement-banner';
import type { AnnouncementBannerSettings } from '@/lib/constants/announcement-banner';

interface SimplePublicationBannerProps {
  variant?: 'header' | 'homepage' | 'floating';
  className?: string;
}

export function SimplePublicationBanner({ variant = 'header', className = '' }: SimplePublicationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<AnnouncementBannerSettings>(DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0
  });
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriptionState, setSubscriptionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscriptionMessage, setSubscriptionMessage] = useState<string>('');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    const subscribe = () => {
      unsub = announcementBannerService.subscribe((nextSettings) => {
        if (!mounted) return;
        setSettings(nextSettings);
        setIsReady(true);
      });
    };

    announcementBannerService
      .getSettings()
      .then((nextSettings) => {
        if (mounted) {
          setSettings(nextSettings);
          setIsReady(true);
        }
        subscribe();
      })
      .catch(() => {
        subscribe();
      });

    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('publication-banner-dismissed');

    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!settings?.targetDate) {
      return;
    }
    const targetDate = new Date(settings.targetDate);

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
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [settings?.targetDate]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('publication-banner-dismissed', 'true');
  };

  const handleSubscribe = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (subscriptionState === 'loading') {
        return;
      }

      try {
        setSubscriptionState('loading');
        setSubscriptionMessage('');
        await announcementBannerService.addSubscriber(subscriberEmail, `banner-${variant}`);
        setSubscriptionState('success');
        setSubscriptionMessage('Thanks! You are on the list.');
        setSubscriberEmail('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to subscribe right now. Please try again later.';
        setSubscriptionState('error');
        setSubscriptionMessage(message);
      }
    },
    [subscriberEmail, subscriptionState, variant]
  );

  if (!isVisible || !settings?.isEnabled || !isReady) {
    return null;
  }

  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${settings.background.from}, ${settings.background.via || settings.background.to}, ${settings.background.to})`,
    color: settings.textColor
  };

  const accentColor = settings.accentColor || '#a5f3ff';

  const variantClasses = {
    header: 'text-white',
    homepage: 'rounded-2xl shadow-xl',
    floating:
      'fixed top-20 left-4 right-4 z-50 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/20'
  };

  const paddingClasses = {
    header: 'px-3 py-2 lg:px-4',
    homepage: 'px-4 py-3 lg:px-6 lg:py-5',
    floating: 'px-4 py-3 lg:px-6 lg:py-5'
  };

  const detailPillClass = 'px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.2em]';

  return (
    <AnimatePresence>
      <motion.div
        key={`announcement-banner-${settings.version}`}
        initial={{ opacity: 0, y: variant === 'floating' ? -40 : -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative overflow-hidden ${variantClasses[variant]} ${className}`}
        style={{
          ...gradientStyle,
          border: variant === 'homepage' ? `2px solid ${accentColor}40` : undefined
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-40 blur-3xl"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${accentColor}55, transparent 50%), radial-gradient(circle at 80% 0%, ${settings.textColor}25, transparent 55%)`
          }}
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className={`relative ${paddingClasses[variant]}`}>
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 p-2 rounded-xl bg-white/15 backdrop-blur text-white shadow-inner">
                <BookOpen className="w-6 h-6" strokeWidth={1.5} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {settings.badge && (
                    <span
                      className={`${detailPillClass} bg-white/15 text-white shadow-sm`}
                      style={{ border: `1px solid ${accentColor}40` }}
                    >
                      {settings.badge}
                    </span>
                  )}
                  <span
                    className={`${detailPillClass} bg-black/20 text-white/80`}
                    style={{ border: `1px solid ${accentColor}33` }}
                  >
                    {settings.version}
                  </span>
                </div>

                <h3 className="text-base lg:text-lg font-semibold mb-1 leading-tight">
                  {settings.heading}
                </h3>
                <p className="text-sm lg:text-base text-white/90 leading-snug">
                  {settings.message}
                </p>

                {settings.targetDate && timeLeft.days >= 0 && (
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs lg:text-sm font-semibold tracking-wide text-white/90">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-80" />
                      <span>Launch in</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg px-2 py-1 bg-black/20">{timeLeft.days}d</span>
                      <span className="rounded-lg px-2 py-1 bg-black/20">{timeLeft.hours}h</span>
                      <span className="rounded-lg px-2 py-1 bg-black/20">
                        {timeLeft.minutes}m
                      </span>
                    </div>
                  </div>
                )}

                {settings.ctaLabel && (
                  <div className="mt-4 space-y-2">
                    <form
                      onSubmit={handleSubscribe}
                      className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
                    >
                      <input
                        type="email"
                        value={subscriberEmail}
                        onChange={(e) => {
                          setSubscriberEmail(e.target.value);
                          setSubscriptionState('idle');
                          setSubscriptionMessage('');
                        }}
                        placeholder="Enter your email to get notified"
                        className="w-full rounded-full border border-white/40 bg-white/20 px-4 py-2 text-sm text-white placeholder-white/70 focus:border-white focus:bg-white/30 focus:outline-none"
                        aria-label="Notification email"
                        disabled={subscriptionState === 'loading'}
                        required
                      />
                      <button
                        type="submit"
                        disabled={subscriptionState === 'loading'}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 shadow-lg transition hover:translate-y-[-1px] disabled:opacity-60"
                      >
                        {subscriptionState === 'loading' ? 'Joining…' : settings.ctaLabel}
                      </button>
                    </form>
                    {subscriptionMessage && (
                      <p
                        className={`text-xs ${
                          subscriptionState === 'success' ? 'text-white' : 'text-red-100'
                        }`}
                      >
                        {subscriptionMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss announcement"
              title="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(120deg, transparent, ${accentColor}33, transparent)`
          }}
          animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}