"use client";
import { useState, useMemo, useEffect } from 'react';
import { useBibleStore } from '@/lib/store';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { BookManagementSection } from '@/components/admin/book-management-section';
import { BlogManagementSection } from '@/components/admin/blog-management-section';
import { FeaturedHighlightsSection } from '@/components/admin/featured-highlights-section';
import { BannerManagementSection } from '@/components/admin/banner-management-section';

// Dynamic import for document parser (client-side only)
async function parseDocument(file: File, translationId: string, translationName: string, bookName: string) {
  const { parseDocument: parse } = await import('@/lib/pdf-parser');
  return parse(file, translationId, translationName, bookName);
}

// Force dynamic rendering to avoid server-side document parsing
export const dynamic = 'force-dynamic';

type AdminTab = 'upload' | 'manage' | 'highlights' | 'blog' | 'banner';

function AdminPageContent() {
  const { importJson, mergeTranslation, addOrUpdateVerse, loadTranslations } = useBibleStore();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('upload');

  const tabOptions = useMemo(
    () => [
      { id: 'upload', label: 'Upload & Edit', description: 'Import translations or make quick edits' },
      { id: 'manage', label: 'Manage Publications', description: 'Control published books and metadata' },
      { id: 'highlights', label: 'Featured Highlights', description: 'Curate the featured homepage content' },
      { id: 'blog', label: 'Blog Management', description: 'Publish and schedule blog articles' },
      { id: 'banner', label: 'Banner Settings', description: 'Update the homepage announcement banner' }
    ] satisfies { id: AdminTab; label: string; description: string }[],
    []
  );

  const [translationId, setTranslationId] = useState('RPV');
  const [translationName, setTranslationName] = useState('Redemption Project Version');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [text, setText] = useState('');

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

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
      setParseProgress('Saving to Firestore...');
      await mergeTranslation(translation);
      
      setParseProgress('Complete!');
      alert(`Document uploaded and parsed successfully!\n\nFound ${chaptersCount} chapter(s) with ${versesCount} verse(s).\n\nTranslation saved to Firestore and will persist after refresh.`);
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
    <div className="space-y-6" role="region" aria-live="polite">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 pb-3">
        <nav
          className="-mb-px flex flex-wrap items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent lg:flex-nowrap"
          role="tablist"
          aria-label="Admin sections"
        >
          {tabOptions.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`admin-tab-${tab.id}`}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
        <p className="mt-2 text-xs text-neutral-500 sm:hidden">
          {tabOptions.find((tab) => tab.id === activeTab)?.description}
        </p>
      </div>

      {/* Tab Content */}
      <div
        id={`admin-tab-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`admin-tab-trigger-${activeTab}`}
        className="space-y-6"
      >
        {activeTab === 'upload' && (
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
                <li>Ensure chapters are clearly marked (e.g., &ldquo;Chapter 1&rdquo;, &ldquo;1&rdquo;, etc.)</li>
                <li>Verses should start with verse numbers (e.g., &ldquo;1 Text here&rdquo; or &ldquo;1: Text here&rdquo;)</li>
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
        )}

        {activeTab === 'manage' && (
          <BookManagementSection />
        )}

        {activeTab === 'highlights' && (
          <FeaturedHighlightsSection />
        )}

        {activeTab === 'blog' && (
          <BlogManagementSection />
        )}

        {activeTab === 'banner' && (
          <BannerManagementSection />
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminPageContent />
    </ProtectedRoute>
  );
}
