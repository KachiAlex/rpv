"use client";
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { Newspaper, Calendar, Globe, TrendingUp } from 'lucide-react';

export default function NewsPage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bible News & Updates
            </h1>
            <p className="text-gray-600">
              Stay informed about biblical discoveries and Christian news
            </p>
          </div>

          <CardWrap className="mb-8">
            <div className="p-8 text-center">
              <Newspaper className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">News Feed</h2>
              <p className="text-gray-600 mb-6">
                Biblical archaeology, Christian news, and spiritual insights
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                Coming Soon
              </div>
            </div>
          </CardWrap>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardWrap>
              <div className="p-6 text-center">
                <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Global Updates</h3>
                <p className="text-gray-600 text-sm">
                  Christian news from around the world
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Biblical Calendar</h3>
                <p className="text-gray-600 text-sm">
                  Important dates and biblical holidays
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trending Topics</h3>
                <p className="text-gray-600 text-sm">
                  Popular discussions and biblical insights
                </p>
              </div>
            </CardWrap>
          </div>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}