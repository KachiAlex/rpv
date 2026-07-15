'use client';

import React from 'react';
import { BookPublicationStatusBadge } from './book-publication-status-badge';
import { BookPublishToggleButton } from './book-publish-toggle-button';
import type { Book } from '../../lib/types';

interface BookCardProps {
  book: Book;
  translationId: string;
  onTogglePublication: (bookName: string) => Promise<boolean>;
  className?: string;
}

export function BookCard({ 
  book, 
  translationId, 
  onTogglePublication,
  className = '' 
}: BookCardProps) {
  const chapterCount = book.chapters?.length || 0;
  const verseCount = book.chapters?.reduce((sum, chapter) => sum + (chapter.verses?.length || 0), 0) || 0;
  const published = book.published !== false; // Default to true if undefined

  const handleToggle = async () => {
    return await onTogglePublication(book.name);
  };

  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow
      ${className}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {book.name}
          </h3>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {verseCount} {verseCount === 1 ? 'verse' : 'verses'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 ml-4">
          <BookPublicationStatusBadge 
            published={published} 
            size="sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Translation: {translationId}
        </div>
        
        <BookPublishToggleButton
          published={published}
          onToggle={handleToggle}
          size="sm"
        />
      </div>
    </div>
  );
}