"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FeaturedBlogArticles } from '@/components/home/featured-blog-articles';
import { SimplePublicationBanner } from '@/components/announcements/simple-publication-banner';
import { Search, BookOpen, Sparkles, Calendar, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useBibleStore } from '@/lib/store';
import { formatTranslationName, sortTranslations, getDefaultTranslationId } from '@/lib/utils/translation-formatter';

const features = [
  {
    title: 'Daily Reading Hub',
    body: 'Choose your translation, set a plan, and follow curated passages that refresh every morning.',
  },
  {
    title: 'Study Tools',
    body: 'Jump to commentaries, footnotes, and the AI assistant without leaving the passage you are reading.',
  },
  {
    title: 'Projector Ready',
    body: 'Send verses and highlights straight to the projector screen in a single tap.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { translations, isLoading, loadTranslations, getTranslationsForEndUsers } = useBibleStore();
  const [selectedTranslationId, setSelectedTranslationId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, startTransition] = useTransition();

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const endUserTranslations = getTranslationsForEndUsers();
  const sortedTranslations = useMemo(() => sortTranslations(endUserTranslations), [endUserTranslations]);
  const defaultTranslationId = useMemo(
    () => (endUserTranslations.length > 0 ? getDefaultTranslationId(endUserTranslations) : ''),
    [endUserTranslations]
  );

  useEffect(() => {
    if (defaultTranslationId && !selectedTranslationId) {
      setSelectedTranslationId(defaultTranslationId);
    }
  }, [defaultTranslationId, selectedTranslationId]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const searchParams = new URLSearchParams({
      q: searchQuery.trim(),
      translation: selectedTranslationId || defaultTranslationId
    });
    startTransition(() => {
      router.push(`/search?${searchParams.toString()}`);
    });
  }, [defaultTranslationId, router, searchQuery, selectedTranslationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const canSearch = searchQuery.trim().length > 0 && !isLoading && !isSearching;

  return (
    <div className="rpv-page-padding">
      {/* Publication Banner */}
      <SimplePublicationBanner variant="homepage" className="mb-4" />

      {/* Hero */}
      <div className="rpv-hero">
        <div className="rpv-pill-row">
          <span className="rpv-pill rpv-pill-red">NEW</span>
          <span className="rpv-pill rpv-pill-navy">Redemption Project Version</span>
        </div>
        <h1 className="rpv-serif">A Bible built for today.</h1>
        <p>Read, search, and study the Bible with a clean, distraction-free experience. Powered by AI for deeper understanding.</p>

        <div className="rpv-countdown">
          <span>Full launch in</span>
          <b>42d</b>
          <b>06h</b>
          <b>12m</b>
        </div>

        <div className="rpv-hero-form">
          <input
            type="email"
            placeholder="Enter your email to get notified"
            onChange={() => {}}
          />
          <button className="rpv-btn-red">Notify Me</button>
        </div>
      </div>

      {/* Red strip */}
      <div className="rpv-strip">
        Take your Bible study anywhere — RPV keeps trusted tools and insights connected to the passage you are reading.
      </div>

      {/* Search + Quick Actions */}
      <div className="rpv-grid2">
        <div className="rpv-card">
          <div className="rpv-eyebrow">SMART SEARCH</div>
          <div className="rpv-field-row">
            <input
              type="text"
              placeholder="Enter passage, keyword, or topic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search for passages, keywords, or topics"
            />
          </div>
          <div className="rpv-field-row">
            <select
              value={selectedTranslationId}
              onChange={(e) => setSelectedTranslationId(e.target.value)}
              disabled={isLoading}
              aria-label="Available translations"
            >
              {isLoading ? (
                <option>Loading translations...</option>
              ) : sortedTranslations.length === 0 ? (
                <option>No translations available</option>
              ) : (
                sortedTranslations.map((translation) => (
                  <option key={translation.id} value={translation.id}>
                    {formatTranslationName(translation)}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="rpv-btn-red"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={14} />
                {isSearching ? 'Searching…' : 'Search'}
              </span>
            </button>
          </div>
          <p className="rpv-protip">
            <strong>Pro tip:</strong> Tap any favorite to pin it for faster access in projection mode.
          </p>
        </div>

        <div className="rpv-card">
          <div className="rpv-eyebrow">QUICK ACTIONS</div>
          <Link href="/read" className="rpv-btn-outline-navy">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={15} /> Browse Books
              </span>
              <ChevronRight size={14} />
            </span>
          </Link>
          <Link href="/devotionals" className="rpv-btn-outline-navy">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={15} /> Daily Devotional
              </span>
              <ChevronRight size={14} />
            </span>
          </Link>
          <Link href="/bible-search" className="rpv-btn-outline-navy">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} /> AI Bible Search
              </span>
              <ChevronRight size={14} />
            </span>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="rpv-section-head">
        <h2>Discover Your Next Passage</h2>
        <p>Built with a modern, warm aesthetic for today's study habits.</p>
      </div>
      <div className="rpv-feature-grid">
        {features.map((feature) => (
          <div key={feature.title} className="rpv-feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </div>
        ))}
      </div>

      {/* Featured Articles */}
      <div className="rpv-card" style={{ marginBottom: 20 }}>
        <div className="rpv-section-head">
          <h2>Featured Articles</h2>
          <p>Explore the latest insights and updates from our blog.</p>
        </div>
        <div className="min-h-[200px]">
          <FeaturedBlogArticles />
        </div>
      </div>
    </div>
  );
}


