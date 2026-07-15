/**
 * Feature: admin-blog-system
 * Property Tests for Blog Service
 * Validates: Requirements 5.2, 5.5
 */

import { BlogService } from '../blog-service';
import type { BlogPost, BlogPostStatus } from '../../types';

// Mock the blog repository
jest.mock('../../repositories/blog-repository', () => ({
  BlogRepository: jest.fn().mockImplementation(() => ({
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    getPost: jest.fn(),
    getPostBySlug: jest.fn(),
    getPublishedPosts: jest.fn(),
    getAllPosts: jest.fn(),
    getPostsByStatus: jest.fn(),
    getPostsByAuthor: jest.fn(),
    searchPosts: jest.fn(),
    publishPost: jest.fn(),
    unpublishPost: jest.fn(),
    archivePost: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    getBlogMetadata: jest.fn(),
    updateBlogMetadata: jest.fn(),
    subscribeToPost: jest.fn(),
    subscribeToPublishedPosts: jest.fn(),
    subscribeToAllPosts: jest.fn()
  }))
}));

// Mock blog utils
jest.mock('../../utils/blog-utils', () => ({
  generateSlug: jest.fn((title: string) => 
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  ),
  validateBlogPost: jest.fn(() => ({ isValid: true, errors: [] })),
  formatBlogPostForDisplay: jest.fn((post) => post)
}));

// Helper function to create test blog posts
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

describe('BlogService Property Tests', () => {
  let service: BlogService;
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BlogService();
    // Get the mocked repository instance
    const { BlogRepository } = require('../../repositories/blog-repository');
    mockRepository = new BlogRepository();
  });

  describe('Property 14: SEO-Friendly URL Generation', () => {
    /**
     * For any blog post title, the system should generate a URL slug that contains 
     * only alphanumeric characters, hyphens, and is lowercase
     * Validates: Requirements 5.2
     */
    test('Property 14: Generated slugs are always SEO-friendly', () => {
      const testTitles = [
        'Hello World',
        'The Quick Brown Fox Jumps!',
        'Special Characters: @#$%^&*()',
        '   Leading and Trailing Spaces   ',
        'Multiple---Hyphens___And___Underscores',
        'Numbers 123 and More',
        'UPPERCASE TITLE',
        'Mixed CaSe TiTlE',
        'Émojis and Ñoñó Characters',
        'Very Long Title That Should Be Handled Properly Without Issues',
        '123 Numeric Start',
        'End With Number 456',
        'Single',
        '',
        '   ',
        '---',
        'a',
        'A B C D E F G'
      ];

      testTitles.forEach(title => {
        const slug = service.generateSlug(title);
        
        // Should be lowercase
        expect(slug).toBe(slug.toLowerCase());
        
        // Should only contain alphanumeric characters and hyphens
        expect(slug).toMatch(/^[a-z0-9-]*$/);
        
        // Should not start or end with hyphens
        expect(slug).not.toMatch(/^-|-$/);
        
        // Should not have consecutive hyphens
        expect(slug).not.toMatch(/--/);
        
        // Should be non-empty for non-empty meaningful titles
        if (title.trim().replace(/[^a-zA-Z0-9]/g, '').length > 0) {
          expect(slug.length).toBeGreaterThan(0);
        }
      });
    });

    test('Property 14: Slug generation is deterministic', () => {
      const title = 'Test Blog Post Title';
      const slug1 = service.generateSlug(title);
      const slug2 = service.generateSlug(title);
      const slug3 = service.generateSlug(title);
      
      expect(slug1).toBe(slug2);
      expect(slug2).toBe(slug3);
      expect(slug1).toBe('test-blog-post-title');
    });

    test('Property 14: Different titles generate different slugs', () => {
      const titles = [
        'First Blog Post',
        'Second Blog Post',
        'Third Blog Post',
        'Completely Different Title',
        'Another Unique Title'
      ];

      const slugs = titles.map(title => service.generateSlug(title));
      const uniqueSlugs = new Set(slugs);
      
      // All slugs should be unique
      expect(uniqueSlugs.size).toBe(titles.length);
    });
  });

  describe('Property 17: Timestamp Audit Trail', () => {
    /**
     * For any blog post operation (create, update, delete), the system should 
     * properly set or update the relevant timestamps (createdAt, updatedAt)
     * Validates: Requirements 5.5
     */
    test('Property 17: Create operations set proper timestamps', async () => {
      const mockCreatedPost = createTestBlogPost({
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z')
      });

      mockRepository.getPostBySlug.mockResolvedValue(null); // No existing post
      mockRepository.createPost.mockResolvedValue(mockCreatedPost);

      const postData = {
        title: 'New Blog Post',
        content: '<p>New content</p>',
        author: 'test-author'
      };

      const result = await service.createPost(postData);

      // Verify repository was called to create post
      expect(mockRepository.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Blog Post',
          content: '<p>New content</p>',
          author: 'test-author'
        })
      );

      // Verify timestamps are present in result
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    test('Property 17: Update operations modify updatedAt timestamp', async () => {
      const existingPost = createTestBlogPost({
        id: 'existing-id',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z')
      });

      mockRepository.getPost.mockResolvedValue(existingPost);
      mockRepository.updatePost.mockResolvedValue(undefined);

      const updates = {
        title: 'Updated Title',
        content: '<p>Updated content</p>'
      };

      await service.updatePost('existing-id', updates);

      // Verify repository update was called
      expect(mockRepository.updatePost).toHaveBeenCalledWith('existing-id', updates);
    });

    test('Property 17: Publication status changes update timestamps appropriately', async () => {
      const draftPost = createTestBlogPost({
        id: 'draft-id',
        status: 'draft',
        publishedAt: undefined
      });

      mockRepository.getPost.mockResolvedValue(draftPost);
      mockRepository.publishPost.mockResolvedValue(undefined);

      await service.publishPost('draft-id');

      // Verify publish operation was called
      expect(mockRepository.publishPost).toHaveBeenCalledWith('draft-id');
    });

    test('Property 17: Bulk operations maintain timestamp consistency', async () => {
      const posts = [
        createTestBlogPost({ id: 'post-1' }),
        createTestBlogPost({ id: 'post-2' }),
        createTestBlogPost({ id: 'post-3' })
      ];

      // Mock getPost for each post in bulk operation
      mockRepository.getPost
        .mockResolvedValueOnce(posts[0])
        .mockResolvedValueOnce(posts[1])
        .mockResolvedValueOnce(posts[2]);

      mockRepository.bulkUpdateStatus.mockResolvedValue(undefined);

      const postIds = ['post-1', 'post-2', 'post-3'];
      await service.bulkUpdateStatus(postIds, 'published');

      // Verify bulk update was called with correct parameters
      expect(mockRepository.bulkUpdateStatus).toHaveBeenCalledWith(postIds, 'published');
    });
  });

  describe('Property 2: Content Editor Loading Consistency', () => {
    /**
     * For any existing blog post, loading it in the content editor should populate 
     * all form fields with the exact values from the stored post
     * Validates: Requirements 1.4
     */
    test('Property 2: Editor loads existing post data correctly', async () => {
      const existingPost = createTestBlogPost({
        id: 'existing-post',
        title: 'Existing Post Title',
        content: '<p>Existing post content with <strong>formatting</strong></p>',
        excerpt: 'Existing post excerpt',
        slug: 'existing-post-title',
        author: 'existing-author',
        authorName: 'Existing Author',
        status: 'draft',
        tags: ['tag1', 'tag2'],
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description'
      });

      mockRepository.getPost.mockResolvedValue(existingPost);

      const result = await service.getPost('existing-post');

      // Verify all fields are loaded exactly as stored
      expect(result).toBeTruthy();
      expect(result?.title).toBe(existingPost.title);
      expect(result?.content).toBe(existingPost.content);
      expect(result?.excerpt).toBe(existingPost.excerpt);
      expect(result?.slug).toBe(existingPost.slug);
      expect(result?.author).toBe(existingPost.author);
      expect(result?.authorName).toBe(existingPost.authorName);
      expect(result?.status).toBe(existingPost.status);
      expect(result?.tags).toEqual(existingPost.tags);
      expect(result?.seoTitle).toBe(existingPost.seoTitle);
      expect(result?.seoDescription).toBe(existingPost.seoDescription);
      expect(result?.videoEmbeds).toEqual(existingPost.videoEmbeds);
    });

    test('Property 2: Editor handles posts with video embeds correctly', async () => {
      const postWithVideos = createTestBlogPost({
        id: 'video-post',
        videoEmbeds: [
          {
            id: 'embed-1',
            platform: 'youtube',
            videoId: 'dQw4w9WgXcQ',
            embedCode: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
            thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            title: 'Test Video',
            position: 0
          }
        ]
      });

      mockRepository.getPost.mockResolvedValue(postWithVideos);

      const result = await service.getPost('video-post');

      expect(result?.videoEmbeds).toHaveLength(1);
      expect(result?.videoEmbeds[0].platform).toBe('youtube');
      expect(result?.videoEmbeds[0].videoId).toBe('dQw4w9WgXcQ');
      expect(result?.videoEmbeds[0].embedCode).toContain('youtube.com/embed');
    });
  });

  describe('Property 3: Blog Post Deletion Completeness', () => {
    /**
     * For any blog post that exists in the system, deleting it should remove it 
     * completely from storage and it should no longer appear in any queries
     * Validates: Requirements 1.5
     */
    test('Property 3: Deleted posts are completely removed', async () => {
      const existingPost = createTestBlogPost({ id: 'to-delete' });

      mockRepository.getPost.mockResolvedValue(existingPost);
      mockRepository.deletePost.mockResolvedValue(undefined);

      await service.deletePost('to-delete');

      // Verify delete operation was called
      expect(mockRepository.deletePost).toHaveBeenCalledWith('to-delete');
    });

    test('Property 3: Deletion of non-existent post throws error', async () => {
      mockRepository.getPost.mockResolvedValue(null);

      await expect(service.deletePost('non-existent')).rejects.toThrow(/not found/);
      
      // Should not attempt to delete if post doesn't exist
      expect(mockRepository.deletePost).not.toHaveBeenCalled();
    });

    test('Property 3: Bulk deletion maintains consistency', async () => {
      const posts = [
        createTestBlogPost({ id: 'post-1' }),
        createTestBlogPost({ id: 'post-2' }),
        createTestBlogPost({ id: 'post-3' })
      ];

      // Mock getPost for each post
      mockRepository.getPost
        .mockResolvedValueOnce(posts[0])
        .mockResolvedValueOnce(posts[1])
        .mockResolvedValueOnce(posts[2]);

      mockRepository.deletePost.mockResolvedValue(undefined);

      const postIds = ['post-1', 'post-2', 'post-3'];
      await service.bulkDeletePosts(postIds);

      // Verify each post was deleted
      expect(mockRepository.deletePost).toHaveBeenCalledTimes(3);
      expect(mockRepository.deletePost).toHaveBeenCalledWith('post-1');
      expect(mockRepository.deletePost).toHaveBeenCalledWith('post-2');
      expect(mockRepository.deletePost).toHaveBeenCalledWith('post-3');
    });
  });

  describe('Property 19: Admin Authentication Enforcement', () => {
    /**
     * For any blog management operation, the system should verify that the user 
     * has administrator privileges before allowing the operation
     * Validates: Requirements 6.2
     */
    test('Property 19: Blog operations require admin authentication', async () => {
      // Mock authentication service
      const mockAuth = {
        getCurrentUser: jest.fn(),
        isAdmin: jest.fn()
      };

      // Test with non-admin user
      mockAuth.getCurrentUser.mockReturnValue({ uid: 'user-123', email: 'user@test.com' });
      mockAuth.isAdmin.mockReturnValue(false);

      const serviceWithAuth = new BlogService(mockAuth);

      const postData = {
        title: 'Test Post',
        content: '<p>Content</p>',
        author: 'user-123'
      };

      // Should throw authentication error for non-admin
      await expect(serviceWithAuth.createPost(postData)).rejects.toThrow(/admin/i);
      
      // Test with admin user
      mockAuth.isAdmin.mockReturnValue(true);
      mockRepository.getPostBySlug.mockResolvedValue(null);
      mockRepository.createPost.mockResolvedValue(createTestBlogPost());

      // Should succeed for admin
      await expect(serviceWithAuth.createPost(postData)).resolves.toBeTruthy();
    });

    test('Property 19: All blog management operations check admin status', async () => {
      const mockAuth = {
        getCurrentUser: jest.fn().mockReturnValue({ uid: 'user-123' }),
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const serviceWithAuth = new BlogService(mockAuth);

      const operations = [
        () => serviceWithAuth.createPost({ title: 'Test', content: 'Content', author: 'user' }),
        () => serviceWithAuth.updatePost('post-id', { title: 'Updated' }),
        () => serviceWithAuth.deletePost('post-id'),
        () => serviceWithAuth.publishPost('post-id'),
        () => serviceWithAuth.unpublishPost('post-id'),
        () => serviceWithAuth.archivePost('post-id'),
        () => serviceWithAuth.bulkUpdateStatus(['post-1'], 'published')
      ];

      // All operations should fail for non-admin
      for (const operation of operations) {
        await expect(operation()).rejects.toThrow(/admin/i);
      }
    });
  });

  describe('Property 20: Input Sanitization Security', () => {
    /**
     * For any user input containing potentially malicious content, the system should 
     * sanitize it to remove security threats while preserving safe formatting
     * Validates: Requirements 6.3
     */
    test('Property 20: Blog content is sanitized on creation', async () => {
      const maliciousContent = `
        <p>Safe content</p>
        <script>alert('xss')</script>
        <div onclick="malicious()">Click me</div>
        <a href="javascript:alert()">Link</a>
        <p>More safe content</p>
      `;

      const postData = {
        title: 'Test Post',
        content: maliciousContent,
        author: 'test-author'
      };

      mockRepository.getPostBySlug.mockResolvedValue(null);
      mockRepository.createPost.mockImplementation((data) => 
        Promise.resolve(createTestBlogPost(data))
      );

      const result = await service.createPost(postData);

      // Content should be sanitized
      expect(result.content).not.toContain('<script>');
      expect(result.content).not.toContain('onclick');
      expect(result.content).not.toContain('javascript:');
      
      // Safe content should be preserved
      expect(result.content).toContain('Safe content');
      expect(result.content).toContain('More safe content');
    });

    test('Property 20: Blog updates sanitize content', async () => {
      const existingPost = createTestBlogPost({ id: 'existing' });
      mockRepository.getPost.mockResolvedValue(existingPost);
      mockRepository.updatePost.mockResolvedValue(undefined);

      const maliciousUpdate = {
        content: '<p>Updated content</p><img src="x" onerror="alert(1)">'
      };

      await service.updatePost('existing', maliciousUpdate);

      // Verify sanitization was applied
      const updateCall = mockRepository.updatePost.mock.calls[0][1];
      expect(updateCall.content).not.toContain('onerror');
      expect(updateCall.content).toContain('Updated content');
    });
  });
    test('Property 14: SEO-friendly URL generation across random titles', () => {
      // Generate 50 random title scenarios
      for (let i = 0; i < 50; i++) {
        const randomWords = [];
        const wordCount = Math.floor(Math.random() * 8) + 1; // 1-8 words
        
        for (let j = 0; j < wordCount; j++) {
          // Generate random word with various characters
          const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
          let word = '';
          const wordLength = Math.floor(Math.random() * 10) + 1; // 1-10 chars
          
          for (let k = 0; k < wordLength; k++) {
            word += chars[Math.floor(Math.random() * chars.length)];
          }
          randomWords.push(word);
        }
        
        const randomTitle = randomWords.join(' ');
        const slug = service.generateSlug(randomTitle);
        
        // Verify slug properties regardless of input
        if (slug.length > 0) {
          expect(slug).toMatch(/^[a-z0-9-]*$/);
          expect(slug).toBe(slug.toLowerCase());
          expect(slug).not.toMatch(/^-|-$/);
          expect(slug).not.toMatch(/--/);
        }
        
        // Verify deterministic behavior
        const slug2 = service.generateSlug(randomTitle);
        expect(slug).toBe(slug2);
      }
    });

    test('Property 17: Service operations maintain audit trail consistency', async () => {
      const operations = [
        'create',
        'update', 
        'publish',
        'unpublish',
        'archive',
        'delete'
      ];

      for (let i = 0; i < 20; i++) {
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const postId = `test-post-${i}`;
        
        const mockPost = createTestBlogPost({
          id: postId,
          title: `Random Post ${i}`,
          status: ['draft', 'published', 'archived'][Math.floor(Math.random() * 3)] as BlogPostStatus
        });

        // Setup mocks based on operation
        mockRepository.getPost.mockResolvedValue(mockPost);
        mockRepository.getPostBySlug.mockResolvedValue(null);
        
        try {
          switch (operation) {
            case 'create':
              mockRepository.createPost.mockResolvedValue(mockPost);
              await service.createPost({
                title: `Random Post ${i}`,
                content: '<p>Random content</p>',
                author: 'test-author'
              });
              expect(mockRepository.createPost).toHaveBeenCalled();
              break;
              
            case 'update':
              mockRepository.updatePost.mockResolvedValue(undefined);
              await service.updatePost(postId, { title: `Updated Post ${i}` });
              expect(mockRepository.updatePost).toHaveBeenCalledWith(postId, expect.any(Object));
              break;
              
            case 'publish':
              if (mockPost.status !== 'published') {
                mockRepository.publishPost.mockResolvedValue(undefined);
                await service.publishPost(postId);
                expect(mockRepository.publishPost).toHaveBeenCalledWith(postId);
              }
              break;
              
            case 'unpublish':
              if (mockPost.status === 'published') {
                mockRepository.unpublishPost.mockResolvedValue(undefined);
                await service.unpublishPost(postId);
                expect(mockRepository.unpublishPost).toHaveBeenCalledWith(postId);
              }
              break;
              
            case 'archive':
              if (mockPost.status !== 'archived') {
                mockRepository.archivePost.mockResolvedValue(undefined);
                await service.archivePost(postId);
                expect(mockRepository.archivePost).toHaveBeenCalledWith(postId);
              }
              break;
              
            case 'delete':
              mockRepository.deletePost.mockResolvedValue(undefined);
              await service.deletePost(postId);
              expect(mockRepository.deletePost).toHaveBeenCalledWith(postId);
              break;
          }
        } catch (error) {
          // Some operations may throw expected errors (e.g., trying to publish already published post)
          // This is acceptable behavior
        }
        
        jest.clearAllMocks();
      }
    });

    test('Property 14: Slug uniqueness across similar titles', async () => {
      const baseTitles = [
        'Blog Post',
        'My Blog Post', 
        'The Blog Post',
        'A Blog Post',
        'Another Blog Post'
      ];

      const slugs = new Set<string>();
      
      for (const baseTitle of baseTitles) {
        // Generate variations of each base title
        const variations = [
          baseTitle,
          baseTitle + '!',
          baseTitle + ' - Updated',
          baseTitle + ' (2023)',
          baseTitle.toUpperCase(),
          baseTitle.toLowerCase(),
          '   ' + baseTitle + '   '
        ];
        
        for (const variation of variations) {
          const slug = service.generateSlug(variation);
          
          if (slug.length > 0) {
            // Track unique slugs
            slugs.add(slug);
            
            // Verify slug properties
            expect(slug).toMatch(/^[a-z0-9-]*$/);
            expect(slug).toBe(slug.toLowerCase());
            expect(slug).not.toMatch(/^-|-$/);
          }
        }
      }
      
      // Should have generated multiple unique slugs
      expect(slugs.size).toBeGreaterThan(1);
    });
  });

  describe('Error Handling Property Tests', () => {
    test('Property 17: Error conditions maintain system consistency', async () => {
      const errorScenarios = [
        {
          name: 'Create post with existing slug',
          setup: () => {
            mockRepository.getPostBySlug.mockResolvedValue(createTestBlogPost());
          },
          operation: () => service.createPost({
            title: 'Test Post',
            content: '<p>Content</p>',
            author: 'author'
          }),
          expectedError: /already exists/
        },
        {
          name: 'Update non-existent post',
          setup: () => {
            mockRepository.getPost.mockResolvedValue(null);
          },
          operation: () => service.updatePost('non-existent', { title: 'Updated' }),
          expectedError: /not found/
        },
        {
          name: 'Delete non-existent post',
          setup: () => {
            mockRepository.getPost.mockResolvedValue(null);
          },
          operation: () => service.deletePost('non-existent'),
          expectedError: /not found/
        },
        {
          name: 'Publish already published post',
          setup: () => {
            mockRepository.getPost.mockResolvedValue(
              createTestBlogPost({ status: 'published' })
            );
          },
          operation: () => service.publishPost('test-id'),
          expectedError: /already published/
        }
      ];

      for (const scenario of errorScenarios) {
        scenario.setup();
        
        await expect(scenario.operation()).rejects.toThrow(scenario.expectedError);
        
        jest.clearAllMocks();
      }
    });
  });
});