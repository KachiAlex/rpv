"use client";
import { useState, useEffect } from 'react';
import { BookmarkButton } from '@/components/bookmark/bookmark-button';
import { HighlightButton } from '@/components/highlight/highlight-button';
import { CrossReferencePanel } from '@/components/cross-reference/cross-reference-panel';
import { Copy, Check, FileText } from 'lucide-react';
import { formatVerseForCopy, copyToClipboard, type VerseToCopy } from '@/lib/utils/copy-verse';
import { useAuth } from '@/lib/hooks/use-auth';
import { HighlightService } from '@/lib/services/highlight-service';
import type { Verse, Highlight } from '@/lib/types';

interface VerseCardProps {
  verse: Verse;
  book: string;
  chapter: number;
  isSelected: boolean;
  translationName?: string;
  translationId?: string;
  isAuthenticated?: boolean;
  onNoteClick?: () => void;
}

export function VerseCard({
  verse,
  book,
  chapter,
  isSelected,
  translationName,
  translationId,
  isAuthenticated,
  onNoteClick,
}: VerseCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const highlightService = new HighlightService();

  useEffect(() => {
    if (isAuthenticated && user && translationId) {
      loadHighlight();
    }
  }, [isAuthenticated, user, translationId, book, chapter, verse.number]);

  const loadHighlight = async () => {
    if (!user || !translationId) return;
    
    try {
      const existing = await highlightService.getHighlight(user.uid, translationId, book, chapter, verse.number);
      setHighlight(existing);
    } catch (error) {
      console.error('Error loading highlight:', error);
    }
  };

  const handleCopy = async () => {
    const verseToCopy: VerseToCopy = {
      book,
      chapter,
      verse: verse.number,
      text: verse.text,
      translationName,
    };

    const formatted = formatVerseForCopy(verseToCopy, {
      includeReference: true,
      includeTranslation: !!translationName,
      format: 'default',
    });

    const success = await copyToClipboard(formatted);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert('Failed to copy verse. Please try again.');
    }
  };

  const getHighlightStyles = () => {
    if (!highlight) return '';
    
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
      blue: 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
      green: 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700',
      pink: 'bg-pink-100 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700',
      purple: 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
      orange: 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
    };
    
    return colorMap[highlight.color] || '';
  };

  return (
    <div
      id={`verse-${verse.number}`}
      className={`p-4 rounded-lg transition-colors ${
        isSelected
          ? 'bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-300 dark:border-brand-600'
          : highlight
          ? `${getHighlightStyles()} border-2`
          : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-semibold text-brand-700 dark:text-brand-400">
          {book} {chapter}:{verse.number}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title="Copy verse with reference"
          >
            {copied ? (
              <Check size={18} className="text-green-600 dark:text-green-400" />
            ) : (
              <Copy size={18} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
            )}
          </button>
          {translationId && (
            <>
              <div onClick={(e) => e.stopPropagation()}>
                <HighlightButton
                  translationId={translationId}
                  book={book}
                  chapter={chapter}
                  verse={verse.number}
                  onHighlightChange={setHighlight}
                />
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <BookmarkButton
                  translationId={translationId}
                  book={book}
                  chapter={chapter}
                  verse={verse.number}
                />
              </div>
            </>
          )}
          {isAuthenticated && onNoteClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNoteClick();
              }}
              className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="Add note"
            >
              <FileText size={18} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
            </button>
          )}
        </div>
      </div>
      <div className="text-lg leading-relaxed text-neutral-900 dark:text-neutral-100">
        {verse.text}
      </div>
      
      {translationId && (
        <CrossReferencePanel
          translationId={translationId}
          book={book}
          chapter={chapter}
          verse={verse.number}
        />
      )}
    </div>
  );
}

