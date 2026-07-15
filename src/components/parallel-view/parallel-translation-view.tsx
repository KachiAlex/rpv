"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { VerseCard } from '@/components/verse/verse-card';
import { useAuth } from '@/lib/hooks/use-auth';
import { X } from 'lucide-react';
import type { Translation, Verse } from '@/lib/types';

interface ParallelTranslationViewProps {
  translations: Translation[];
  selectedTranslations: string[]; // Translation IDs
  book: string;
  chapter: number;
  verse: number;
  onVerseClick: (verse: number) => void;
  onClose: () => void;
  onTranslationChange: (translationIds: string[]) => void;
}

export function ParallelTranslationView({
  translations,
  selectedTranslations,
  book,
  chapter,
  verse,
  onVerseClick,
  onClose,
  onTranslationChange,
}: ParallelTranslationViewProps) {
  const { isAuthenticated } = useAuth();
  const scrollRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [viewMode, setViewMode] = useState<'2' | '3'>('2');

  // Filter available translations
  const availableTranslations = useMemo(() => {
    return translations.filter(t => selectedTranslations.includes(t.id));
  }, [translations, selectedTranslations]);

  // Get verses for each translation
  const versesByTranslation = useMemo(() => {
    const result: Record<string, Verse[]> = {};
    
    availableTranslations.forEach(translation => {
      const bookObj = translation.books.find(b => b.name === book);
      const chapterObj = bookObj?.chapters.find(c => c.number === chapter);
      const verses = (chapterObj?.verses || []).filter(
        v => v && typeof v.number === 'number' && v.text
      ) as Verse[];
      
      result[translation.id] = verses;
    });
    
    return result;
  }, [availableTranslations, book, chapter]);

  // Sync scrolling between columns
  const handleScroll = (index: number) => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    const sourceElement = scrollRefs.current[index];
    if (!sourceElement) {
      setIsScrolling(false);
      return;
    }

    const scrollTop = sourceElement.scrollTop;
    const scrollHeight = sourceElement.scrollHeight;
    const clientHeight = sourceElement.clientHeight;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

    // Apply scroll to other columns
    scrollRefs.current.forEach((ref, i) => {
      if (i !== index && ref) {
        const targetScrollHeight = ref.scrollHeight;
        const targetClientHeight = ref.clientHeight;
        const targetScrollTop = scrollPercentage * (targetScrollHeight - targetClientHeight);
        ref.scrollTop = targetScrollTop;
      }
    });

    setTimeout(() => setIsScrolling(false), 100);
  };

  // Scroll to selected verse when it changes
  useEffect(() => {
    if (verse && !isScrolling) {
      const verseElement = document.getElementById(`parallel-verse-${verse}`);
      if (verseElement) {
        const container = verseElement.closest('[data-parallel-column]') as HTMLDivElement;
        if (container) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [verse, isScrolling]);

  const handleTranslationToggle = (translationId: string) => {
    const newSelection = selectedTranslations.includes(translationId)
      ? selectedTranslations.filter(id => id !== translationId)
      : [...selectedTranslations, translationId].slice(0, 3); // Max 3 translations
    
    onTranslationChange(newSelection);
    
    // Update view mode based on selection count
    if (newSelection.length >= 3) {
      setViewMode('3');
    } else if (newSelection.length === 2) {
      setViewMode('2');
    }
  };

  const displayedTranslations = availableTranslations.slice(0, viewMode === '2' ? 2 : 3);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="bg-neutral-800 border-b border-neutral-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Parallel Translation View</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('2')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === '2'
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              2 Columns
            </button>
            <button
              onClick={() => setViewMode('3')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === '3'
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              3 Columns
            </button>
          </div>
        </div>

        {/* Translation Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <span>Translations:</span>
            {translations.map(t => (
              <button
                key={t.id}
                onClick={() => handleTranslationToggle(t.id)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedTranslations.includes(t.id)
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-neutral-700 transition-colors text-neutral-300 hover:text-white"
            title="Close Parallel View"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Parallel Columns */}
      <div className={`flex-1 grid gap-4 p-4 overflow-hidden ${
        viewMode === '2' ? 'grid-cols-2' : 'grid-cols-3'
      }`}>
        {displayedTranslations.map((translation, index) => {
          const verses = versesByTranslation[translation.id] || [];

          return (
            <div
              key={translation.id}
              className="flex flex-col rounded-lg border border-neutral-700 bg-neutral-800 overflow-hidden"
              data-parallel-column
            >
              {/* Column Header */}
              <div className="bg-neutral-900 border-b border-neutral-700 p-3">
                <h3 className="font-semibold text-brand-400">{translation.name}</h3>
                <p className="text-sm text-neutral-400">
                  {book} {chapter}
                </p>
              </div>

              {/* Verses */}
              <div
                ref={el => {
                  scrollRefs.current[index] = el;
                }}
                onScroll={() => handleScroll(index)}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {verses.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">
                    No verses found for this translation
                  </p>
                ) : (
                  verses.map((v) => (
                    <div
                      key={v.number}
                      id={`parallel-verse-${v.number}`}
                      onClick={() => onVerseClick(v.number)}
                      className={`cursor-pointer transition-all rounded-lg p-3 ${
                        verse === v.number
                          ? 'bg-brand-900/50 border-2 border-brand-500'
                          : 'bg-neutral-700/50 border border-transparent hover:bg-neutral-700'
                      }`}
                    >
                      <VerseCard
                        verse={v}
                        book={book}
                        chapter={chapter}
                        isSelected={verse === v.number}
                        translationName={translation.name}
                        translationId={translation.id}
                        isAuthenticated={isAuthenticated}
                        onNoteClick={() => {
                          // Note editing in parallel view could open in a modal
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Bar */}
      <div className="bg-neutral-800 border-t border-neutral-700 p-2 px-4 text-xs text-neutral-400">
        <div className="flex items-center justify-between">
          <span>Synchronized scrolling enabled</span>
          <span>{displayedTranslations.length} translations displayed</span>
        </div>
      </div>
    </div>
  );
}

