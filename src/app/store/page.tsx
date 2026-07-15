"use client";
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { ShoppingBag, Book, Gift, Star } from 'lucide-react';

export default function StorePage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bible Store
            </h1>
            <p className="text-gray-600">
              Christian books, resources, and study materials
            </p>
          </div>

          <CardWrap className="mb-8">
            <div className="p-8 text-center">
              <ShoppingBag className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Christian Resources</h2>
              <p className="text-gray-600 mb-6">
                Books, study guides, and spiritual resources for your journey
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                Coming Soon
              </div>
            </div>
          </CardWrap>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardWrap>
              <div className="p-6 text-center">
                <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Study Guides</h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive Bible study materials and guides
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <Gift className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Gift Items</h3>
                <p className="text-gray-600 text-sm">
                  Inspirational gifts for friends and family
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Featured Items</h3>
                <p className="text-gray-600 text-sm">
                  Bestselling Christian books and resources
                </p>
              </div>
            </CardWrap>
          </div>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}