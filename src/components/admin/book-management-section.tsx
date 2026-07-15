'use client';

import React, { useState, useEffect } from 'react';
import { TranslationGroup } from './translation-group';
import { useBibleStore } from '../../lib/store';
import type { Translation } from '../../lib/types';

interface BookManagementSectionProps {
  className?: string;
}

export function BookManagementSection({ className = '' }: BookManagementSectionProps) {
  const { 
    translations, 
    isLoading, 
    toggleBookPublicationStatus, 
    bulkUpdateBookPublicationStatus 
  } = useBibleStore();
  
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'unpublished'>('all');

  // Filter translations based on search and status
  const filteredTranslations = translations.filter(translation => {
    // Search filter
    const matchesSearch = translation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         translation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         translation.books.some(book => book.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Status filter
    if (filterStatus === 'all') return true;
    
    const hasPublishedBooks = translation.books.some(book => book.published !== false);
    const hasUnpublishedBooks = translation.books.some(book => book.published === false);
    
    if (filterStatus === 'published') return hasPublishedBooks;
    if (filterStatus === 'unpublished') return hasUnpublishedBooks;
    
    return true;
  });

  const handleToggleBookPublication = async (translationId: string, bookName: string): Promise<boolean> => {
    try {
      setError(null);
      const newStatus = await toggleBookPublicationStatus(translationId, bookName);
      return newStatus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update book publication status';
      setError(errorMessage);
      throw error;
    }
  };

  const handleBulkUpdate = async (translationId: string, updates: Array<{ bookName: string; published: boolean }>) => {
    try {
      setError(null);
      await bulkUpdateBookPublicationStatus(translationId, updates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update book publication status';
      setError(errorMessage);
      throw error;
    }
  };

  // Calculate summary statistics
  const totalTranslations = translations.length;
  const totalBooks = translations.reduce((sum, t) => sum + t.books.length, 0);
  const publishedBooks = translations.reduce((sum, t) => 
    sum + t.books.filter(book => book.published !== false).length, 0
  );
  const unpublishedBooks = totalBooks - publishedBooks;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Publication Management</h2>
            <p className="text-gray-600 mt-1">
              Control which books are visible to end users
            </p>
          </div>
          
          {/* Summary Statistics */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalTranslations}</div>
              <div className="text-gray-500">Translations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalBooks}</div>
              <div className="text-gray-500">Total Books</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{publishedBooks}</div>
              <div className="text-gray-500">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{unpublishedBooks}</div>
              <div className="text-gray-500">Unpublished</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search translations or books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'unpublished')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Translations</option>
            <option value="published">With Published Books</option>
            <option value="unpublished">With Unpublished Books</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <svg className="animate-spin w-8 h-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Loading translations...</span>
          </div>
        </div>
      )}

      {/* Translation Groups */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredTranslations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No translations found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Upload some translations to get started with book management.'
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredTranslations.map((translation) => (
              <TranslationGroup
                key={translation.id}
                translation={translation}
                onToggleBookPublication={handleToggleBookPublication}
                onBulkUpdate={handleBulkUpdate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}