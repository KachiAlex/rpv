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

  const text = useMemo(() => {
    const b = books.find(b => b.name === book);
    const c = b?.chapters.find((c) => c.number === chapter);
    const v = c?.verses.find((v) => v.number === verse);
    return v?.text ?? '';
  }, [books, book, chapter, verse]);

  useEffect(() => {
    if (book && chapter && verse) setReference({ book, chapter, verse });
  }, [book, chapter, verse, setReference]);

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
              <label className="block text-sm font-medium">Verse</label>
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
        <div className="text-sm text-neutral-500">{current?.name} • {book || '—'} {chapter}:{verse}</div>
        <div className="mt-3 text-2xl leading-relaxed">{text || 'Choose a book, chapter, and verse.'}</div>
      </section>
    </div>
  );
}


