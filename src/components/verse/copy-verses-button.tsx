"use client";
import { useState } from 'react';
import { Copy, Check, Settings } from 'lucide-react';
import { formatVersesForCopy, copyToClipboard, type VerseToCopy, type CopyOptions } from '@/lib/utils/copy-verse';
import type { Verse } from '@/lib/types';

interface CopyVersesButtonProps {
  verses: Array<{
    verse: Verse;
    book: string;
    chapter: number;
  }>;
  translationName?: string;
  onCopy?: () => void;
}

export function CopyVersesButton({
  verses,
  translationName,
  onCopy,
}: CopyVersesButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<CopyOptions>({
    includeReference: true,
    includeTranslation: false,
    format: 'default',
    separator: '\n\n',
  });

  const handleCopy = async () => {
    const versesToCopy: VerseToCopy[] = verses.map(({ verse, book, chapter }) => ({
      book,
      chapter,
      verse: verse.number,
      text: verse.text,
      translationName,
    }));

    const formatted = formatVersesForCopy(versesToCopy, options);
    const success = await copyToClipboard(formatted);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } else {
      alert('Failed to copy verses. Please try again.');
    }
  };

  if (verses.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors"
        title="Copy selected verses with references"
      >
        {copied ? (
          <>
            <Check size={18} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={18} />
            <span>Copy {verses.length} {verses.length === 1 ? 'verse' : 'verses'}</span>
          </>
        )}
      </button>
      
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="absolute right-0 top-0 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        title="Copy options"
      >
        <Settings size={16} />
      </button>

      {showOptions && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 border rounded-lg shadow-lg p-4 z-50 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <select
              value={options.format}
              onChange={(e) => setOptions({ ...options, format: e.target.value as CopyOptions['format'] })}
              className="w-full rounded-md border p-2 text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
            >
              <option value="default">Default (Book Chapter:Verse - Text)</option>
              <option value="compact">Compact (Book Chapter:Verse Text)</option>
              <option value="full">Full (Book Chapter:Verse\nText)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeTranslation"
              checked={options.includeTranslation}
              onChange={(e) => setOptions({ ...options, includeTranslation: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="includeTranslation" className="text-sm">Include translation name</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeReference"
              checked={options.includeReference}
              onChange={(e) => setOptions({ ...options, includeReference: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="includeReference" className="text-sm">Include verse references</label>
          </div>

          <button
            onClick={handleCopy}
            className="w-full bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700"
          >
            Copy with Options
          </button>
        </div>
      )}
    </div>
  );
}

