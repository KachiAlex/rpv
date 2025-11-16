"use client";
import { useEffect, useMemo, useState } from 'react';
import { useBibleStore } from '@/lib/store';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VerseCard } from '@/components/verse/verse-card';
import { CopyVersesButton } from '@/components/verse/copy-verses-button';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';
import { SearchBar } from '@/components/search/search-bar';
import { NoteEditor } from '@/components/notes/note-editor';

export default function ReadPage() {
  const { translations, current, loadSample, loadTranslations, setReference } = useBibleStore();
  const { user, isAuthenticated } = useAuth();
  const [book, setBook] = useState<string>('');
  const [chapter, setChapter] = useState<number>(1);
  const [verse, setVerse] = useState<number>(1);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const userService = new UserService();
  
  // Ensure translations is always an array
  const safeTranslations = Array.isArray(translations) ? translations : [];

  useEffect(() => {
    // Try to load from Firestore, fallback to sample
    loadTranslations().catch(async () => {
      await loadSample();
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

  const books = useMemo(() => (current?.books ?? []).filter(b => b && b.name && Array.isArray(b.chapters)), [current]);
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
      <aside className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 via-white to-accent-purple/5 dark:from-neutral-800 dark:via-neutral-800 dark:to-accent-purple/10 p-4 h-fit sticky top-4 shadow-lg">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <SearchBar />
          </div>
          
          <label className="block text-sm font-medium">Translation</label>
          <select className="w-full rounded-md border p-2" value={current?.id ?? ''} onChange={(e) => useBibleStore.getState().setCurrent(e.target.value)}>
            {safeTranslations.map((t) => (
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

      <section className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-white via-brand-50/30 to-white dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-800 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium bg-gradient-to-r from-brand-600 to-accent-purple bg-clip-text text-transparent">
            {current?.name} • {book || '—'} {chapter}
          </div>
          
          {book && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousChapter}
                disabled={previousChapter === null}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  previousChapter === null
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500'
                    : 'bg-gradient-to-r from-accent-blue to-accent-teal text-white hover:from-accent-blue/90 hover:to-accent-teal/90 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
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
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500'
                    : 'bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:from-accent-purple/90 hover:to-accent-pink/90 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
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
          <>
            {selectedVerses.size > 0 && (
              <div className="mb-4 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-300 dark:border-brand-600 rounded-lg flex items-center justify-between">
                <span className="text-sm text-brand-700 dark:text-brand-400">
                  {selectedVerses.size} {selectedVerses.size === 1 ? 'verse' : 'verses'} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedVerses(new Set())}
                    className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    Clear
                  </button>
                  <CopyVersesButton
                    verses={displayedVerses
                      .filter(v => selectedVerses.has(v.number))
                      .map(v => ({ verse: v, book, chapter }))}
                    translationName={current?.name}
                    onCopy={() => setSelectedVerses(new Set())}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {displayedVerses.map((v) => (
                <div
                  key={v.number}
                  onClick={(e) => {
                    // Allow multi-select with Ctrl/Cmd key
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
                      // Single click to select verse
                      setVerse(v.number);
                      setSelectedVerses(new Set([v.number]));
                    }
                  }}
                  className={`cursor-pointer ${
                    selectedVerses.has(v.number) ? 'ring-2 ring-brand-500' : ''
                  }`}
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

      {showNotes && current && (
        <NoteEditor
          translationId={current.id}
          book={book}
          chapter={chapter}
          verse={verse}
          onClose={() => setShowNotes(false)}
        />
      )}
    </div>
  );
}


