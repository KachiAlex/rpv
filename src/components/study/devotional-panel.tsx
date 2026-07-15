"use client";

import { useEffect, useState } from 'react';

interface DevotionalEntryDto {
  id: string;
  date: string;
  title: string;
  summary: string;
  body: string;
  scriptures: Array<{
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
  }>;
  reflectionQuestions?: string[];
  prayerFocus?: string;
  createdAt: string;
  updatedAt: string;
}

export function DevotionalPanel() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entry, setEntry] = useState<DevotionalEntryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);

    fetch(`/api/devotionals?date=${date}`)
      .then(async (res) => {
        if (res.status === 404) {
          setEntry(null);
          return;
        }

        if (!res.ok) {
          throw new Error('Unable to load devotional');
        }

        const data = await res.json();
        setEntry(data.devotional ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent-pink">Devotional</p>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Daily Focus</h3>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-neutral-300 dark:border-neutral-600 bg-transparent px-2 py-1 text-sm"
        />
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading devotional…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && !entry && (
        <p className="text-sm text-neutral-500">No devotional for this date yet.</p>
      )}

      {entry && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{entry.title}</p>
            <p className="text-xs text-neutral-500">{entry.summary}</p>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{entry.body}</p>

          <div className="text-xs text-neutral-500 space-y-1">
            <p className="font-semibold text-neutral-700 dark:text-neutral-200">Scriptures</p>
            <div className="flex flex-wrap gap-2">
              {entry.scriptures.map((ref) => (
                <span key={`${ref.book}-${ref.chapter}-${ref.verseStart}`} className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700/60">
                  {ref.book} {ref.chapter}:{ref.verseStart}
                  {ref.verseEnd ? `-${ref.verseEnd}` : ''}
                </span>
              ))}
            </div>
          </div>

          {entry.reflectionQuestions && entry.reflectionQuestions.length > 0 && (
            <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
              <p className="font-semibold text-neutral-800 dark:text-neutral-100">Reflection</p>
              <ul className="list-disc pl-5 space-y-1">
                {entry.reflectionQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          )}

          {entry.prayerFocus && (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              <p className="font-semibold text-neutral-800 dark:text-neutral-100">Prayer Focus</p>
              <p>{entry.prayerFocus}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
