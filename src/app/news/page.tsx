"use client";
import { PageWrap, ContentWrap } from '@/components/layout/screen-wrap';
import { FeaturedBlogArticles } from '@/components/home/featured-blog-articles';

export default function NewsPage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">News & Updates</h1>
            <p className="text-gray-600">Latest articles, insights, and updates from RPV Bible</p>
          </div>

          <FeaturedBlogArticles />
        </div>
      </ContentWrap>
    </PageWrap>
  );
}
