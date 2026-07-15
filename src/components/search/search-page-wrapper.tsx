"use client";
import { Suspense } from 'react';
import SearchPageContent from './search-page-content';

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading search results...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}