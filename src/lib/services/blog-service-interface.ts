import type { BlogPost, BlogPostStatus } from '../types';

/**
 * Interface for blog service operations
 * Defines the contract for blog post management
 */
export interface IBlogService {
  // CRUD Operations
  createPost(post: Partial<BlogPost>): Promise<BlogPost>;
  updatePost(id: string, updates: Partial<BlogPost>): Promise<void>;
  deletePost(id: string): Promise<void>;
  
  // Read Operations
  getPost(id: string): Promise<BlogPost | null>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
  getPublishedPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  getAllPosts(): Promise<BlogPost[]>; // admin only
  
  // Publication Management
  publishPost(id: string): Promise<void>;
  unpublishPost(id: string): Promise<void>;
  changePostStatus(id: string, status: BlogPostStatus): Promise<void>;
  
  // Utility Functions
  generateSlug(title: string): string;
  generateExcerpt(content: string, maxLength?: number): string;
  
  // Query Operations
  searchPosts(query: string, includeUnpublished?: boolean): Promise<BlogPost[]>;
  getPostsByAuthor(authorId: string): Promise<BlogPost[]>;
  getPostsByStatus(status: BlogPostStatus): Promise<BlogPost[]>;
}

/**
 * Interface for video embedding operations
 */
export interface IVideoEmbedHandler {
  processVideoUrl(url: string): Promise<{
    platform: 'youtube' | 'vimeo' | 'unknown';
    videoId?: string;
    embedCode: string;
    thumbnailUrl?: string;
    title?: string;
    isValid: boolean;
  }>;
  
  validateVideoUrl(url: string): boolean;
  extractVideoId(url: string, platform: 'youtube' | 'vimeo'): string | null;
  generateEmbedCode(platform: 'youtube' | 'vimeo', videoId: string): string;
  sanitizeEmbedCode(embedCode: string): string;
}