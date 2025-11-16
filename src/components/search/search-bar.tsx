"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useBibleStore } from '@/lib/store';
import { SearchService } from '@/lib/services/search-service';
import type { SearchResult } from '@/lib/services/search-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<string>('all');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { translations, current } = useBibleStore();
  const searchService = useMemo(() => new SearchService(), []);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 1) return [];
    
    const safeTranslations = Array.isArray(translations) ? translations : [];
    let searchTranslations = safeTranslations;
    if (selectedTranslation !== 'all') {
      searchTranslations = safeTranslations.filter(t => t && t.id === selectedTranslation);
    }
    
    let filteredResults = searchService.searchInTranslations(searchTranslations, query, { 
      limit: 200, // Increased limit for better results
      caseSensitive 
    });
    
    if (selectedBook !== 'all') {
      filteredResults = filteredResults.filter(r => r.book === selectedBook);
    }
    
    return filteredResults;
  }, [query, translations, selectedTranslation, selectedBook, caseSensitive, searchService]);

  const handleSelect = useCallback((result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  const books = useMemo(() => {
    const allBooks = new Set<string>();
    if (!Array.isArray(translations)) return [];
    translations.forEach(t => {
      if (t && Array.isArray(t.books)) {
        t.books.forEach(b => {
          if (b && b.name) {
            allBooks.add(b.name);
          }
        });
      }
    });
    return Array.from(allBooks).sort();
  }, [translations]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (results.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false);
          setShowFilters(false);
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            const result = results[selectedIndex];
            router.push(`/read?translation=${result.translationId}&book=${encodeURIComponent(result.book)}&chapter=${result.chapter}&verse=${result.verse}`);
            handleSelect(result);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setShowFilters(false);
          inputRef.current?.blur();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, router, handleSelect]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, results.length]);

  // Scroll selected result into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => {
            // Delay closing to allow click events to fire
            // The click-outside handler will handle closing
            setTimeout(() => {
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (!relatedTarget || (containerRef.current && !containerRef.current.contains(relatedTarget))) {
                // Don't close if clicking on a result link
                if (!relatedTarget?.closest('a')) {
                  // setIsOpen(false);
                  // setShowFilters(false);
                }
              }
            }, 150);
          }}
          placeholder="Search Bible... (e.g., love, &quot;love your neighbor&quot;, love AND peace, love OR joy)"
          className="w-full pl-10 pr-20 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600"
            title="Filters"
          >
            <Filter size={16} />
          </button>
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-lg p-4 space-y-3">
          <div className="mb-3 pb-3 border-b dark:border-neutral-700">
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Search Syntax:</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <div>• <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">love</code> - Find verses containing "love"</div>
              <div>• <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">"love your neighbor"</code> - Exact phrase match</div>
              <div>• <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">love AND peace</code> - Verses with both words</div>
              <div>• <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">love OR joy</code> - Verses with either word</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Translation</label>
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="w-full rounded-md border p-2 text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
            >
              <option value="all">All Translations</option>
              {Array.isArray(translations) ? translations.map(t => (
                t && t.id ? <option key={t.id} value={t.id}>{t.name || t.id}</option> : null
              )).filter(Boolean) : null}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Book</label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full rounded-md border p-2 text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
            >
              <option value="all">All Books</option>
              {books.map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="caseSensitive"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="caseSensitive" className="text-sm">Case sensitive</label>
          </div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-lg shadow-lg">
          <div className="px-4 py-2 border-b dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Found {results.length} {results.length === 1 ? 'verse' : 'verses'}
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              ↑↓ to navigate • Enter to select • Esc to close
            </span>
          </div>
          <div ref={resultsRef} className="max-h-[500px] overflow-y-auto">
            {results.map((result, index) => (
              <Link
                key={`${result.translationId}-${result.book}-${result.chapter}-${result.verse}-${index}`}
                href={`/read?translation=${result.translationId}&book=${encodeURIComponent(result.book)}&chapter=${result.chapter}&verse=${result.verse}`}
                onClick={() => handleSelect(result)}
                data-result-index={index}
                className={`block px-4 py-3 border-b dark:border-neutral-700 last:border-b-0 transition-colors ${
                  selectedIndex === index
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1.5">
                      {result.translationName} • {result.book} {result.chapter}:{result.verse}
                    </div>
                    <div 
                      className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: result.matchedText }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {results.length >= 200 && (
            <div className="px-4 py-2 border-t dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-xs text-neutral-500 dark:text-neutral-400 text-center">
              Showing first 200 results. Refine your search for more specific results.
            </div>
          )}
        </div>
      )}

      {isOpen && query.length >= 1 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-lg shadow-lg p-4">
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-2">
            No results found for "{query}"
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
            Try: different spelling, fewer words, or check filters
          </div>
        </div>
      )}
    </div>
  );
}

