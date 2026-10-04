'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import R2PdfViewer from '@/components/pdf-viewer/R2PdfViewer';
import InAppPdfViewer from '@/components/pdf-viewer/InAppPdfViewer';
import { logBookView } from '@/lib/pdf-access-logger';
import { useAuth } from '@/lib/hooks/use-auth';
import { getAuthToken } from '@/lib/client-auth';
import { getApiUrl } from '@/lib/api-config';
import { canReadBook } from '@/lib/book-access';
import { getReadingProgress, setReadingProgress } from '@/lib/reading-progress';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  pageCount: number;
  uploadedAt: any;
  accessLevel?: 'public' | 'restricted';
  allowedUserIds?: string[];
  allowedUserEmails?: string[];
}

export default function BookViewerClient() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (params?.id) loadBook();
  }, [params?.id, authLoading, user]);

  const loadBook = async () => {
    try {
      setLoading(true);
      setError('');
      const bookId = params?.id as string;
      if (!bookId) return;

      const token = await getAuthToken();
      const res = await fetch(getApiUrl(`/api/books/${bookId}/`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 404) {
        setError('Book not found');
        return;
      }
      if (res.status === 403) {
        setError('You do not have access to this book');
        return;
      }
      if (!res.ok) {
        setError('Failed to load book');
        return;
      }

      const data = await res.json();
      const bookData = data.book as Book;

      if (!canReadBook(bookData, { userId: user?.uid, userEmail: user?.email })) {
        setError('You do not have access to this book');
        return;
      }

      setBook(bookData);
      if (user?.email) await logBookView(bookId, bookData.title);
    } catch (err) {
      console.error('Error loading book:', err);
      setError('Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <p className="text-sm text-gray-500">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-sm w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-700 mb-2">Access Denied</h1>
          <p className="text-sm text-red-600 mb-5">{error}</p>
          <button
            onClick={() => router.push('/books')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Books
          </button>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <p className="text-gray-500">Book not found</p>
      </div>
    );
  }

  const progress = getReadingProgress(book.id);
  const initialPage = progress?.page || 1;

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Book Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <button
            onClick={() => router.push('/books')}
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium mb-2 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Books
          </button>
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-brand-600 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{book.title}</h1>
              {book.author && <p className="text-sm text-gray-500">By {book.author}</p>}
            </div>
          </div>
          {progress && (
            <p className="text-xs text-brand-600 mt-1.5 font-medium">
              Resuming from page {progress.page}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {book.pageCount > 0 ? (
          <R2PdfViewer
            bookId={book.id}
            pageCount={book.pageCount}
            initialPage={initialPage}
            onPageChange={(page) => setReadingProgress(book.id, page)}
          />
        ) : (
          <InAppPdfViewer bookId={book.id} title={book.title} />
        )}
      </div>
    </div>
  );
}
