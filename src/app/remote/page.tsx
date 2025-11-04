"use client";
import { useEffect, useState } from 'react';
import { useBibleStore } from '@/lib/store';

export default function RemotePage() {
  const { translations, current, loadSample, loadTranslations, setCurrent, sendToProjector, setChannelId } = useBibleStore();
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [channel, setChannel] = useState('default');

  useEffect(() => {
    loadTranslations().catch(() => {
      loadSample();
    });
    setChannelId(channel);
  }, [channel]);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold">Remote Controller</h1>
      <p className="text-sm text-neutral-600">Select a reference and push to projector.</p>

      <div className="mt-4 grid gap-3">
        <div>
          <label className="text-sm font-medium">Channel</label>
          <input className="w-full rounded-md border p-2" value={channel} onChange={(e) => setChannel(e.target.value)} />
        </div>
        <label className="text-sm font-medium">Translation</label>
        <select className="rounded-md border p-2" value={current?.id ?? ''} onChange={(e) => setCurrent(e.target.value)}>
          {translations.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <div className="grid grid-cols-3 gap-3">
          <input className="rounded-md border p-2" value={book} onChange={(e) => setBook(e.target.value)} />
          <input type="number" className="rounded-md border p-2" value={chapter} onChange={(e) => setChapter(Number(e.target.value))} />
          <input type="number" className="rounded-md border p-2" value={verse} onChange={(e) => setVerse(Number(e.target.value))} />
        </div>

        <button className="rounded-md bg-brand-600 px-4 py-2 text-white" onClick={async () => {
          try {
            await sendToProjector({ book, chapter, verse });
          } catch (error) {
            alert(`Error sending to projector: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}>Send to Projector</button>
      </div>
    </div>
  );
}


