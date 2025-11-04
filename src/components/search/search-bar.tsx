"use client";
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useBibleStore } from '@/lib/store';
import { SearchService } from '@/lib/services/search-service';
import type { SearchResult } from '@/lib/services/search-service';
import Link from 'next/link';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { translations } = useBibleStore();
  const searchService = useMemo(() => new SearchService(), []);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    return searchService.searchInTranslations(translations, query, { limit: 10 });
  }, [query, translations, searchService]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search Bible..."
          className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <Link
              key={index}
              href={`/read?translation=${result.translationId}&book=${result.book}&chapter=${result.chapter}&verse=${result.verse}`}
              onClick={() => handleSelect(result)}
              className="block px-4 py-3 hover:bg-neutral-50 border-b last:border-b-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-neutral-500 mb-1">
                    {result.translationName} • {result.book} {result.chapter}:{result.verse}
                  </div>
                  <div 
                    className="text-sm text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: result.matchedText }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg p-4 text-center text-sm text-neutral-500">
          No results found
        </div>
      )}
    </div>
  );
}

