"use client";
import { useState } from 'react';
import { useBibleStore } from '@/lib/store';

// Dynamic import for document parser (client-side only)
async function parseDocument(file: File, translationId: string, translationName: string, bookName: string) {
  const { parseDocument: parse } = await import('@/lib/pdf-parser');
  return parse(file, translationId, translationName, bookName);
}

// Force dynamic rendering to avoid server-side document parsing
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const { importJson, mergeTranslation, addOrUpdateVerse } = useBibleStore();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');

  const [translationId, setTranslationId] = useState('sample');
  const [translationName, setTranslationName] = useState('Sample Translation');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [text, setText] = useState('');

  const onUpload = async () => {
    if (!documentFile) {
      alert('Please select a PDF or DOCX file');
      return;
    }

    const fileType = documentFile.name.toLowerCase().endsWith('.docx') ? 'DOCX' : 'PDF';
    setIsParsing(true);
    setParseProgress(`Extracting text from ${fileType}...`);
    
    try {
      setParseProgress('Parsing chapters and verses...');
      const translation = await parseDocument(documentFile, translationId, translationName, book);
      
      setParseProgress('Importing translation...');
      const chaptersCount = translation.books[0]?.chapters.length || 0;
      const versesCount = translation.books[0]?.chapters.reduce((sum, ch) => sum + ch.verses.length, 0) || 0;
      
      // Merge with existing translation (updates existing, adds new)
      await mergeTranslation(translation);
      
      setParseProgress('Complete!');
      alert(`Document uploaded and parsed.\n\nFound ${chaptersCount} chapter(s) with ${versesCount} verse(s).`);
      setDocumentFile(null);
    } catch (error) {
      console.error('Document parsing error:', error);
      alert(`Error parsing document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Upload Document Translation</h2>
        <p className="text-sm text-neutral-600 mt-1">Upload a PDF or DOCX file containing Bible text. The system will automatically identify chapters and verses.</p>
        
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
            <label className="block text-sm font-medium mb-1">Document File (PDF or DOCX)</label>
            <input 
              type="file" 
              accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" 
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} 
              className="w-full rounded-md border p-2"
              disabled={isParsing}
            />
            {documentFile && (
              <p className="mt-1 text-xs text-neutral-600">Selected: {documentFile.name}</p>
            )}
          </div>
          
          {parseProgress && (
            <p className="text-sm text-brand-600">{parseProgress}</p>
          )}
          
          <button 
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={onUpload}
            disabled={isParsing || !documentFile}
          >
            {isParsing ? 'Parsing Document...' : 'Upload & Parse Document'}
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-neutral-50 rounded-md text-xs text-neutral-600">
          <p className="font-medium mb-1">Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure chapters are clearly marked (e.g., "Chapter 1", "1", etc.)</li>
            <li>Verses should start with verse numbers (e.g., "1 Text here" or "1: Text here")</li>
            <li>Use a single book per file (PDF or DOCX)</li>
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
          <button 
            className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700" 
            onClick={() => {
              if (!text.trim()) {
                alert('Please enter verse text');
                return;
              }
              addOrUpdateVerse({ translationId, book, chapter, verse, text });
              alert(`Verse ${book} ${chapter}:${verse} saved successfully!`);
              setText(''); // Clear text field after saving
            }}
          >
            Save Verse
          </button>
        </div>
      </section>
    </div>
  );
}
