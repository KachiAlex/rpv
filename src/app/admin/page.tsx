"use client";
import { useState } from 'react';
import { useBibleStore } from '@/lib/store';

export default function AdminPage() {
  const { importJson, addOrUpdateVerse } = useBibleStore();
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  const [translationId, setTranslationId] = useState('sample');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [text, setText] = useState('');

  const onUpload = async () => {
    if (!jsonFile) return;
    const text = await jsonFile.text();
    try {
      const data = JSON.parse(text);
      importJson(data);
      alert('Upload complete');
    } catch {
      alert('Invalid JSON structure');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Bulk Upload Translation</h2>
        <p className="text-sm text-neutral-600 mt-1">Upload a JSON file with translations, books, chapters, and verses.</p>
        <div className="mt-4 flex items-center gap-3">
          <input type="file" accept="application/json" onChange={(e) => setJsonFile(e.target.files?.[0] ?? null)} />
          <button className="rounded-md bg-brand-600 px-4 py-2 text-white" onClick={onUpload}>Upload</button>
        </div>
        <pre className="mt-4 rounded-md bg-neutral-50 p-3 text-xs overflow-auto border">{
`{
  "translations": [
    {
      "id": "sample",
      "name": "Sample",
      "books": [{ "name": "John", "chapters": [{ "number": 3, "verses": [{ "number": 16, "text": "For God so loved the world..." }] }]}]
    }
  ]
}`}</pre>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Quick Edit Verse</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Translation ID</label>
            <input className="w-full rounded-md border p-2" value={translationId} onChange={(e) => setTranslationId(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Book</label>
            <input className="w-full rounded-md border p-2" value={book} onChange={(e) => setBook(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Chapter</label>
            <input type="number" className="w-full rounded-md border p-2" value={chapter} onChange={(e) => setChapter(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium">Verse</label>
            <input type="number" className="w-full rounded-md border p-2" value={verse} onChange={(e) => setVerse(Number(e.target.value))} />
          </div>
        </div>
        <label className="block text-sm font-medium mt-3">Text</label>
        <textarea className="w-full rounded-md border p-2 min-h-[120px]" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex gap-2">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-white" onClick={() => addOrUpdateVerse({ translationId, book, chapter, verse, text })}>Save Verse</button>
        </div>
      </section>
    </div>
  );
}


