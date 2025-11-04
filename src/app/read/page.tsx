"use client";
import { useEffect, useMemo, useState } from 'react';
import { useBibleStore } from '@/lib/store';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BookmarkButton } from '@/components/bookmark/bookmark-button';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';
import { SearchBar } from '@/components/search/search-bar';

export default function ReadPage() {
  const { translations, current, loadSample, loadTranslations, setReference } = useBibleStore();
  const { user, isAuthenticated } = useAuth();
  const [book, setBook] = useState<string>('');
  const [chapter, setChapter] = useState<number>(1);
  const [verse, setVerse] = useState<number>(1);
  const userService = new UserService();

  useEffect(() => {
    // Try to load from Firestore, fallback to sample
    loadTranslations().catch(() => {
      loadSample();
    });
  }, []);

  // Track reading history
  useEffect(() => {
    if (isAuthenticated && user && current && book && chapter && verse) {
      trackReadingHistory();
    }
  }, [isAuthenticated, user, current?.id, book, chapter, verse]);

  const trackReadingHistory = async () => {
    if (!user || !current) return;
    
    try {
      await userService.addReadingHistory(user.uid, {
        translationId: current.id,
        book,
        chapter,
        verse,
      });
    } catch (error) {
      console.error('Error tracking reading history:', error);
    }
  };

  const books = useMemo(() => current?.books ?? [], [current]);
  const chapters = useMemo(() => {
    const b = books.find(b => b.name === book);
    return b ? b.chapters.map((c) => c.number) : [];
  }, [books, book]);
  const verses = useMemo(() => {
    const b = books.find(b => b.name === book);
    const c = b?.chapters.find((c) => c.number === chapter);
    return c ? c.verses.map((v) => v.number) : [];
  }, [books, book, chapter]);

  const displayedVerses = useMemo(() => {
    const b = books.find(b => b.name === book);
    const c = b?.chapters.find((c) => c.number === chapter);
    if (!c || c.verses.length === 0) return [];
    
    // Find the selected verse index
    const selectedIndex = c.verses.findIndex(v => v.number === verse);
    if (selectedIndex === -1) return c.verses.slice(0, 10); // Show first 10 if verse not found
    
    // Show 5 verses before and 5 after (or adjust based on available)
    const startIndex = Math.max(0, selectedIndex - 5);
    const endIndex = Math.min(c.verses.length, selectedIndex + 6); // +6 to include selected verse + 5 after
    
    return c.verses.slice(startIndex, endIndex);
  }, [books, book, chapter, verse]);

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
  const goToPreviousChapter = () => {
    if (previousChapter !== null) {
      setChapter(previousChapter);
      setVerse(1); // Reset to first verse
    }
  };

  // Navigate to next chapter
  const goToNextChapter = () => {
    if (nextChapter !== null) {
      setChapter(nextChapter);
      setVerse(1); // Reset to first verse
    }
  };

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

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-xl border bg-white p-4 h-fit sticky top-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <SearchBar />
          </div>
          
          <label className="block text-sm font-medium">Translation</label>
          <select className="w-full rounded-md border p-2" value={current?.id ?? ''} onChange={(e) => useBibleStore.getState().setCurrent(e.target.value)}>
            {translations.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mt-4">Book</label>
          <select className="w-full rounded-md border p-2" value={book} onChange={(e) => setBook(e.target.value)}>
            <option value="">Select book</option>
            {books.map((b) => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium">Chapter</label>
              <select className="w-full rounded-md border p-2" value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
                {chapters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Start Verse</label>
              <select className="w-full rounded-md border p-2" value={verse} onChange={(e) => setVerse(Number(e.target.value))}>
                {verses.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </aside>

      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-neutral-500">{current?.name} • {book || '—'} {chapter}</div>
          
          {book && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousChapter}
                disabled={previousChapter === null}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  previousChapter === null
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                title={previousChapter ? `Go to Chapter ${previousChapter}` : 'No previous chapter'}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              
              <button
                onClick={goToNextChapter}
                disabled={nextChapter === null}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  nextChapter === null
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                title={nextChapter ? `Go to Chapter ${nextChapter}` : 'No next chapter'}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
        
        {displayedVerses.length === 0 ? (
          <div className="text-neutral-500 text-center py-12">Choose a book, chapter, and verse.</div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {displayedVerses.map((v) => (
              <div
                key={v.number}
                id={`verse-${v.number}`}
                className={`p-4 rounded-lg transition-colors ${
                  v.number === verse 
                    ? 'bg-brand-50 border-2 border-brand-300' 
                    : 'bg-neutral-50 border border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-semibold text-brand-700">
                    {book} {chapter}:{v.number}
                  </div>
                  {current && (
                    <BookmarkButton
                      translationId={current.id}
                      book={book}
                      chapter={chapter}
                      verse={v.number}
                    />
                  )}
                </div>
                <div className="text-lg leading-relaxed text-neutral-900">
                  {v.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


