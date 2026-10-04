"use client";
import Link from 'next/link';
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { useBibleStore } from '@/lib/store';
import { formatTranslationName } from '@/lib/utils/translation-formatter';
import { Compass, BookOpen, Search, Calendar, Star } from 'lucide-react';

export default function ExplorePage() {
  const { translations, isLoading } = useBibleStore();
  const endUserTranslations = translations.filter(t => t.books.some(b => b.published !== false));

  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore More</h1>
            <p className="text-gray-600">Discover all the features and translations available in your Bible study journey</p>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <>
              <CardWrap className="mb-8">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Available Translations</h2>
                  {endUserTranslations.length === 0 ? (
                    <p className="text-gray-600">No translations available yet. Check back soon.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {endUserTranslations.map(t => (
                        <Link
                          key={t.id}
                          href={`/read?translation=${encodeURIComponent(t.id)}&book=${encodeURIComponent(t.books[0]?.name || 'Genesis')}&chapter=1`}
                          className="p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <p className="font-medium text-neutral-900">{formatTranslationName(t)}</p>
                          <p className="text-sm text-neutral-500">{t.books.length} books</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </CardWrap>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CardWrap>
                  <div className="p-6">
                    <BookOpen className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Bible Reading</h3>
                    <p className="text-gray-600 mb-4">Read multiple translations with advanced search and highlighting.</p>
                    <Link href="/read" className="text-blue-600 hover:underline">Start Reading</Link>
                  </div>
                </CardWrap>

                <CardWrap>
                  <div className="p-6">
                    <Search className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">AI Bible Search</h3>
                    <p className="text-gray-600 mb-4">Ask questions and get intelligent answers from Scripture.</p>
                    <Link href="/bible-search" className="text-green-600 hover:underline">Try AI Search</Link>
                  </div>
                </CardWrap>

                <CardWrap>
                  <div className="p-6">
                    <Calendar className="h-8 w-8 text-purple-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Devotionals</h3>
                    <p className="text-gray-600 mb-4">Daily reflections and scripture focus for personal growth.</p>
                    <Link href="/devotionals" className="text-purple-600 hover:underline">Read Devotionals</Link>
                  </div>
                </CardWrap>

                <CardWrap>
                  <div className="p-6">
                    <Star className="h-8 w-8 text-yellow-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Study Tools</h3>
                    <p className="text-gray-600 mb-4">Commentary, assistant, and cross-references for deeper study.</p>
                    <Link href="/study" className="text-yellow-600 hover:underline">Study Now</Link>
                  </div>
                </CardWrap>

                <CardWrap>
                  <div className="p-6">
                    <Compass className="h-8 w-8 text-orange-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Reading Plans</h3>
                    <p className="text-gray-600 mb-4">Follow structured plans to guide your Bible reading.</p>
                    <Link href="/plans" className="text-orange-600 hover:underline">View Plans</Link>
                  </div>
                </CardWrap>
              </div>
            </>
          )}
        </div>
      </ContentWrap>
    </PageWrap>
  );
}
