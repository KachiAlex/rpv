"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogService } from '@/lib/services/blog-service';
import type { BlogPost } from '@/lib/types';

export function FeaturedBlogArticles() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const blogService = new BlogService();
        const publishedPosts = await blogService.getPublishedPosts(3);
        setPosts(publishedPosts);
      } catch (error) {
        console.error('Error loading featured blog articles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="rpv-article-row">
        <div>
          <h4>Loading articles…</h4>
          <p>Fetching the latest blog posts.</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rpv-article-row">
        <div>
          <h4>No articles yet</h4>
          <p>Check back soon for the latest insights and updates.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="rpv-article-row"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div>
            <h4>{post.title}</h4>
            <p>{post.excerpt || post.content?.slice(0, 120) + '…'}</p>
          </div>
          <div className="rpv-article-date">
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''}
          </div>
        </Link>
      ))}
      <Link href="/blog" className="rpv-view-all">
        View all articles →
      </Link>
    </>
  );
}
