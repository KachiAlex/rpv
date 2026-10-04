import { BlogRepository } from '../blog-repository';
import type { BlogPost, BlogPostStatus } from '../../types';

function createTestBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  const now = new Date('2023-01-01T00:00:00Z');
  return {
    id: 'test-id',
    title: 'Test Blog Post',
    content: '<p>This is test content for the blog post.</p>',
    excerpt: 'This is test content for the blog post.',
    slug: 'test-blog-post',
    author: 'test-author',
    authorName: 'Test Author',
    status: 'draft' as BlogPostStatus,
    createdAt: now,
    updatedAt: now,
    videoEmbeds: [],
    ...overrides
  };
}

describe('BlogRepository Stub Tests', () => {
  let repository: BlogRepository;

  beforeEach(() => {
    repository = new BlogRepository();
  });

  test('createPost returns a BlogPost with id and timestamps', async () => {
    const postData = {
      title: 'Test Post',
      content: '<p>Content</p>',
      excerpt: 'Content',
      slug: 'test-post',
      author: 'author',
      authorName: 'Author',
      status: 'draft' as BlogPostStatus,
      videoEmbeds: []
    };
    const result = await repository.createPost(postData);
    expect(result.title).toBe('Test Post');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  test('getPost returns null', async () => {
    const result = await repository.getPost('nonexistent');
    expect(result).toBeNull();
  });

  test('getPostBySlug returns null', async () => {
    const result = await repository.getPostBySlug('nonexistent-slug');
    expect(result).toBeNull();
  });

  test('getAllPosts returns empty array', async () => {
    const result = await repository.getAllPosts();
    expect(result).toEqual([]);
  });

  test('getPublishedPosts returns empty array with hasMore=false', async () => {
    const result = await repository.getPublishedPosts();
    expect(result.posts).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  test('getPostsByStatus returns empty array', async () => {
    const result = await repository.getPostsByStatus('published');
    expect(result).toEqual([]);
  });

  test('searchPosts returns empty array', async () => {
    const result = await repository.searchPosts('test');
    expect(result).toEqual([]);
  });

  test('updatePost is a no-op', async () => {
    await expect(repository.updatePost('id', { title: 'Updated' })).resolves.toBeUndefined();
  });

  test('deletePost is a no-op', async () => {
    await expect(repository.deletePost('id')).resolves.toBeUndefined();
  });

  test('subscribeToPost returns unsubscribe function', () => {
    const unsub = repository.subscribeToPost('id', () => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  test('subscribeToPublishedPosts returns unsubscribe function', () => {
    const unsub = repository.subscribeToPublishedPosts(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  test('subscribeToAllPosts returns unsubscribe function', () => {
    const unsub = repository.subscribeToAllPosts(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  test('getBlogMetadata returns default metadata', async () => {
    const result = await repository.getBlogMetadata();
    expect(result.postsPerPage).toBe(10);
    expect(result.allowComments).toBe(false);
    expect(result.moderationEnabled).toBe(true);
  });

  test('updateBlogMetadata is a no-op', async () => {
    await expect(repository.updateBlogMetadata({ postsPerPage: 5 })).resolves.toBeUndefined();
  });

  test('bulkUpdateStatus is a no-op', async () => {
    await expect(repository.bulkUpdateStatus(['id1', 'id2'], 'published')).resolves.toBeUndefined();
  });
});
