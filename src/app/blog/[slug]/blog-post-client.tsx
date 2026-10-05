'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { blogService } from '../../../lib/services/blog-service';
import type { BlogPost } from '../../../lib/types';

export default function BlogPostClient() {
  const params = useParams();
  const slug = (params?.slug as string) ?? '';

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const blogPost = await blogService.getPostBySlug(slug);

      if (!blogPost) {
        setError('Blog post not found');
        return;
      }

      // Only show published posts to public
      if (blogPost.status !== 'published') {
        setError('Blog post not found');
        return;
      }

      setPost(blogPost);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load blog post';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-[#EAE6DC] p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-[#EAE6DC] rounded mb-4"></div>
              <div className="h-4 bg-[#EAE6DC] rounded mb-2"></div>
              <div className="h-4 bg-[#EAE6DC] rounded mb-8 w-1/2"></div>
              <div className="space-y-3">
                <div className="h-4 bg-[#EAE6DC] rounded"></div>
                <div className="h-4 bg-[#EAE6DC] rounded"></div>
                <div className="h-4 bg-[#EAE6DC] rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-[#EAE6DC] p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#8B90AC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-[#1C2340] mb-2">Post Not Found</h1>
            <p className="text-[#5B6280] mb-6">{error}</p>
            <div className="space-x-4">
              <Link
                href="/blog"
                className="bg-[#E23B4E] text-white px-6 py-2 rounded-md hover:bg-[#C42B3D]"
              >
                Browse All Posts
              </Link>
              <Link
                href="/"
                className="text-[#5B6280] hover:text-[#1C2340]"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-[#EAE6DC] p-8 text-center">
            <h1 className="text-2xl font-bold text-[#1C2340] mb-2">Post Not Found</h1>
            <p className="text-[#5B6280] mb-6">The blog post you're looking for doesn't exist.</p>
            <Link
              href="/blog"
              className="bg-[#E23B4E] text-white px-6 py-2 rounded-md hover:bg-[#C42B3D]"
            >
              Browse All Posts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      {/* Navigation */}
      <div className="bg-[#0B1030]">
        <div className="container-mobile py-4">
          <nav className="flex items-center space-x-2 sm:space-x-4 text-sm overflow-x-auto">
            <Link href="/" className="text-[#C7D0F2] hover:text-white whitespace-nowrap touch-target">
              Home
            </Link>
            <svg className="w-4 h-4 text-[#8B90AC] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/blog" className="text-[#C7D0F2] hover:text-white whitespace-nowrap touch-target">
              Blog
            </Link>
            <svg className="w-4 h-4 text-[#8B90AC] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium truncate">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-[#EAE6DC] overflow-hidden">
          {/* Article Header */}
          <header className="p-8 border-b border-[#EAE6DC]">
            <div className="mb-6">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex px-3 py-1 text-sm font-medium bg-[#FDF2F3] text-[#C42B3D] rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-4xl font-bold text-[#1C2340] mb-4 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-[#5B6280] leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex items-center justify-between text-sm text-[#8B90AC]">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>By {post.authorName}</span>
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                  </time>
                </div>
              </div>

              {post.videoEmbeds && post.videoEmbeds.length > 0 && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{post.videoEmbeds.length} video{post.videoEmbeds.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div className="p-8">
            <div
              className="prose prose-lg max-w-none prose-headings:text-[#1C2340] prose-p:text-[#5B6280] prose-a:text-[#E23B4E] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#1C2340] prose-ul:text-[#5B6280] prose-ol:text-[#5B6280] prose-blockquote:text-[#5B6280] prose-blockquote:border-[#E23B4E]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Article Footer */}
          <footer className="p-8 border-t border-[#EAE6DC] bg-[#FBFAF7]">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#5B6280]">
                <p>Published on {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}</p>
                {post.updatedAt && post.updatedAt.getTime() !== post.createdAt.getTime() && (
                  <p className="mt-1">Last updated on {formatDate(post.updatedAt)}</p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/blog"
                  className="text-[#E23B4E] hover:text-[#C42B3D] font-medium"
                >
                  ← Back to Blog
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}
