'use client';

import { useState, useEffect } from 'react';
import { useBibleStore } from '@/lib/store';

export function PerformanceMonitor() {
  const { translations, isLoading, isLoadingContent, loadTranslationContent, loadBookContent, loadChapterContent } = useBibleStore();
  const [loadTimes, setLoadTimes] = useState<{ [key: string]: number }>({});
  const [selectedTranslation, setSelectedTranslation] = useState<string>('');

  useEffect(() => {
    // Monitor initial load time
    const startTime = performance.now();
    const checkLoaded = () => {
      if (!isLoading && translations.length > 0) {
        const endTime = performance.now();
        setLoadTimes(prev => ({ ...prev, initial: endTime - startTime }));
      }
    };
    
    const interval = setInterval(checkLoaded, 100);
    return () => clearInterval(interval);
  }, [isLoading, translations.length]);

  const handleLoadFullContent = async (translationId: string) => {
    const startTime = performance.now();
    await loadTranslationContent(translationId);
    const endTime = performance.now();
    setLoadTimes(prev => ({ ...prev, [`full_${translationId}`]: endTime - startTime }));
  };

  const handleLoadBook = async (translationId: string, bookName: string) => {
    const startTime = performance.now();
    await loadBookContent(translationId, bookName);
    const endTime = performance.now();
    setLoadTimes(prev => ({ ...prev, [`book_${translationId}_${bookName}`]: endTime - startTime }));
  };

  const handleLoadChapter = async (translationId: string, bookName: string, chapter: number) => {
    const startTime = performance.now();
    await loadChapterContent(translationId, bookName, chapter);
    const endTime = performance.now();
    setLoadTimes(prev => ({ ...prev, [`chapter_${translationId}_${bookName}_${chapter}`]: endTime - startTime }));
  };

  const getTranslationStats = (translation: any) => {
    const totalBooks = translation.books?.length || 0;
    const totalChapters = translation.books?.reduce((sum: number, book: any) => sum + (book.chapters?.length || 0), 0) || 0;
    const totalVerses = translation.books?.reduce((sum: number, book: any) => 
      sum + (book.chapters?.reduce((chSum: number, ch: any) => chSum + (ch.verses?.length || 0), 0) || 0), 0) || 0;
    const isMetadataOnly = (translation as any)._isMetadataOnly;
    
    return { totalBooks, totalChapters, totalVerses, isMetadataOnly };
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Performance Monitor</h3>
      
      {/* Load Times */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Load Times (ms)</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(loadTimes).map(([key, time]) => (
            <div key={key} className="flex justify-between">
              <span>{key}:</span>
              <span className={time < 1000 ? 'text-green-600' : time < 3000 ? 'text-yellow-600' : 'text-red-600'}>
                {time.toFixed(0)}ms
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Translation Stats */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Translation Stats</h4>
        <div className="space-y-2">
          {translations.map((translation) => {
            const stats = getTranslationStats(translation);
            return (
              <div key={translation.id} className="p-2 bg-white rounded border">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{translation.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${stats.isMetadataOnly ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {stats.isMetadataOnly ? 'Metadata Only' : 'Full Content'}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Books: {stats.totalBooks} | Chapters: {stats.totalChapters} | Verses: {stats.totalVerses}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading Controls */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Test Lazy Loading</h4>
        <select 
          value={selectedTranslation} 
          onChange={(e) => setSelectedTranslation(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">Select Translation</option>
          {translations.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        
        {selectedTranslation && (
          <div className="space-y-2">
            <button
              onClick={() => handleLoadFullContent(selectedTranslation)}
              disabled={isLoadingContent}
              className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isLoadingContent ? 'Loading...' : 'Load Full Content'}
            </button>
            
            <button
              onClick={() => handleLoadBook(selectedTranslation, 'John')}
              className="w-full p-2 bg-green-500 text-white rounded"
            >
              Load Book: John
            </button>
            
            <button
              onClick={() => handleLoadChapter(selectedTranslation, 'John', 3)}
              className="w-full p-2 bg-purple-500 text-white rounded"
            >
              Load Chapter: John 3
            </button>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="text-sm">
        <div className="flex justify-between">
          <span>Initial Loading:</span>
          <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
            {isLoading ? 'Loading...' : 'Complete'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Content Loading:</span>
          <span className={isLoadingContent ? 'text-yellow-600' : 'text-green-600'}>
            {isLoadingContent ? 'Loading...' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}