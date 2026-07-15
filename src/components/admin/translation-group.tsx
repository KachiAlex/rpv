'use client';

import React, { useState } from 'react';
import { BookCard } from './book-card';
import type { Translation } from '../../lib/types';

interface TranslationGroupProps {
  translation: Translation;
  onToggleBookPublication: (translationId: string, bookName: string) => Promise<boolean>;
  onBulkUpdate?: (translationId: string, updates: Array<{ bookName: string; published: boolean }>) => Promise<void>;
  className?: string;
}

export function TranslationGroup({ 
  translation, 
  onToggleBookPublication,
  onBulkUpdate,
  className = '' 
}: TranslationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const books = translation.books || [];
  const publishedCount = books.filter(book => book.published !== false).length;
  const totalCount = books.length;
  const allPublished = publishedCount === totalCount;
  const nonePublished = publishedCount === 0;

  const handleToggleBook = async (bookName: string) => {
    return await onToggleBookPublication(translation.id, bookName);
  };

  const handleBulkPublish = async () => {
    if (!onBulkUpdate || isProcessingBulk) return;

    setIsProcessingBulk(true);
    try {
      const updates = books.map(book => ({
        bookName: book.name,
        published: true
      }));
      await onBulkUpdate(translation.id, updates);
    } catch (error) {
      console.error('Error in bulk publish:', error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (!onBulkUpdate || isProcessingBulk) return;

    setIsProcessingBulk(true);
    try {
      const updates = books.map(book => ({
        bookName: book.name,
        published: false
      }));
      await onBulkUpdate(translation.id, updates);
    } catch (error) {
      console.error('Error in bulk unpublish:', error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {/* Translation Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-gray-700"
            >
              <svg 
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{translation.name}</span>
            </button>
            
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <span className="bg-white px-2 py-1 rounded border">
                {totalCount} {totalCount === 1 ? 'book' : 'books'}
              </span>
              <span className={`px-2 py-1 rounded border ${
                publishedCount === totalCount 
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : publishedCount === 0
                  ? 'bg-gray-100 text-gray-600 border-gray-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}>
                {publishedCount} published
              </span>
            </div>
          </div>

          {/* Bulk Actions */}
          {onBulkUpdate && totalCount > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkPublish}
                disabled={allPublished || isProcessingBulk}
                className={`
                  px-3 py-1 text-sm rounded border transition-colors
                  ${allPublished || isProcessingBulk
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                  }
                `}
              >
                {isProcessingBulk ? 'Processing...' : 'Publish All'}
              </button>
              <button
                onClick={handleBulkUnpublish}
                disabled={nonePublished || isProcessingBulk}
                className={`
                  px-3 py-1 text-sm rounded border transition-colors
                  ${nonePublished || isProcessingBulk
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                  }
                `}
              >
                {isProcessingBulk ? 'Processing...' : 'Unpublish All'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Books Grid */}
      {isExpanded && (
        <div className="p-6">
          {books.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p>No books found in this translation</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.name}
                  book={book}
                  translationId={translation.id}
                  onTogglePublication={handleToggleBook}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}