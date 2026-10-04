import type { BlogPost, BlogPostStatus } from '../types';

export class BlogRepository {
  async createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
    const now = new Date();
    return { ...post, id: '', createdAt: now, updatedAt: now } as BlogPost;
  }
  async updatePost(_id: string, _updates: Partial<BlogPost>): Promise<void> {}
  async deletePost(_id: string): Promise<void> {}
  async getPost(_id: string): Promise<BlogPost | null> { return null; }
  async getPostBySlug(_slug: string): Promise<BlogPost | null> { return null; }
  async getPublishedPosts(_limitCount?: number, _lastDoc?: any): Promise<{ posts: BlogPost[]; lastDoc?: any; hasMore: boolean }> { return { posts: [], hasMore: false }; }
  async getAllPosts(): Promise<BlogPost[]> { return []; }
  async getPostsByStatus(_status: BlogPostStatus): Promise<BlogPost[]> { return []; }
  async getPostsByAuthor(_authorId: string): Promise<BlogPost[]> { return []; }
  async searchPosts(_searchTerm: string, _includeUnpublished?: boolean): Promise<BlogPost[]> { return []; }
  async publishPost(_id: string): Promise<void> {}
  async unpublishPost(_id: string): Promise<void> {}
  async archivePost(_id: string): Promise<void> {}
  async bulkUpdateStatus(_postIds: string[], _status: BlogPostStatus): Promise<void> {}
  subscribeToPost(_id: string, _callback: (post: BlogPost | null) => void): () => void { return () => {}; }
  subscribeToPublishedPosts(_callback: (posts: BlogPost[]) => void, _limitCount?: number): () => void { return () => {}; }
  subscribeToAllPosts(_callback: (posts: BlogPost[]) => void): () => void { return () => {}; }
  async getBlogMetadata(): Promise<any> { return { postsPerPage: 10, allowComments: false, moderationEnabled: true }; }
  async updateBlogMetadata(_metadata: any): Promise<void> {}
}
