import type { BlogPost } from '../types';
import { BLOG_CONFIG, SECURITY_CONFIG } from '../constants/blog';

/**
 * Utility functions for blog operations
 */

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, SECURITY_CONFIG.SLUG_REGEX ? 100 : 100); // Limit length
}

/**
 * Generate an excerpt from HTML content
 */
export function generateExcerpt(content: string, maxLength: number = BLOG_CONFIG.DEFAULT_EXCERPT_LENGTH): string {
  // Strip HTML tags
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const decoded = textContent
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Trim and truncate
  const trimmed = decoded.trim();
  
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  
  // Find the last complete word within the limit
  const truncated = trimmed.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}

/**
 * Validate blog post data
 */
export function validateBlogPost(post: Partial<BlogPost>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Title validation
  if (!post.title || post.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (post.title.length > BLOG_CONFIG.MAX_TITLE_LENGTH) {
    errors.push(`Title must be less than ${BLOG_CONFIG.MAX_TITLE_LENGTH} characters`);
  }
  
  // Content validation
  if (!post.content || post.content.trim().length === 0) {
    errors.push('Content is required');
  } else if (post.content.length > SECURITY_CONFIG.MAX_CONTENT_LENGTH) {
    errors.push(`Content must be less than ${SECURITY_CONFIG.MAX_CONTENT_LENGTH} characters`);
  }
  
  // Slug validation
  if (post.slug) {
    if (post.slug.length > BLOG_CONFIG.MAX_SLUG_LENGTH) {
      errors.push(`Slug must be less than ${BLOG_CONFIG.MAX_SLUG_LENGTH} characters`);
    }
    if (!SECURITY_CONFIG.SLUG_REGEX.test(post.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }
  
  // Author validation
  if (!post.author || post.author.trim().length === 0) {
    errors.push('Author is required');
  }
  
  // Status validation
  if (post.status && !['draft', 'published', 'archived'].includes(post.status)) {
    errors.push('Invalid status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize HTML content for security
 */
export function sanitizeHtmlContent(content: string): string {
  // This is a basic implementation - in production, use a library like DOMPurify
  // For now, we'll implement basic sanitization
  
  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
  
  return sanitized;
}

/**
 * Format blog post for display
 */
export function formatBlogPostForDisplay(post: BlogPost): BlogPost {
  const normalizeDate = (value: unknown): Date => {
    if (!value) {
      return new Date(0);
    }
    if (value instanceof Date) {
      return value;
    }
    const date = new Date(value as string);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  };

  return {
    ...post,
    content: sanitizeHtmlContent(post.content),
    excerpt: post.excerpt || generateExcerpt(post.content),
    slug: post.slug || generateSlug(post.title),
    createdAt: normalizeDate(post.createdAt),
    updatedAt: normalizeDate(post.updatedAt),
    publishedAt: post.publishedAt ? normalizeDate(post.publishedAt) : undefined
  };
}

/**
 * Check if user can edit blog post
 */
export function canEditBlogPost(post: BlogPost, userId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return post.author === userId;
}

/**
 * Check if blog post is visible to public
 */
export function isBlogPostPublic(post: BlogPost): boolean {
  return post.status === 'published' && post.publishedAt != null;
}

/**
 * Sort blog posts by publication date (newest first)
 */
export function sortBlogPostsByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const dateA = a.publishedAt || a.createdAt;
    const dateB = b.publishedAt || b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filter blog posts by status
 */
export function filterBlogPostsByStatus(posts: BlogPost[], status: string): BlogPost[] {
  return posts.filter(post => post.status === status);
}

/**
 * Search blog posts by title and content
 */
export function searchBlogPosts(posts: BlogPost[], query: string): BlogPost[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return posts;
  
  return posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.content.toLowerCase().includes(searchTerm) ||
    post.excerpt.toLowerCase().includes(searchTerm) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );
}