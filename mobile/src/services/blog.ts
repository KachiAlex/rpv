import { getAuthToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rpvbible.com';

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author: string;
  authorName: string;
  status: BlogPostStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  featuredImage?: string;
  videoEmbeds: { platform: string; videoId: string; embedCode: string; title?: string }[];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

function normalize(post: any): BlogPost {
  return { ...post, tags: post.tags || [], videoEmbeds: post.videoEmbeds || [] };
}

/** Strip HTML tags and collapse whitespace for native rendering. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- Public ----------

export async function getPublishedPosts(limit = 20, offset = 0): Promise<{ posts: BlogPost[]; hasMore: boolean }> {
  const data = await request<{ posts: any[]; hasMore: boolean }>(`/api/blog?limit=${limit}&offset=${offset}`);
  return { posts: (data.posts || []).map(normalize), hasMore: !!data.hasMore };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const data = await request<{ post: any }>(`/api/blog?slug=${encodeURIComponent(slug)}`);
  return data.post ? normalize(data.post) : null;
}

// ---------- Admin ----------

export async function getAllPosts(): Promise<BlogPost[]> {
  const data = await request<{ posts: any[] }>('/api/blog?status=all&limit=100');
  return (data.posts || []).map(normalize);
}

export async function createPost(post: {
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  authorName: string;
  status: BlogPostStatus;
  tags?: string[];
}): Promise<string> {
  const slug = post.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const data = await request<{ id: string }>('/api/blog', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      post: { ...post, slug, excerpt: post.excerpt || '', tags: post.tags || [], videoEmbeds: [] },
    }),
  });
  return data.id;
}

export async function setPostStatus(id: string, status: BlogPostStatus): Promise<void> {
  await request('/api/blog', {
    method: 'POST',
    body: JSON.stringify({ action: 'setStatus', id, status }),
  });
}

export async function deletePost(id: string): Promise<void> {
  await request('/api/blog', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id }),
  });
}
