import React from 'react';
import BlogPostClient from './blog-post-client';

// For static export, we need to provide generateStaticParams
// Since we can't pre-generate all blog posts, we'll return an empty array
// and handle dynamic loading on the client side
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // For static export, we need to provide at least one static param
  // We'll provide a placeholder that will be handled dynamically
  return [{ slug: 'placeholder' }];
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}