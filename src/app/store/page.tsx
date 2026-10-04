"use client";
import { useEffect, useState, useCallback } from 'react';
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { ShoppingBag, BookOpen, CheckCircle, Loader2, Lock, ArrowLeft, CreditCard } from 'lucide-react';
import { getAuthToken } from '@/lib/client-auth';
import { getApiUrl } from '@/lib/api-config';
import { useRouter } from 'next/navigation';

interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  pageCount: number;
  price: number;
  accessLevel?: 'public' | 'restricted';
  uploadedAt: string;
}

export default function StorePage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [checkoutBook, setCheckoutBook] = useState<Book | null>(null);
  const [processing, setProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    const token = await getAuthToken();
    const res = await fetch(getApiUrl(path), {
      ...options,
      headers: {
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [booksData, purchasesData] = await Promise.all([
          apiFetch('/api/books/'),
          apiFetch('/api/books/purchase/'),
        ]);
        setBooks(booksData.books || []);
        const purchased = new Set<string>(
          (purchasesData.purchases || []).map((p: { bookId: string }) => p.bookId)
        );
        setPurchasedIds(purchased);
      } catch (err) {
        console.error('Error loading store data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [apiFetch]);

  const handlePurchase = async (book: Book) => {
    setCheckoutBook(book);
    if (book.price === 0) {
      await processPurchase(book, 'free');
    }
  };

  const processPurchase = async (book: Book, paymentMethod: string) => {
    setProcessing(true);
    setError('');
    try {
      const data = await apiFetch('/api/books/purchase/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, paymentMethod }),
      });
      if (data.success) {
        setPurchasedIds((prev) => new Set(prev).add(book.id));
        setPurchaseSuccess(data.message || 'Purchase successful!');
        setTimeout(() => {
          setCheckoutBook(null);
          setPurchaseSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <PageWrap>
        <ContentWrap>
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-600" />
          </div>
        </ContentWrap>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <ShoppingBag className="h-7 w-7 text-brand-600" />
              <h1 className="text-3xl font-bold text-gray-900">Book Store</h1>
            </div>
            <p className="text-gray-600">
              Christian books and resources for your spiritual journey
            </p>
          </div>

          {/* Books Grid */}
          {books.length === 0 ? (
            <CardWrap>
              <div className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No books available yet.</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon for new releases!</p>
              </div>
            </CardWrap>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => {
                const isPurchased = purchasedIds.has(book.id);
                const isFree = book.price === 0;
                return (
                  <CardWrap key={book.id} className="flex flex-col">
                    <div className="p-5 flex flex-col flex-1">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                        {book.title}
                      </h3>

                      {/* Author */}
                      {book.author && (
                        <p className="text-sm text-gray-600 mb-2">By {book.author}</p>
                      )}

                      {/* Description */}
                      {book.description && (
                        <p className="text-sm text-gray-500 line-clamp-3 mb-3 flex-1">
                          {book.description}
                        </p>
                      )}

                      {/* Price Badge */}
                      <div className="flex items-center gap-2 mb-4 mt-auto">
                        <span className={`text-2xl font-bold ${isFree ? 'text-green-600' : 'text-gray-900'}`}>
                          {formatPrice(book.price)}
                        </span>
                        {isFree && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                            FREE
                          </span>
                        )}
                        {book.accessLevel === 'restricted' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-100">
                            <Lock size={10} /> Restricted
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      {isPurchased ? (
                        <button
                          onClick={() => router.push(`/books/${book.id}`)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={16} /> Read Now
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(book)}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                            isFree
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-brand-600 text-white hover:bg-brand-700'
                          }`}
                        >
                          {isFree ? (
                            <><CheckCircle size={16} /> Get Free</>
                          ) : (
                            <><CreditCard size={16} /> Buy {formatPrice(book.price)}</>
                          )}
                        </button>
                      )}
                    </div>
                  </CardWrap>
                );
              })}
            </div>
          )}
        </div>

        {/* Checkout Modal */}
        {checkoutBook && checkoutBook.price > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
                <button
                  onClick={() => { setCheckoutBook(null); setError(''); }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={processing}
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {purchaseSuccess ? (
                  <div className="text-center py-6">
                    <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
                    <p className="text-lg font-semibold text-gray-900">{purchaseSuccess}</p>
                    <p className="text-sm text-gray-500 mt-1">&quot;{checkoutBook.title}&quot; is now in your library.</p>
                  </div>
                ) : (
                  <>
                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{checkoutBook.title}</p>
                          {checkoutBook.author && (
                            <p className="text-sm text-gray-500">By {checkoutBook.author}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(checkoutBook.price)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Form (simulated) */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                          disabled={processing}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Expiry
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                            disabled={processing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            CVC
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                            disabled={processing}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        This is a simulated payment. Integrate Stripe or Paystack for live transactions.
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        {error}
                      </div>
                    )}

                    {/* Pay Button */}
                    <button
                      onClick={() => processPurchase(checkoutBook, 'card')}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing...</>
                      ) : (
                        <><CreditCard size={16} /> Pay {formatPrice(checkoutBook.price)}</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Free book quick confirmation */}
        {checkoutBook && checkoutBook.price === 0 && purchaseSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
              <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
              <p className="text-lg font-semibold text-gray-900">{purchaseSuccess}</p>
              <p className="text-sm text-gray-500 mt-1">&quot;{checkoutBook.title}&quot; is now in your library.</p>
            </div>
          </div>
        )}
      </ContentWrap>
    </PageWrap>
  );
}