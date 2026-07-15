"use client";
import { PageWrap, ContentWrap, CardWrap } from '@/components/layout/screen-wrap';
import { Star, Zap, Shield, Heart } from 'lucide-react';

export default function PlusPage() {
  return (
    <PageWrap>
      <ContentWrap>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              RPV Bible Plus
            </h1>
            <p className="text-gray-600">
              Enhanced features for deeper Bible study
            </p>
          </div>

          <CardWrap className="mb-8">
            <div className="p-8 text-center">
              <Star className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Premium Features</h2>
              <p className="text-gray-600 mb-6">
                Unlock advanced study tools and enhanced functionality
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                Coming Soon
              </div>
            </div>
          </CardWrap>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardWrap>
              <div className="p-6 text-center">
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Search</h3>
                <p className="text-gray-600 text-sm">
                  Enhanced AI search with deeper insights and cross-references
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ad-Free Experience</h3>
                <p className="text-gray-600 text-sm">
                  Enjoy uninterrupted Bible study without advertisements
                </p>
              </div>
            </CardWrap>

            <CardWrap>
              <div className="p-6 text-center">
                <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                <p className="text-gray-600 text-sm">
                  Access exclusive devotionals and study materials
                </p>
              </div>
            </CardWrap>
          </div>
        </div>
      </ContentWrap>
    </PageWrap>
  );
}