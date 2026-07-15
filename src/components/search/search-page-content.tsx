"use client";
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBibleStore } from '@/lib/store';
import { SearchService, type SearchResult } from '@/lib/services/search-service';
import { Search, Filter, ArrowLeft, Book, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatTranslationName } from '@/lib/utils/translation-formatter';

// Bible book classification
const OLD_TESTAMENT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
  'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
  'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

const NEW_TESTAMENT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

interface SearchFilters {
  testament: 'all' | 'old' | 'new';
  book: string;
  searchMode: 'keywords' | 'phrases' | 'exact';
  sortBy: 'relevance' | 'book-order' | 'alphabetical';
}

export default function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { translations, current, loadTranslations, setCurrent, getTranslationsForEndUsers } = useBibleStore();
  const searchService = new SearchService();

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    testament: 'all',
    book: '',
    searchMode: 'keywords',
    sortBy: 'relevance'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const resultsPerPage = 20;

  // Get filtered translations for end users (only published books)
  const endUserTranslations = getTranslationsForEndUsers();

  // Initialize from URL parameters
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlTranslation = searchParams.get('translation') || '';
    const urlTestament = searchParams.get('testament') as 'all' | 'old' | 'new' || 'all';
    const urlBook = searchParams.get('book') || '';
    const urlMode = searchParams.get('mode') as 'keywords' | 'phrases' | 'exact' || 'keywords';

    setQuery(urlQuery);
    setFilters(prev => ({
      ...prev,
      testament: urlTestament,
      book: urlBook,
      searchMode: urlMode
    }));

    // Set translation if specified and it exists in end user translations
    if (urlTranslation && endUserTranslations.some(t => t.id === urlTranslation)) {
      if (current?.id !== urlTranslation) {
        setCurrent(urlTranslation);
      }
    } else if (!current && endUserTranslations.length > 0) {
      // Set first available translation if none is selected
      setCurrent(endUserTranslations[0].id);
    }

    // Perform search if query exists
    if (urlQuery.trim()) {
      performSearch(urlQuery, {
        testament: urlTestament,
        book: urlBook,
        searchMode: urlMode,
        sortBy: 'relevance'
      });
    }
  }, [searchParams, current?.id, setCurrent, endUserTranslations]);

  
  // Load translations
  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  // Get available books based on current translation
  const availableBooks = useMemo(() => {
    if (!current?.books) return [];
    // Only show published books in the filter
    return current.books.filter(book => book.published !== false).map(book => book.name).sort();
  }, [current?.books]);

  // Filter books by testament
  const filteredBooks = useMemo(() => {
    if (filters.testament === 'old') {
      return availableBooks.filter(book => OLD_TESTAMENT_BOOKS.includes(book));
    } else if (filters.testament === 'new') {
      return availableBooks.filter(book => NEW_TESTAMENT_BOOKS.includes(book));
    }
    return availableBooks;
  }, [availableBooks, filters.testament]);

  // Perform search with filters
  const performSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) return;
    
    // Ensure we have a valid current translation from end user translations
    const searchTranslation = current && endUserTranslations.find(t => t.id === current.id) 
      ? current 
      : endUserTranslations[0];
      
    if (!searchTranslation) {
      console.warn('[SearchPage] No valid translation available for search');
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('[SearchPage] Searching in translation:', searchTranslation.name, 'for query:', searchQuery);
      
      // Use OPTIMIZED search with lazy loading for better performance
      let searchResults = await searchService.searchInTranslationsOptimized(
        [searchTranslation],
        searchQuery,
        {
          limit: 1000,
          includeContext: true,
          caseSensitive: false,
          searchType: searchFilters.searchMode
        }
      );

      // Apply testament filter
      if (searchFilters.testament !== 'all') {
        const testamentBooks = searchFilters.testament === 'old' ? OLD_TESTAMENT_BOOKS : NEW_TESTAMENT_BOOKS;
        searchResults = searchResults.filter(result => testamentBooks.includes(result.book));
      }

      // Apply book filter
      if (searchFilters.book) {
        searchResults = searchResults.filter(result => result.book === searchFilters.book);
      }

      // Apply sorting
      if (searchFilters.sortBy === 'book-order') {
        const bookOrder = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];
        searchResults.sort((a, b) => {
          const aIndex = bookOrder.indexOf(a.book);
          const bIndex = bookOrder.indexOf(b.book);
          if (aIndex !== bIndex) return aIndex - bIndex;
          if (a.chapter !== b.chapter) return a.chapter - b.chapter;
          return a.verse - b.verse;
        });
      } else if (searchFilters.sortBy === 'alphabetical') {
        searchResults.sort((a, b) => {
          if (a.book !== b.book) return a.book.localeCompare(b.book);
          if (a.chapter !== b.chapter) return a.chapter - b.chapter;
          return a.verse - b.verse;
        });
      }
      // 'relevance' is already sorted by SearchService

      setResults(searchResults);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Update URL with search parameters
    const params = new URLSearchParams({
      q: query.trim(),
      translation: current?.id || '',
      testament: filters.testament,
      book: filters.book,
      mode: filters.searchMode
    });

    router.push(`/search?${params.toString()}`);
    performSearch(query.trim(), filters);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // If we have a query, re-search with new filters
    if (query.trim()) {
      performSearch(query.trim(), updatedFilters);
    }
  };

  // Navigate to verse in read page
  const navigateToVerse = (result: SearchResult) => {
    const params = new URLSearchParams({
      translation: result.translationId,
      book: encodeURIComponent(result.book),
      chapter: result.chapter.toString(),
      verse: result.verse.toString(),
      highlight: query.trim()
    });
    router.push(`/read?${params.toString()}`);
  };

  // Paginated results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    return results.slice(startIndex, startIndex + resultsPerPage);
  }, [results, currentPage, resultsPerPage]);

  const totalPages = Math.ceil(results.length / resultsPerPage);

  return (
    <div className="rpv-page-padding">
      <div className="rpv-read-layout">
        {/* Sidebar with search form and filters */}
        <aside className="rpv-read-sidebar rpv-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="rpv-serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy-900)' }}>RPV</div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--rpv-ink-faint)', marginTop: 4 }}>Bible Search</p>
          </div>

          <Link
            href="/"
            className="rpv-chip"
            style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Search Query</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter keywords, phrases, or verses..."
                className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] focus:border-[var(--navy-800)] focus:outline-none"
              />
            </div>

            {/* Translation Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Translation</label>
              <select
                value={current?.id || ''}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] focus:border-[var(--navy-800)] focus:outline-none"
              >
                {endUserTranslations.map((translation) => (
                  <option key={translation.id} value={translation.id}>
                    {formatTranslationName(translation)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="rpv-btn-red w-full"
              style={{ justifyContent: 'center' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Search size={14} />
                {loading ? 'Searching...' : 'Search'}
              </span>
            </button>
          </form>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rpv-chip"
            style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
          >
            <Filter size={14} />
            <span>Advanced Filters</span>
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-3" style={{ marginTop: 16, borderTop: '1px solid var(--rpv-border)', paddingTop: 16 }}>
              {/* Testament Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-2">Testament</label>
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'All Books' },
                    { value: 'old', label: 'Old Testament' },
                    { value: 'new', label: 'New Testament' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-xs text-[var(--rpv-ink-soft)]">
                      <input
                        type="radio"
                        name="testament"
                        value={option.value}
                        checked={filters.testament === option.value}
                        onChange={(e) => handleFilterChange({ testament: e.target.value as any })}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Book Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Specific Book</label>
                <select
                  value={filters.book}
                  onChange={(e) => handleFilterChange({ book: e.target.value })}
                  className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] focus:border-[var(--navy-800)] focus:outline-none"
                >
                  <option value="">All Books</option>
                  {filteredBooks.map((book) => (
                    <option key={book} value={book}>
                      {book}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Mode */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Search Mode</label>
                <select
                  value={filters.searchMode}
                  onChange={(e) => handleFilterChange({ searchMode: e.target.value as any })}
                  className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] focus:border-[var(--navy-800)] focus:outline-none"
                >
                  <option value="keywords">Keywords</option>
                  <option value="phrases">Phrases</option>
                  <option value="exact">Exact Match</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--rpv-ink-soft)] mb-1.5">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                  className="w-full rounded-lg border border-[var(--rpv-border)] bg-white px-3 py-2.5 text-sm text-[var(--rpv-ink)] focus:border-[var(--navy-800)] focus:outline-none"
                >
                  <option value="relevance">Relevance</option>
                  <option value="book-order">Book Order</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          )}
        </aside>

        {/* Main content area */}
        <section className="rpv-scripture">
          <div className="rpv-scripture-head">
            <div className="rpv-scripture-ref">
              Search Results
            </div>
            {query && (
              <div style={{ fontSize: 13, color: 'var(--rpv-ink-faint)' }}>
                {loading ? 'Searching...' : `${results.length} results for "${query}"`}
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {(filters.testament !== 'all' || filters.book || filters.searchMode !== 'keywords') && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {filters.testament !== 'all' && (
                <span className="rpv-chip" style={{ background: 'var(--red-50)', color: 'var(--red-700)', border: '1px solid var(--red-200)' }}>
                  <Book size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {filters.testament === 'old' ? 'Old Testament' : 'New Testament'}
                </span>
              )}
              {filters.book && (
                <span className="rpv-chip" style={{ background: 'var(--red-50)', color: 'var(--red-700)', border: '1px solid var(--red-200)' }}>
                  <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {filters.book}
                </span>
              )}
              {filters.searchMode !== 'keywords' && (
                <span className="rpv-chip" style={{ background: 'var(--red-50)', color: 'var(--red-700)', border: '1px solid var(--red-200)' }}>
                  <Search size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {filters.searchMode === 'phrases' ? 'Phrase Search' : 'Exact Match'}
                </span>
              )}
            </div>
          )}

          {/* Search Results */}
          {loading ? (
            <div className="rpv-card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ color: 'var(--rpv-ink-faint)' }}>Searching...</div>
            </div>
          ) : results.length === 0 && query ? (
            <div className="rpv-card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 16, color: 'var(--rpv-ink-soft)', marginBottom: 16 }}>No results found for "{query}"</div>
              <div style={{ fontSize: 13, color: 'var(--rpv-ink-faint)', marginBottom: 8 }}>
                Try adjusting your search terms or filters, or search for:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {['love', 'peace', 'faith', 'hope', 'joy'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion, filters);
                    }}
                    className="rpv-chip"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Results List */}
              <div className="rpv-results">
                {paginatedResults.map((result, index) => (
                  <div
                    key={`${result.book}-${result.chapter}-${result.verse}-${index}`}
                    className="rpv-result-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigateToVerse(result)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="rpv-result-ref">
                        {result.book} {result.chapter}:{result.verse}
                      </div>
                      <div className="rpv-result-meta">
                        {result.translationName}
                      </div>
                    </div>
                    <div
                      className="rpv-result-text"
                      dangerouslySetInnerHTML={{ __html: result.matchedText }}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="rpv-card" style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, color: 'var(--rpv-ink-faint)' }}>
                    Showing {((currentPage - 1) * resultsPerPage) + 1} to {Math.min(currentPage * resultsPerPage, results.length)} of {results.length} results
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="rpv-btn-outline-navy"
                      style={{ fontSize: 13 }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--rpv-ink-faint)' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="rpv-btn-outline-navy"
                      style={{ fontSize: 13 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : !query ? (
            <div className="rpv-card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 16, color: 'var(--rpv-ink-soft)', marginBottom: 16 }}>Enter a search query to find verses</div>
              <div style={{ fontSize: 13, color: 'var(--rpv-ink-faint)' }}>
                Search for keywords, phrases, or specific verses across the Bible
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}