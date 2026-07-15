"use client";

import { useEffect, useState } from 'react';

interface CommentaryEntryDto {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  title: string;
  body: string;
  sources?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CommentaryPanelProps {
  translationId?: string;
  book?: string;
  chapter?: number;
  verse?: number;
}

export function CommentaryPanel({ translationId, book, chapter, verse }: CommentaryPanelProps) {
  const [entries, setEntries] = useState<CommentaryEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!translationId || !book || !chapter || !verse) {
      setEntries([]);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      translationId,
      book,
      chapter: String(chapter),
      verse: String(verse),
    });

    fetch(`/api/commentary?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load commentary');
        const data = await res.json();
        setEntries(data.commentary ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [translationId, book, chapter, verse]);

  if (!translationId || !book || !chapter || !verse) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-800">
        <p className="text-sm text-neutral-500">Select a verse to view commentary.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-3 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-600 dark:text-brand-300">Commentary</p>
        <p className="text-sm text-neutral-500">{book} {chapter}:{verse}</p>
      </div>
      {loading && <p className="text-sm text-neutral-500">Loading commentary…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p className="text-sm text-neutral-500">No commentary entries found for this verse yet.</p>
      )}
      {!loading && !error && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <article key={entry.id} className="space-y-2">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{entry.title}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{entry.body}</p>
              {(entry.sources?.length || entry.tags?.length) && (
                <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                  {entry.sources?.map((source) => (
                    <span key={source} className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700/60">
                      {source}
                    </span>
                  ))}
                  {entry.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
