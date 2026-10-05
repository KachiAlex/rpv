import type { BlogPost, BlogPostStatus } from '../types';
import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';

const POLL_MS = 30000;

async function apiCall<T = any>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

function toPost(raw: any): BlogPost {
  return {
    ...raw,
    publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : undefined,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    tags: raw.tags || [],
    videoEmbeds: raw.videoEmbeds || [],
  };
}

async function adminAction(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  return apiCall('/api/blog', {
    method: 'POST',
    body: JSON.stringify({ action, ...payload }),
  });
}

function subscribe(load: () => Promise<BlogPost[] | BlogPost | null>, callback: (v: any) => void): () => void {
  let cancelled = false;
  const tick = async () => {
    try {
      const v = await load();
      if (!cancelled) callback(v);
    } catch {
      /* keep polling */
    }
  };
  tick();
  const timer = setInterval(tick, POLL_MS);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

export class BlogRepository {
  async createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
    const { id } = await adminAction('create', { post });
    const now = new Date();
    return { ...post, id, createdAt: now, updatedAt: now } as BlogPost;
  }

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    await adminAction('update', { id, updates });
  }

  async deletePost(id: string): Promise<void> {
    await adminAction('delete', { id });
  }

  async getPost(id: string): Promise<BlogPost | null> {
    const { post } = await apiCall<{ post: any }>(`/api/blog?id=${encodeURIComponent(id)}`);
    return post ? toPost(post) : null;
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { post } = await apiCall<{ post: any }>(`/api/blog?slug=${encodeURIComponent(slug)}`);
    return post ? toPost(post) : null;
  }

  async getPublishedPosts(limitCount: number = 10, lastDoc?: any): Promise<{ posts: BlogPost[]; lastDoc?: any; hasMore: boolean }> {
    const offset = typeof lastDoc === 'number' ? lastDoc : 0;
    const { posts, hasMore } = await apiCall<{ posts: any[]; hasMore: boolean }>(
      `/api/blog?limit=${limitCount}&offset=${offset}`
    );
    return {
      posts: posts.map(toPost),
      hasMore,
      lastDoc: offset + posts.length,
    };
  }

  async getAllPosts(): Promise<BlogPost[]> {
    const { posts } = await apiCall<{ posts: any[] }>('/api/blog?status=all&limit=100');
    return posts.map(toPost);
  }

  async getPostsByStatus(status: BlogPostStatus): Promise<BlogPost[]> {
    const { posts } = await apiCall<{ posts: any[] }>(`/api/blog?status=${status}&limit=100`);
    return posts.map(toPost);
  }

  async getPostsByAuthor(authorId: string): Promise<BlogPost[]> {
    const { posts } = await apiCall<{ posts: any[] }>(`/api/blog?author=${encodeURIComponent(authorId)}&limit=100`);
    return posts.map(toPost);
  }

  async searchPosts(searchTerm: string, includeUnpublished: boolean = false): Promise<BlogPost[]> {
    const { posts } = await apiCall<{ posts: any[] }>(
      `/api/blog?search=${encodeURIComponent(searchTerm)}&includeUnpublished=${includeUnpublished}&limit=100`
    );
    return posts.map(toPost);
  }

  async publishPost(id: string): Promise<void> {
    await adminAction('setStatus', { id, status: 'published' });
  }

  async unpublishPost(id: string): Promise<void> {
    await adminAction('setStatus', { id, status: 'draft' });
  }

  async archivePost(id: string): Promise<void> {
    await adminAction('setStatus', { id, status: 'archived' });
  }

  async bulkUpdateStatus(postIds: string[], status: BlogPostStatus): Promise<void> {
    await adminAction('bulkStatus', { ids: postIds, status });
  }

  subscribeToPost(id: string, callback: (post: BlogPost | null) => void): () => void {
    return subscribe(() => this.getPost(id), callback);
  }

  subscribeToPublishedPosts(callback: (posts: BlogPost[]) => void, limitCount: number = 10): () => void {
    return subscribe(async () => (await this.getPublishedPosts(limitCount)).posts, callback);
  }

  subscribeToAllPosts(callback: (posts: BlogPost[]) => void): () => void {
    return subscribe(() => this.getAllPosts(), callback);
  }

  async getBlogMetadata(): Promise<any> {
    return { postsPerPage: 10, allowComments: false, moderationEnabled: true };
  }

  async updateBlogMetadata(_metadata: any): Promise<void> {}
}
