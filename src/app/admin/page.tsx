"use client";
import { useState } from 'react';
import { useBibleStore } from '@/lib/store';

// Dynamic import for PDF parser (client-side only)
async function parsePDF(file: File, translationId: string, translationName: string, bookName: string) {
  const { parsePDF: parse } = await import('@/lib/pdf-parser');
  return parse(file, translationId, translationName, bookName);
}

// Force dynamic rendering to avoid server-side PDF parsing
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const { importJson, addOrUpdateVerse } = useBibleStore();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');

  const [translationId, setTranslationId] = useState('sample');
  const [translationName, setTranslationName] = useState('Sample Translation');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [text, setText] = useState('');

  const onUpload = async () => {
    if (!pdfFile) {
      alert('Please select a PDF file');
      return;
    }

    setIsParsing(true);
    setParseProgress('Extracting text from PDF...');
    
    try {
      setParseProgress('Parsing chapters and verses...');
      const translation = await parsePDF(pdfFile, translationId, translationName, book);
      
      setParseProgress('Importing translation...');
      importJson({ translations: [translation] });
      
      setParseProgress('Complete!');
      alert(`Upload complete! Found ${translation.books[0]?.chapters.length || 0} chapters.`);
      setPdfFile(null);
    } catch (error) {
      console.error('PDF parsing error:', error);
      alert(`Error parsing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Upload PDF Translation</h2>
        <p className="text-sm text-neutral-600 mt-1">Upload a PDF file containing Bible text. The system will automatically identify chapters and verses.</p>
        
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Translation ID</label>
            <input 
              className="w-full rounded-md border p-2" 
              value={translationId} 
              onChange={(e) => setTranslationId(e.target.value)} 
              placeholder="e.g., pidgin-bible"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Translation Name</label>
            <input 
              className="w-full rounded-md border p-2" 
              value={translationName} 
              onChange={(e) => setTranslationName(e.target.value)} 
              placeholder="e.g., Pidgin Bible"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Book Name</label>
            <input 
              className="w-full rounded-md border p-2" 
              value={book} 
              onChange={(e) => setBook(e.target.value)} 
              placeholder="e.g., John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PDF File</label>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} 
              className="w-full rounded-md border p-2"
              disabled={isParsing}
            />
            {pdfFile && (
              <p className="mt-1 text-xs text-neutral-600">Selected: {pdfFile.name}</p>
            )}
          </div>
          
          {parseProgress && (
            <p className="text-sm text-brand-600">{parseProgress}</p>
          )}
          
          <button 
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={onUpload}
            disabled={isParsing || !pdfFile}
          >
            {isParsing ? 'Parsing PDF...' : 'Upload & Parse PDF'}
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-neutral-50 rounded-md text-xs text-neutral-600">
          <p className="font-medium mb-1">Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure chapters are clearly marked (e.g., "Chapter 1", "1", etc.)</li>
            <li>Verses should start with verse numbers (e.g., "1 Text here" or "1: Text here")</li>
            <li>Use a single book per PDF file</li>
          </ul>
        </div>
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
