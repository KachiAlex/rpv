'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { blogService } from '../../lib/services/blog-service';
import type { BlogPost } from '../../lib/types';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const publishedPosts = await blogService.getPublishedPosts(20); // Load more posts for public view
      setPosts(publishedPosts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load blog posts';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts based on search
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Extract text content from HTML
  const extractTextContent = (html: string, maxLength: number = 200) => {
    const textContent = html.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Redemption Project Blog
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest news, insights, and updates from the Redemption Project Version Bible translation.
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-mobile w-full pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-8 h-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Loading blog posts...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Posts</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadPosts}
              className="btn-mobile-primary mt-4 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'No posts found' : 'No blog posts yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms or browse all posts.'
                : 'Check back soon for updates and insights from the Redemption Project.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-red-600 hover:text-red-700"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Blog Posts Grid - Mobile Optimized */}
        {!isLoading && !error && filteredPosts.length > 0 && (
          <div className="grid-mobile-single space-y-6 sm:space-y-8">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 interactive-card">
                <div className="p-4 sm:p-6">
                  {/* Post Header - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 gap-1 sm:gap-0">
                      <span>By {post.authorName}</span>
                      <span className="hidden sm:inline">•</span>
                      <time dateTime={post.publishedAt?.toISOString()}>
                        {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                      </time>
                    </div>
                    
                    {/* Tags - Mobile Optimized */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{post.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Title - Mobile Optimized */}
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="hover:text-red-600 transition-colors duration-200 touch-target"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  {/* Post Excerpt - Mobile Optimized */}
                  <p className="text-gray-600 mb-4 leading-relaxed text-mobile-body">
                    {post.excerpt || extractTextContent(post.content)}
                  </p>

                  {/* Read More Link - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="btn-mobile-secondary inline-flex items-center justify-center sm:justify-start text-red-600 hover:text-red-700 font-medium touch-target"
                    >
                      Read more
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    {/* Video indicator - Mobile Optimized */}
                    {post.videoEmbeds && post.videoEmbeds.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500 justify-center sm:justify-start">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                        </svg>
                        {post.videoEmbeds.length} video{post.videoEmbeds.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}