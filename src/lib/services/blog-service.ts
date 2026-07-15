import { BlogRepository } from '../repositories/blog-repository';
import { generateSlug, validateBlogPost, formatBlogPostForDisplay } from '../utils/blog-utils';
import type { BlogPost, BlogPostStatus, BlogServiceInterface } from '../types';

/**
 * Blog Service - Business logic layer for blog operations
 * Implements BlogServiceInterface and provides high-level blog management functionality
 */
export class BlogService implements BlogServiceInterface {
  private repository: BlogRepository;

  constructor() {
    this.repository = new BlogRepository();
  }

  /**
   * Create a new blog post
   * Validates input, generates slug, and stores in repository
   */
  async createPost(post: Partial<BlogPost>): Promise<BlogPost> {
    // Validate required fields
    const validation = validateBlogPost(post);
    if (!validation.isValid) {
      throw new Error(`Invalid blog post data: ${validation.errors.join(', ')}`);
    }

    // Generate slug if not provided
    const slug = post.slug || this.generateSlug(post.title!);
    
    // Check if slug already exists
    const existingPost = await this.repository.getPostBySlug(slug);
    if (existingPost) {
      throw new Error(`A post with slug "${slug}" already exists`);
    }

    // Prepare post data
    const postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
      title: post.title!,
      content: post.content!,
      excerpt: post.excerpt || '',
      slug,
      author: post.author!,
      authorName: post.authorName || post.author!,
      status: post.status || 'draft',
      publishedAt: post.status === 'published' ? (post.publishedAt || new Date()) : undefined,
      tags: post.tags || [],
      featuredImage: post.featuredImage,
      videoEmbeds: post.videoEmbeds || [],
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription
    };

    return await this.repository.createPost(postData);
  }

  /**
   * Update an existing blog post
   */
  async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    // Get existing post
    const existingPost = await this.repository.getPost(id);
    if (!existingPost) {
      throw new Error(`Blog post with id "${id}" not found`);
    }

    // Validate updates if they include critical fields
    if (updates.title || updates.content || updates.author) {
      const updatedPost = { ...existingPost, ...updates };
      const validation = validateBlogPost(updatedPost);
      if (!validation.isValid) {
        throw new Error(`Invalid blog post updates: ${validation.errors.join(', ')}`);
      }
    }

    // Handle slug updates
    if (updates.title && !updates.slug) {
      const newSlug = this.generateSlug(updates.title);
      if (newSlug !== existingPost.slug) {
        // Check if new slug already exists
        const existingWithSlug = await this.repository.getPostBySlug(newSlug);
        if (existingWithSlug && existingWithSlug.id !== id) {
          throw new Error(`A post with slug "${newSlug}" already exists`);
        }
        updates.slug = newSlug;
      }
    }

    // Handle publication status changes
    if (updates.status === 'published' && existingPost.status !== 'published') {
      updates.publishedAt = updates.publishedAt || new Date();
    } else if (updates.status === 'draft' || updates.status === 'archived') {
      updates.publishedAt = undefined;
    }

    await this.repository.updatePost(id, updates);
  }

  /**
   * Delete a blog post
   */
  async deletePost(id: string): Promise<void> {
    const existingPost = await this.repository.getPost(id);
    if (!existingPost) {
      throw new Error(`Blog post with id "${id}" not found`);
    }

    await this.repository.deletePost(id);
  }

  /**
   * Get a single blog post by ID
   */
  async getPost(id: string): Promise<BlogPost | null> {
    const post = await this.repository.getPost(id);
    return post ? formatBlogPostForDisplay(post) : null;
  }

  /**
   * Get a single blog post by slug
   */
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const post = await this.repository.getPostBySlug(slug);
    return post ? formatBlogPostForDisplay(post) : null;
  }

  /**
   * Get published blog posts for public display
   */
  async getPublishedPosts(limit: number = 10, offset: number = 0): Promise<BlogPost[]> {
    // Note: This implementation uses cursor-based pagination from repository
    // The offset parameter is not directly used but could be implemented with cursor logic
    const result = await this.repository.getPublishedPosts(limit);
    return result.posts.map(post => formatBlogPostForDisplay(post));
  }

  /**
   * Get all blog posts (admin only)
   */
  async getAllPosts(): Promise<BlogPost[]> {
    const posts = await this.repository.getAllPosts();
    return posts.map(post => formatBlogPostForDisplay(post));
  }

  /**
   * Get posts by status
   */
  async getPostsByStatus(status: BlogPostStatus): Promise<BlogPost[]> {
    const posts = await this.repository.getPostsByStatus(status);
    return posts.map(post => formatBlogPostForDisplay(post));
  }

  /**
   * Get posts by author
   */
  async getPostsByAuthor(authorId: string): Promise<BlogPost[]> {
    const posts = await this.repository.getPostsByAuthor(authorId);
    return posts.map(post => formatBlogPostForDisplay(post));
  }

  /**
   * Search blog posts
   */
  async searchPosts(query: string, includeUnpublished: boolean = false): Promise<BlogPost[]> {
    const posts = await this.repository.searchPosts(query, includeUnpublished);
    return posts.map(post => formatBlogPostForDisplay(post));
  }

  /**
   * Publish a blog post
   */
  async publishPost(id: string): Promise<void> {
    const post = await this.repository.getPost(id);
    if (!post) {
      throw new Error(`Blog post with id "${id}" not found`);
    }

    if (post.status === 'published') {
      throw new Error('Blog post is already published');
    }

    await this.repository.publishPost(id);
  }

  /**
   * Unpublish a blog post (set to draft)
   */
  async unpublishPost(id: string): Promise<void> {
    const post = await this.repository.getPost(id);
    if (!post) {
      throw new Error(`Blog post with id "${id}" not found`);
    }

    if (post.status !== 'published') {
      throw new Error('Blog post is not currently published');
    }

    await this.repository.unpublishPost(id);
  }

  /**
   * Archive a blog post
   */
  async archivePost(id: string): Promise<void> {
    const post = await this.repository.getPost(id);
    if (!post) {
      throw new Error(`Blog post with id "${id}" not found`);
    }

    if (post.status === 'archived') {
      throw new Error('Blog post is already archived');
    }

    await this.repository.archivePost(id);
  }

  /**
   * Bulk update publication status
   */
  async bulkUpdateStatus(postIds: string[], status: BlogPostStatus): Promise<void> {
    if (postIds.length === 0) {
      throw new Error('No post IDs provided for bulk update');
    }

    // Validate that all posts exist
    for (const id of postIds) {
      const post = await this.repository.getPost(id);
      if (!post) {
        throw new Error(`Blog post with id "${id}" not found`);
      }
    }

    await this.repository.bulkUpdateStatus(postIds, status);
  }

  /**
   * Generate SEO-friendly URL slug from title
   */
  generateSlug(title: string): string {
    return generateSlug(title);
  }

  /**
   * Get blog metadata/settings
   */
  async getBlogMetadata(): Promise<any> {
    return await this.repository.getBlogMetadata();
  }

  /**
   * Update blog metadata/settings
   */
  async updateBlogMetadata(metadata: any): Promise<void> {
    await this.repository.updateBlogMetadata(metadata);
  }

  /**
   * Get published posts with pagination support
   */
  async getPublishedPostsPaginated(limit: number = 10, lastDocId?: string): Promise<{
    posts: BlogPost[];
    hasMore: boolean;
    lastDocId?: string;
  }> {
    // This would need to be implemented with proper cursor-based pagination
    // For now, using the existing method
    const result = await this.repository.getPublishedPosts(limit);
    
    return {
      posts: result.posts.map(post => formatBlogPostForDisplay(post)),
      hasMore: result.hasMore,
      lastDocId: result.lastDoc?.id
    };
  }

  /**
   * Subscribe to real-time updates for a specific post
   */
  subscribeToPost(id: string, callback: (post: BlogPost | null) => void): () => void {
    return this.repository.subscribeToPost(id, (post) => {
      callback(post ? formatBlogPostForDisplay(post) : null);
    });
  }

  /**
   * Subscribe to real-time updates for published posts
   */
  subscribeToPublishedPosts(callback: (posts: BlogPost[]) => void, limit: number = 10): () => void {
    return this.repository.subscribeToPublishedPosts((posts) => {
      callback(posts.map(post => formatBlogPostForDisplay(post)));
    }, limit);
  }

  /**
   * Subscribe to real-time updates for all posts (admin)
   */
  subscribeToAllPosts(callback: (posts: BlogPost[]) => void): () => void {
    return this.repository.subscribeToAllPosts((posts) => {
      callback(posts.map(post => formatBlogPostForDisplay(post)));
    });
  }

  /**
   * Validate blog post data
   */
  validatePost(post: Partial<BlogPost>): { isValid: boolean; errors: string[] } {
    return validateBlogPost(post);
  }

  /**
   * Check if a slug is available
   */
  async isSlugAvailable(slug: string, excludePostId?: string): Promise<boolean> {
    const existingPost = await this.repository.getPostBySlug(slug);
    
    if (!existingPost) {
      return true;
    }
    
    // If we're excluding a specific post (for updates), check if it's the same post
    return excludePostId ? existingPost.id === excludePostId : false;
  }

  /**
   * Get post statistics
   */
  async getPostStatistics(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
  }> {
    const allPosts = await this.repository.getAllPosts();
    
    return {
      total: allPosts.length,
      published: allPosts.filter(post => post.status === 'published').length,
      draft: allPosts.filter(post => post.status === 'draft').length,
      archived: allPosts.filter(post => post.status === 'archived').length
    };
  }
}

// Export singleton instance
export const blogService = new BlogService();