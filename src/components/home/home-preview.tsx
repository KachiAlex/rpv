"use client";
import { useEffect, useMemo, useState } from 'react';
import { useBibleStore } from '@/lib/store';
import { VerseCard } from '@/components/verse/verse-card';

export function HomePreview() {
  const { translations, current, loadTranslations, loadSample, setCurrent } = useBibleStore();
  const [book, setBook] = useState<string>('');
  const [chapter, setChapter] = useState<number>(1);
  const [verse, setVerse] = useState<number>(1);

  useEffect(() => {
    loadTranslations().catch(() => loadSample());
  }, [loadTranslations, loadSample]);

  // Choose a sensible default reference when data is present
  useEffect(() => {
    if (!current) return;
    const john = current.books.find(b => b.name === 'John');
    if (john) {
      const ch3 = john.chapters.find(c => c.number === 3);
      if (ch3 && ch3.verses.find(v => v.number === 16)) {
        setBook('John');
        setChapter(3);
        setVerse(16);
        return;
      }
    }
    const firstBook = current.books[0];
    if (firstBook) {
      setBook(firstBook.name);
      const firstChapter = firstBook.chapters[0];
      if (firstChapter) {
        setChapter(firstChapter.number);
        const firstVerse = firstChapter.verses[0];
        if (firstVerse) setVerse(firstVerse.number);
      }
    }
  }, [current]);

  const verseObj = useMemo(() => {
    if (!current || !book) return null;
    const b = current.books.find(bk => bk.name === book);
    const c = b?.chapters.find(ch => ch.number === chapter);
    const v = c?.verses.find(vv => vv.number === verse) ?? c?.verses[0];
    return v ?? null;
  }, [current, book, chapter, verse]);

  if (!current) {
    return (
      <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-100 to-brand-300 animate-pulse" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="rounded-md border p-1 text-sm"
          value={current.id}
          onChange={(e) => setCurrent(e.target.value)}
        >
          {translations.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select className="rounded-md border p-1 text-sm" value={book} onChange={(e) => setBook(e.target.value)}>
          {current.books.map(b => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
        <select className="rounded-md border p-1 text-sm" value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
          {current.books.find(b => b.name === book)?.chapters.map(c => (
            <option key={c.number} value={c.number}>{c.number}</option>
          ))}
        </select>
        <select className="rounded-md border p-1 text-sm" value={verse} onChange={(e) => setVerse(Number(e.target.value))}>
          {current.books.find(b => b.name === book)?.chapters.find(c => c.number === chapter)?.verses.map(v => (
            <option key={v.number} value={v.number}>{v.number}</option>
          ))}
        </select>
      </div>
      <div className="aspect-video rounded-lg border bg-white p-4 overflow-auto">
        {verseObj && (
          <VerseCard
            verse={verseObj}
            book={book}
            chapter={chapter}
            isSelected={true}
            translationName={current.name}
            translationId={current.id}
          />
        )}
      </div>
    </div>
  );
}


