"use client";
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { BookOpen, Search, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function StudyPage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Study Tools
            </h1>
            <p className="text-gray-600">
              Enhance your Bible study with powerful tools and resources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Search className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">AI Bible Search</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Ask questions and get intelligent answers from Scripture using our AI-powered search.
                </p>
                <Link 
                  href="/bible-search"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try AI Search
                </Link>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">Bible Reading</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Read the Bible with advanced search, highlighting, and note-taking features.
                </p>
                <Link 
                  href="/read"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Reading
                </Link>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold">Reading Plans</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Follow structured reading plans to guide your Bible study journey.
                </p>
                <Link 
                  href="/plans"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Plans
                </Link>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold">Community</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Connect with other believers and share insights from your study.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                  Coming Soon
                </div>
              </div>
            </CardWrap>
          </div>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}