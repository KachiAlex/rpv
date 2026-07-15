  "use client";

import { useEffect, useMemo, useState, useRef, useCallback, useTransition } from 'react';

import { useBibleStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, Keyboard, X, Columns2, SlidersHorizontal } from 'lucide-react';
import { VerseCard } from '@/components/verse/verse-card';
import { CopyVersesButton } from '@/components/verse/copy-verses-button';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';
import { SearchBar } from '@/components/search/search-bar';
import { NoteEditor } from '@/components/notes/note-editor';
import { ParallelTranslationView } from '@/components/parallel-view/parallel-translation-view';
import { AudioControls } from '@/components/audio-bible/audio-controls';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { ReadingProgressService } from '@/lib/services/reading-progress-service';

export default function ReadPageContent() {
  const { translations, current, loadSample, loadTranslations, setReference, setCurrent, getTranslationsForEndUsers, loadBookContent } = useBibleStore();
  const { user, isAuthenticated } = useAuth();
  const [book, setBook] = useState<string>('');
  const [chapter, setChapter] = useState<number>(1);
  const [verse, setVerse] = useState<number>(1);

  const [showNotes, setShowNotes] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showParallelView, setShowParallelView] = useState(false);
  const [parallelTranslations, setParallelTranslations] = useState<string[]>([]);
  const [isLoadingBookContent, setIsLoadingBookContent] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isNavigationPending, startNavigationTransition] = useTransition();
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);
  const [autoPlayStartVerse, setAutoPlayStartVerse] = useState<number | null>(null);
  const pendingAutoPlayRef = useRef<{ chapter: number; verse: number } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userService = useMemo(() => new UserService(), []);
  const progressService = useMemo(() => new ReadingProgressService(), []);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Get filtered translations for end users (only published books)
  const endUserTranslations = getTranslationsForEndUsers();

  // Ensure translations is always an array
  const safeTranslations = useMemo(
    () => (Array.isArray(endUserTranslations) ? endUserTranslations : []),
    [endUserTranslations]
  );

  const books = useMemo(() => {
    if (!current?.books) return [];

    // Filter books to only show published ones for end users
    const publishedBooks = current.books.filter(b => b && b.name && Array.isArray(b.chapters) && b.published !== false);
    console.log('[ReadPage] Current translation:', current.id, 'Total books:', current.books.length, 'Published books:', publishedBooks.length);
    return publishedBooks;
  }, [current]);

  const chapters = useMemo(() => {
    const b = books.find(b => b.name === book);
    return (b && Array.isArray(b.chapters)) ? b.chapters.map((c) => c?.number).filter(n => typeof n === 'number') : [];
  }, [books, book]);

  const verses = useMemo(() => {
    const b = books.find(b => b.name === book);
    const c = b?.chapters?.find((c) => c?.number === chapter);
    return (c && Array.isArray(c.verses)) ? c.verses.map((v) => v?.number).filter(n => typeof n === 'number') : [];
  }, [books, book, chapter]);

  const displayedVerses = useMemo(() => {
    const b = books.find(b => b.name === book);
    const c = b?.chapters?.find((c) => c?.number === chapter);
    if (!c || !Array.isArray(c.verses) || c.verses.length === 0) return [];
    
    // Show all verses in the chapter
    return c.verses.filter(v => v && typeof v.number === 'number' && v.text);
  }, [books, book, chapter]);

  useEffect(() => {
    if (!book) return;
    if (chapters.length === 0) return;
    if (!chapters.includes(chapter)) {
      const fallbackChapter = chapters[0];
      startNavigationTransition(() => {
        setChapter(fallbackChapter);
        setVerse(1);
      });
      setSyncNotice(`Chapter ${chapter} isn't available in ${book}, so we moved you to chapter ${fallbackChapter}.`);
    }
  }, [book, chapters, chapter, startNavigationTransition]);

  useEffect(() => {
    if (!book || !chapter) return;
    if (verses.length === 0) return;
    if (!verses.includes(verse)) {
      const fallbackVerse = verses[0];
      startNavigationTransition(() => setVerse(fallbackVerse));
      setSyncNotice(`Verse ${verse} isn't available in this chapter, so we started at verse ${fallbackVerse}.`);
    }
  }, [book, chapter, verses, verse, startNavigationTransition]);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = setTimeout(() => setSyncNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [syncNotice]);

  useEffect(() => {
    if (isDesktop) {
      setShowMobileFilters(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (showMobileFilters && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileFilters, isDesktop]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadTranslations();
      } catch {
        await loadSample();
      }
    };

    loadData();
  }, [loadTranslations, loadSample]);

  // Handle URL parameters for navigation from search results
  useEffect(() => {
    if (!searchParams) return;

    const translationParam = searchParams.get('translation');
    const bookParam = searchParams.get('book');
    const chapterParam = searchParams.get('chapter');
    const verseParam = searchParams.get('verse');

    if (translationParam && bookParam && chapterParam && verseParam) {
      // Set translation if different from current
      if (current?.id !== translationParam) {
        setCurrent(translationParam);
      }
      
      // Set navigation parameters
      setBook(decodeURIComponent(bookParam));
      setChapter(parseInt(chapterParam));
      setVerse(parseInt(verseParam));
      
      // Clear URL parameters after setting state
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, current?.id, setCurrent]);

  // Initialize parallel translations with current translation + first available
  useEffect(() => {
    if (current && safeTranslations.length > 0 && parallelTranslations.length === 0) {
      const currentId = current.id;
      const otherTranslation = safeTranslations.find(t => t.id !== currentId);
      setParallelTranslations(
        otherTranslation 
          ? [currentId, otherTranslation.id] 
          : [currentId]
      );
    }
  }, [current, safeTranslations, parallelTranslations.length]);

  // Load book content when book is selected and doesn't have chapters
  useEffect(() => {
    const loadBookContentIfNeeded = async () => {
      if (current && book) {
        // First check if the book is published (available to end users)
        const publishedBooks = current.books.filter(b => b && b.name && Array.isArray(b.chapters) && b.published !== false);
        const selectedBook = publishedBooks.find(b => b.name === book);
        
        if (selectedBook && selectedBook.chapters.length === 0) {
          console.log('[ReadPage] Loading content for published book:', book);
          setIsLoadingBookContent(true);
          try {
            await loadBookContent(current.id, book);
          } catch (error) {
            console.error('Error loading book content:', error);
          } finally {
            setIsLoadingBookContent(false);
          }
        } else if (!selectedBook) {
          // Book is not published or doesn't exist
          console.log('[ReadPage] Book not available for end users:', book);
        }
      }
    };

    loadBookContentIfNeeded();
  }, [current, book, loadBookContent]);

  // Track reading history and progress
  const currentId = current?.id;

  const trackReadingHistory = useCallback(async () => {
    if (!user || !currentId) return;
    
    try {
      await userService.addReadingHistory(user.uid, {
        translationId: currentId,
        book,
        chapter,
        verse,
      });
    } catch (error) {
      console.error('Error tracking reading history:', error);
    }
  }, [user, currentId, book, chapter, verse, userService]);

  const trackChapterProgress = useCallback(async () => {
    if (!user || !current || !book || !chapter) return;
    
    try {
      const bookObj = current.books.find(b => b.name === book);
      const totalChapters = bookObj?.chapters.length || 0;
      
      if (totalChapters > 0) {
        await progressService.markChapterRead(user.uid, current.id, book, chapter, totalChapters);
      }
    } catch (error) {
      console.error('Error tracking chapter progress:', error);
    }
  }, [user, current, book, chapter, progressService]);

  useEffect(() => {
    if (isAuthenticated) {
      trackReadingHistory();
      trackChapterProgress();
    }
  }, [isAuthenticated, trackReadingHistory, trackChapterProgress]);

  // Calculate previous and next chapter numbers
  const { previousChapter, nextChapter } = useMemo(() => {
    const sortedChapters = [...chapters].sort((a, b) => a - b);
    const currentIndex = sortedChapters.indexOf(chapter);
    
    return {
      previousChapter: currentIndex > 0 ? sortedChapters[currentIndex - 1] : null,
      nextChapter: currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null,
    };
  }, [chapters, chapter]);

  // Navigate to previous chapter
  const goToPreviousChapter = useCallback(() => {
    if (previousChapter !== null) {
      startNavigationTransition(() => {
        setChapter(previousChapter);
        setVerse(1); // Reset to first verse
      });
    }
  }, [previousChapter, startNavigationTransition]);

  // Navigate to next chapter
  const goToNextChapter = useCallback(() => {
    if (nextChapter !== null) {
      startNavigationTransition(() => {
        setChapter(nextChapter);
        setVerse(1); // Reset to first verse
      });
    }
  }, [nextChapter, startNavigationTransition]);

  const handleAudioPlaybackComplete = useCallback(() => {
    if (nextChapter === null) return;
    pendingAutoPlayRef.current = { chapter: nextChapter, verse: 1 };
    startNavigationTransition(() => {
      setChapter(nextChapter);
      setVerse(1);
    });
  }, [nextChapter, startNavigationTransition]);

  useEffect(() => {
    if (!pendingAutoPlayRef.current) return;
    if (pendingAutoPlayRef.current.chapter !== chapter) return;
    if (displayedVerses.length === 0) return;

    const targetVerse = pendingAutoPlayRef.current.verse;
    pendingAutoPlayRef.current = null;
    setAutoPlayStartVerse(targetVerse);
    setAutoPlaySignal((signal) => signal + 1);
  }, [chapter, displayedVerses]);

  useEffect(() => {
    if (book && chapter && verse) setReference({ book, chapter, verse });
  }, [book, chapter, verse, setReference]);

  // Auto-scroll to selected verse when it changes
  useEffect(() => {
    const verseElement = document.getElementById(`verse-${verse}`);
    if (verseElement) {
      verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [verse]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or when modals are open
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        showNotes ||
        showKeyboardHelp
      ) {
        // Allow '/' to focus search even in these cases (unless in search already)
        if (e.key === '/' && target.tagName !== 'INPUT' && !target.getAttribute('data-search-input')) {
          e.preventDefault();
          const searchInput = document.querySelector('input[data-search-input="true"]') as HTMLInputElement;
          searchInput?.focus();
          return;
        }
        return;
      }

      switch (e.key) {
        case 'j':
        case 'J':
          // Next verse
          e.preventDefault();
          if (verses.length > 0) {
            const currentIndex = verses.indexOf(verse);
            if (currentIndex < verses.length - 1) {
              setVerse(verses[currentIndex + 1]);
            } else if (nextChapter !== null) {
              // Move to next chapter
              setChapter(nextChapter);
              setVerse(verses[0] || 1);
            }
          }
          break;

        case 'k':
        case 'K':
          // Previous verse
          e.preventDefault();
          if (verses.length > 0) {
            const currentIndex = verses.indexOf(verse);
            if (currentIndex > 0) {
              setVerse(verses[currentIndex - 1]);
            } else if (previousChapter !== null) {
              // Move to previous chapter
              setChapter(previousChapter);
              const prevBook = books.find(b => b.name === book);
              const prevChapters = prevBook?.chapters || [];
              const prevChapterObj = prevChapters.find(c => c.number === previousChapter);
              const prevVerses = prevChapterObj?.verses.map(v => v.number) || [];
              setVerse(prevVerses[prevVerses.length - 1] || 1);
            }
          }
          break;

        case 'h':
        case 'H':
          // Previous chapter
          e.preventDefault();
          goToPreviousChapter();
          break;

        case 'l':
        case 'L':
          // Next chapter
          e.preventDefault();
          goToNextChapter();
          break;

        case '/':
          // Focus search
          e.preventDefault();
          const searchInput = document.querySelector('input[data-search-input="true"]') as HTMLInputElement;
          searchInput?.focus();
          break;

        case '?':
          // Show keyboard help
          e.preventDefault();
          setShowKeyboardHelp(true);
          break;

        case 'Escape':
          // Close modals
          if (showNotes) {
            setShowNotes(false);
          }
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false);
          }
          break;

        case 'G':
          // 'G' - Go to last verse of chapter
          if (e.shiftKey) {
            e.preventDefault();
            if (verses.length > 0) {
              setVerse(verses[verses.length - 1]);
            }
          }
          break;
      }
    };

    // Handle 'gg' for first verse (press 'g' twice quickly)
    let gPressCount = 0;
    let gPressTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleGKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'g' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        gPressCount++;
        
        if (gPressCount === 2) {
          // Double 'g' - Go to first verse of chapter
          if (verses.length > 0) {
            setVerse(verses[0]);
          }
          gPressCount = 0;
          if (gPressTimeout) clearTimeout(gPressTimeout);
          gPressTimeout = null;
        } else {
          if (gPressTimeout) clearTimeout(gPressTimeout);
          gPressTimeout = setTimeout(() => {
            gPressCount = 0;
            gPressTimeout = null;
          }, 500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleGKey);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleGKey);
      if (gPressTimeout) clearTimeout(gPressTimeout);
    };
  }, [verse, verses, chapter, book, books, nextChapter, previousChapter, showNotes, showKeyboardHelp, goToNextChapter, goToPreviousChapter]);

  const renderFilters = (
    { showSearch = true, layout = 'default' }: { showSearch?: boolean; layout?: 'default' | 'compact' } = {}
  ) => {
    const spacing = layout === 'compact' ? 'space-y-2' : 'space-y-3';

    return (
      <div className={spacing}>
        {showSearch && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Search</label>
            <SearchBar inputRef={searchInputRef} />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Translation</label>
          <select
            className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] transition-colors focus:border-[var(--navy-800)] focus:outline-none"
            value={current?.id ?? ''}
            onChange={(e) =>
              startNavigationTransition(() => useBibleStore.getState().setCurrent(e.target.value))
            }
          >
            {safeTranslations.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Book</label>
          <select
            className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] transition-colors focus:border-[var(--navy-800)] focus:outline-none"
            value={book}
            onChange={(e) => startNavigationTransition(() => setBook(e.target.value))}
          >
            <option value="">Select book</option>
            {books.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Chapter</label>
            <select
              className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] transition-colors focus:border-[var(--navy-800)] focus:outline-none"
              value={chapter}
              onChange={(e) => startNavigationTransition(() => setChapter(Number(e.target.value)))}
              disabled={chapters.length === 0}
            >
              {chapters.length === 0 ? (
                <option value="">--</option>
              ) : (
                chapters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Verse</label>
            <select
              className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] transition-colors focus:border-[var(--navy-800)] focus:outline-none"
              value={verse}
              onChange={(e) => startNavigationTransition(() => setVerse(Number(e.target.value)))}
              disabled={verses.length === 0}
            >
              {verses.length === 0 ? (
                <option value="">--</option>
              ) : (
                verses.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const filtersContent = renderFilters();
  const quickReferenceControls = renderFilters({ showSearch: false, layout: 'compact' });

  const quickReferenceCard = (
    <div className="lg:hidden rpv-card" style={{ padding: 16 }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)]">Browse Book</p>
          <p className="text-sm text-[var(--rpv-ink-faint)]">Quick access to translation, book, and chapter.</p>
        </div>
        <button
          onClick={() => setShowMobileFilters(true)}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--navy-50)] px-3 py-1 text-xs font-semibold text-[var(--navy-800)] hover:bg-[var(--navy-100)]"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg bg-[var(--rpv-lav)] p-3 text-xs text-[var(--rpv-ink-faint)]">
          <div className="mb-2 flex items-center justify-between">
            <span>Translation</span>
            <span className="font-semibold text-[var(--rpv-ink)]">{current?.name || '—'}</span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span>Book</span>
            <span className="font-semibold text-[var(--rpv-ink)]">{book || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Chapter</span>
            <span className="font-semibold text-[var(--rpv-ink)]">{chapter || '—'}</span>
          </div>
        </div>
        <div className="space-y-2 text-sm">{quickReferenceControls}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="rpv-page-padding">
        {quickReferenceCard}

        <div className="rpv-read-layout">
          <aside className="rpv-read-sidebar rpv-card" style={{ padding: 16 }}>
            {filtersContent}
          </aside>

          <section className="rpv-scripture">
            <div className="rpv-scripture-head">
              <div className="rpv-scripture-ref">
                {current?.name} • {book || '—'} {chapter}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowParallelView(true)}
                  className="p-2 rounded-md hover:bg-[var(--rpv-lav)] transition-colors"
                  title="Parallel Translation View"
                  disabled={safeTranslations.length < 2}
                >
                  <Columns2 size={18} className="text-[var(--rpv-ink-faint)] hover:text-[var(--rpv-ink)] disabled:opacity-50" />
                </button>
                <button
                  onClick={() => setShowKeyboardHelp(true)}
                  className="p-2 rounded-md hover:bg-[var(--rpv-lav)] transition-colors"
                  title="Keyboard Shortcuts (?)"
                >
                  <Keyboard size={18} className="text-[var(--rpv-ink-faint)] hover:text-[var(--rpv-ink)]" />
                </button>

                {book && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPreviousChapter}
                      disabled={previousChapter === null}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        previousChapter === null
                          ? 'bg-[var(--rpv-lav)] text-[var(--rpv-ink-faint)] cursor-not-allowed'
                          : 'bg-[var(--navy-800)] text-white hover:bg-[var(--navy-700)]'
                      }`}
                      title={previousChapter ? `Go to Chapter ${previousChapter}` : 'No previous chapter'}
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={goToNextChapter}
                      disabled={nextChapter === null}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        nextChapter === null
                          ? 'bg-[var(--rpv-lav)] text-[var(--rpv-ink-faint)] cursor-not-allowed'
                          : 'bg-[var(--red-600)] text-white hover:bg-[var(--red-700)]'
                      }`}
                      title={nextChapter ? `Go to Chapter ${nextChapter}` : 'No next chapter'}
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {displayedVerses.length === 0 ? (
              <div className="text-[var(--rpv-ink-faint)] text-center py-12">
                {isLoadingBookContent ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--red-600)]"></div>
                    <span>Loading book content...</span>
                  </div>
                ) : (
                  'Choose a book, chapter, and verse.'
                )}
              </div>
            ) : (
              <>
                {selectedVerses.size > 0 && (
                  <div className="mb-4 p-3 bg-[var(--rpv-lav)] border border-[var(--rpv-border)] rounded-lg flex items-center justify-between">
                    <span className="text-sm text-[var(--rpv-ink-soft)]">
                      {selectedVerses.size} {selectedVerses.size === 1 ? 'verse' : 'verses'} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedVerses(new Set())}
                        className="text-sm text-[var(--rpv-ink-faint)] hover:text-[var(--rpv-ink)]"
                      >
                        Clear
                      </button>
                      <CopyVersesButton
                        verses={displayedVerses
                          .filter((v) => selectedVerses.has(v.number))
                          .map((v) => ({ verse: v, book, chapter }))}
                        translationName={current?.name}
                        onCopy={() => setSelectedVerses(new Set())}
                      />
                    </div>
                  </div>
                )}

                {displayedVerses.length > 0 && (
                  <div className="mb-4">
                    <AudioControls
                      verses={displayedVerses.map((v) => ({
                        number: v.number,
                        text: v.text || '',
                      }))}
                      currentVerse={verse}
                      onVerseChange={(v) => {
                        setVerse(v);
                        const verseElement = document.getElementById(`verse-${v}`);
                        if (verseElement) {
                          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      translationName={current?.name}
                      onPlaybackComplete={handleAudioPlaybackComplete}
                      autoPlaySignal={autoPlaySignal}
                      autoPlayStartVerse={autoPlayStartVerse ?? undefined}
                    />
                  </div>
                )}

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {displayedVerses.map((v) => (
                    <div
                      key={v.number}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                          const newSelected = new Set(selectedVerses);
                          if (newSelected.has(v.number)) {
                            newSelected.delete(v.number);
                          } else {
                            newSelected.add(v.number);
                          }
                          setSelectedVerses(newSelected);
                        } else {
                          setVerse(v.number);
                          setSelectedVerses(new Set([v.number]));
                        }
                      }}
                      className={`cursor-pointer ${selectedVerses.has(v.number) ? 'ring-2 ring-[var(--red-500)]' : ''}`}
                    >
                      <VerseCard
                        verse={v}
                        book={book}
                        chapter={chapter}
                        isSelected={v.number === verse}
                        translationName={current?.name}
                        translationId={current?.id}
                        isAuthenticated={isAuthenticated}
                        onNoteClick={() => {
                          setVerse(v.number);
                          setShowNotes(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileFilters(false)}></div>
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--rpv-border)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--navy-800)]">Filters</p>
                <p className="text-sm text-[var(--rpv-ink-faint)]">Search, translation, book, and chapter</p>
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="rounded-full p-2 text-[var(--rpv-ink-faint)] hover:bg-[var(--rpv-lav)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
              {filtersContent}
            </div>
          </div>
        </div>
      )}

      {showParallelView && book && chapter && safeTranslations.length >= 2 && (
        <ParallelTranslationView
          translations={safeTranslations}
          selectedTranslations={parallelTranslations}
          book={book}
          chapter={chapter}
          verse={verse}
          onVerseClick={(v) => setVerse(v)}
          onClose={() => setShowParallelView(false)}
          onTranslationChange={(ids) => setParallelTranslations(ids)}
        />
      )}

      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--navy-900)]">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 rounded-md hover:bg-[var(--rpv-lav)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[var(--red-600)] mb-2">Navigation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Next verse</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">J</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Previous verse</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">K</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Next chapter</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">L</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Previous chapter</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">H</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">First verse of chapter</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">gg</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Last verse of chapter</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">G</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--red-600)] mb-2">Quick Actions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Focus search</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">/</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Show keyboard shortcuts</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">?</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-[var(--rpv-lav)]">
                    <span className="text-[var(--rpv-ink-soft)]">Close modals</span>
                    <kbd className="px-2 py-1 bg-white border border-[var(--rpv-border)] rounded text-xs font-mono">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}