"use client";
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { DevotionalPanel } from '@/components/study/devotional-panel';

export default function DevotionalsPage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Devotionals</h1>
            <p className="text-gray-600">Start your day with inspiring biblical reflections</p>
          </div>

          <CardWrap className="mb-8">
            <DevotionalPanel />
          </CardWrap>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}
