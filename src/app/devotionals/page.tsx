"use client";
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { Heart, Calendar, BookOpen, Sun } from 'lucide-react';
import { useState } from 'react';

export default function DevotionalsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Daily Devotionals
            </h1>
            <p className="text-gray-600">
              Start your day with inspiring biblical reflections
            </p>
          </div>

          <CardWrap className="mb-8">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Sun className="h-8 w-8 text-yellow-500 mr-3" />
                  <h2 className="text-2xl font-bold">Today's Devotional</h2>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Devotionals Coming Soon</h3>
                <p className="text-gray-600 mb-6">
                  We're preparing inspiring daily devotionals to help you grow in your faith journey.
                </p>
                <div className="inline-flex items-center px-6 py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                  Available Soon
                </div>
              </div>
            </div>
          </CardWrap>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardWrap>
              <div className="p-6 text-center">
                <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Daily Readings</h3>
                <p className="text-gray-600 text-sm">
                  Structured daily Bible readings with reflections
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scripture Focus</h3>
                <p className="text-gray-600 text-sm">
                  Deep dives into specific Bible passages
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Personal Growth</h3>
                <p className="text-gray-600 text-sm">
                  Practical applications for spiritual development
                </p>
              </div>
            </CardWrap>
          </div>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}