'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import BookUpload from '@/components/admin/BookUpload';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { getAuthToken } from '@/lib/client-auth';
import { getApiUrl } from '@/lib/api-config';
import { canReadBook } from '@/lib/book-access';
import { getReadingProgress } from '@/lib/reading-progress';
import { Search, BookOpen, Upload, X, Lock, ChevronRight } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  pageCount: number;
  price: number;
  uploadedAt: any;
  accessLevel?: 'public' | 'restricted';
}

function BookSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mt-3" />
    </div>
  );
}

export default function BooksClient() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const visibleBooks = useMemo(() => {
    return books.filter((book: Book) =>
      isAdmin || canReadBook(book, { userId: user?.uid, userEmail: user?.email })
    );
  }, [books, isAdmin, user]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleBooks;
    return visibleBooks.filter((book) =>
      book.title.toLowerCase().includes(q) ||
      (book.author?.toLowerCase() || '').includes(q) ||
      (book.description?.toLowerCase() || '').includes(q)
    );
  }, [visibleBooks, searchQuery]);

  const apiFetch = useCallback(async (path: string) => {
    const token = await getAuthToken();
    const res = await fetch(getApiUrl(path), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, []);

  const loadBooks = useCallback(async () => {
    try {
      const data = await apiFetch('/api/books/');
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const data = await apiFetch('/api/me/');
        setIsAdmin(data.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user, apiFetch]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadBooks();
  };

  const clearSearch = () => setSearchQuery('');

  if (loading || authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <BookSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={28} className="text-brand-600" />
            Books
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {visibleBooks.length} book{visibleBooks.length !== 1 ? 's' : ''} available
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors"
          >
            {showUpload ? <X size={16} /> : <Upload size={16} />}
            {showUpload ? 'Close Upload' : 'Upload New Book'}
          </button>
        )}
      </div>

      {/* Upload Panel */}
      {showUpload && isAdmin && (
        <div className="mb-8 animate-fade-in">
          <BookUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or description..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => {
          const progress = getReadingProgress(book.id);
          return (
            <div
              key={book.id}
              onClick={() => router.push(`/books/${book.id}`)}
              className="group bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2">
                  {book.title}
                </h2>
                {book.accessLevel === 'restricted' && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-100">
                    <Lock size={10} /> Restricted
                  </span>
                )}
              </div>
              {book.author && (
                <p className="text-sm text-gray-600 mb-2">By {book.author}</p>
              )}
              {book.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{book.description}</p>
              )}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">
                    {book.pageCount} pages
                  </span>
                  <span className={`text-xs font-bold ${book.price === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                    {book.price === 0 ? 'Free' : `$${book.price.toFixed(2)}`}
                  </span>
                </div>
                {progress ? (
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                    Page {progress.page}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-brand-600 transition-colors">
                    Read <ChevronRight size={12} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {searchQuery
              ? 'No books match your search.'
              : visibleBooks.length === 0
                ? 'No books available yet.'
                : 'No books are currently available for your account.'}
          </p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
