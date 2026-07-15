"use client";
import { Suspense } from 'react';
import ReadPageContent from './read-page-content';

export default function ReadPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading Bible reader...</p>
        </div>
      </div>
    }>
      <ReadPageContent />
    </Suspense>
  );
}