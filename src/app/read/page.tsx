"use client";
import { useEffect, useMemo, useState } from 'react';
import { useBibleStore } from '@/lib/store';

export default function ReadPage() {
  const { translations, current, loadSample, setReference } = useBibleStore();
  const [book, setBook] = useState<string>('');
  const [chapter, setChapter] = useState<number>(1);
  const [verse, setVerse] = useState<number>(1);

  useEffect(() => {
    loadSample();
  }, [loadSample]);

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
        <div className="text-sm text-neutral-500 mb-4">{current?.name} • {book || '—'} {chapter}</div>
        
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
                <div className="text-sm font-semibold text-brand-700 mb-2">
                  {book} {chapter}:{v.number}
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


