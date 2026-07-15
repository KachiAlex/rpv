"use client";
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { Compass, Map, Search, Users, BookOpen, Star } from 'lucide-react';
import Link from 'next/link';

export default function ExplorePage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Explore More
            </h1>
            <p className="text-gray-600">
              Discover all the features and tools available in your Bible study journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Bible Reading</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Read multiple translations with advanced search and highlighting features.
                </p>
                <Link 
                  href="/read"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Reading
                </Link>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Search className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">AI Bible Search</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Ask questions and get intelligent answers from Scripture using AI.
                </p>
                <Link 
                  href="/bible-search"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Try AI Search
                </Link>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Map className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold">Reading Plans</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Follow structured plans to guide your Bible reading journey.
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
                  <Compass className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold">Study Tools</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Access comprehensive study resources and tools for deeper learning.
                </p>
                <Link 
                  href="/study"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Explore Tools
                </Link>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Star className="h-8 w-8 text-yellow-600 mr-3" />
                  <h3 className="text-xl font-semibold">Daily Devotionals</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Start your day with inspiring biblical reflections and insights.
                </p>
                <Link 
                  href="/devotionals"
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Read Devotionals
                </Link>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-red-600 mr-3" />
                  <h3 className="text-xl font-semibold">Community</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Connect with other believers and share your faith journey.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                  Coming Soon
                </div>
              </div>
            </CardWrap>
          </div>

          <CardWrap className="mt-8">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">More Features Coming Soon</h2>
              <p className="text-gray-600 mb-6">
                We're constantly working to add new features and improve your Bible study experience.
                Stay tuned for updates!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Cross References
                </span>
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
                  Commentary Integration
                </span>
                <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm">
                  Study Groups
                </span>
                <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Prayer Requests
                </span>
              </div>
            </div>
          </CardWrap>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}