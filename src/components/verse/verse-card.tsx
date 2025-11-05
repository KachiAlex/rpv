"use client";
import { useState } from 'react';
import { BookmarkButton } from '@/components/bookmark/bookmark-button';
import { Copy, Check, FileText } from 'lucide-react';
import { formatVerseForCopy, copyToClipboard, type VerseToCopy } from '@/lib/utils/copy-verse';
import type { Verse } from '@/lib/types';

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
  const [copied, setCopied] = useState(false);

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

  return (
    <div
      id={`verse-${verse.number}`}
      className={`p-4 rounded-lg transition-colors ${
        isSelected
          ? 'bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-300 dark:border-brand-600'
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
            <div onClick={(e) => e.stopPropagation()}>
              <BookmarkButton
                translationId={translationId}
                book={book}
                chapter={chapter}
                verse={verse.number}
              />
            </div>
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
    </div>
  );
}

