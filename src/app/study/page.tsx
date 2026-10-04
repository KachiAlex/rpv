"use client";
import Link from 'next/link';
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { AssistantPanel } from '@/components/study/assistant-panel';
import { Search, BookOpen, Calendar } from 'lucide-react';

export default function StudyPage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Tools</h1>
            <p className="text-gray-600">Enhance your Bible study with AI assistant, devotionals, and structured reading</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CardWrap>
              <Link href="/bible-search" className="block p-6 hover:bg-neutral-50 transition-colors">
                <Search className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Bible Search</h3>
                <p className="text-gray-600">Ask questions and get intelligent answers from Scripture.</p>
              </Link>
            </CardWrap>

            <CardWrap>
              <Link href="/read" className="block p-6 hover:bg-neutral-50 transition-colors">
                <BookOpen className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bible Reading</h3>
                <p className="text-gray-600">Read the Bible with commentary and verse highlighting.</p>
              </Link>
            </CardWrap>

            <CardWrap>
              <Link href="/devotionals" className="block p-6 hover:bg-neutral-50 transition-colors">
                <Calendar className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Daily Devotionals</h3>
                <p className="text-gray-600">Start your day with inspiring biblical reflections.</p>
              </Link>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <AssistantPanel />
              </div>
            </CardWrap>
          </div>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}
