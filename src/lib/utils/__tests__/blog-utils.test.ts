/**
 * Feature: admin-blog-system, Property 1: Blog Post Storage Integrity
 * Validates: Requirements 1.3
 */

import { 
  generateSlug, 
  generateExcerpt, 
  validateBlogPost, 
  sanitizeHtmlContent,
  formatBlogPostForDisplay,
  isBlogPostPublic,
  sortBlogPostsByDate,
  filterBlogPostsByStatus,
  searchBlogPosts
} from '../blog-utils';
import type { BlogPost, BlogPostStatus } from '../../types';

// Helper function to create test blog posts
function createBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  const now = new Date();
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

describe('Blog Utils', () => {
  describe('generateSlug', () => {
    test('Property 1: Slug generation preserves essential information', () => {
      const testCases = [
        { title: 'Hello World', expected: 'hello-world' },
        { title: 'The Quick Brown Fox!', expected: 'the-quick-brown-fox' },
        { title: 'Special Characters: @#$%^&*()', expected: 'special-characters' },
        { title: '   Leading and Trailing Spaces   ', expected: 'leading-and-trailing-spaces' },
        { title: 'Multiple---Hyphens___And___Underscores', expected: 'multiple-hyphens-and-underscores' },
        { title: 'Numbers 123 and More', expected: 'numbers-123-and-more' }
      ];

      testCases.forEach(({ title, expected }) => {
        const result = generateSlug(title);
        expect(result).toBe(expected);
        
        // Verify slug is URL-safe
        expect(result).toMatch(/^[a-z0-9-]*$/);
        expect(result).not.toMatch(/^-|-$/); // No leading/trailing hyphens
      });
    });

    test('Property 1: Slug generation is deterministic', () => {
      const title = 'Test Blog Post Title';
      const slug1 = generateSlug(title);
      const slug2 = generateSlug(title);
      expect(slug1).toBe(slug2);
    });
  });

  describe('generateExcerpt', () => {
    test('Property 1: Excerpt preserves content meaning while removing HTML', () => {
      const testCases = [
        {
          content: '<p>This is a <strong>test</strong> paragraph with <em>formatting</em>.</p>',
          expected: 'This is a test paragraph with formatting.'
        },
        {
          content: '<h1>Title</h1><p>Content with &amp; entities &lt;script&gt;</p>',
          expected: 'Title\n\nContent with & entities <script>'
        },
        {
          content: '<div>Short content</div>',
          expected: 'Short content'
        }
      ];

      testCases.forEach(({ content, expected }) => {
        const result = generateExcerpt(content);
        expect(result.replace(/\s+/g, ' ').trim()).toBe(expected.replace(/\s+/g, ' ').trim());
      });
    });

    test('Property 1: Excerpt respects length limits', () => {
      const longContent = '<p>' + 'A'.repeat(1000) + '</p>';
      const excerpt = generateExcerpt(longContent, 50);
      
      expect(excerpt.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(excerpt.endsWith('...')).toBe(true);
    });
  });

  describe('validateBlogPost', () => {
    test('Property 1: Valid blog posts pass validation', () => {
      const validPost = createBlogPost({
        title: 'Valid Title',
        content: '<p>Valid content</p>',
        author: 'valid-author'
      });

      const result = validateBlogPost(validPost);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Property 1: Invalid blog posts fail validation with specific errors', () => {
      const invalidPost = createBlogPost({
        title: '', // Invalid: empty title
        content: '', // Invalid: empty content
        author: '', // Invalid: empty author
        slug: 'Invalid Slug!', // Invalid: contains spaces and special chars
        status: 'invalid' as BlogPostStatus // Invalid: bad status
      });

      const result = validateBlogPost(invalidPost);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for specific error types
      expect(result.errors.some(error => error.includes('Title'))).toBe(true);
      expect(result.errors.some(error => error.includes('Content'))).toBe(true);
      expect(result.errors.some(error => error.includes('Author'))).toBe(true);
    });
  });

  describe('sanitizeHtmlContent', () => {
    test('Property 1: Malicious content is removed while safe content is preserved', () => {
      const testCases = [
        {
          input: '<p>Safe content</p><script>alert("xss")</script>',
          shouldNotContain: ['<script>', 'alert']
        },
        {
          input: '<div onclick="malicious()">Click me</div>',
          shouldNotContain: ['onclick', 'malicious']
        },
        {
          input: '<a href="javascript:alert()">Link</a>',
          shouldNotContain: ['javascript:']
        },
        {
          input: '<p>Safe <strong>formatting</strong> should remain</p>',
          shouldContain: ['<p>', '<strong>', 'formatting']
        }
      ];

      testCases.forEach(({ input, shouldNotContain, shouldContain }) => {
        const result = sanitizeHtmlContent(input);
        
        if (shouldNotContain) {
          shouldNotContain.forEach(dangerous => {
            expect(result.toLowerCase()).not.toContain(dangerous.toLowerCase());
          });
        }
        
        if (shouldContain) {
          shouldContain.forEach(safe => {
            expect(result).toContain(safe);
          });
        }
      });
    });
  });

  describe('formatBlogPostForDisplay', () => {
    test('Property 1: Formatted posts maintain data integrity', () => {
      const originalPost = createBlogPost({
        title: 'Original Title',
        content: '<p>Original content</p><script>alert("test")</script>',
        excerpt: '', // Should be auto-generated
        slug: '' // Should be auto-generated
      });

      const formatted = formatBlogPostForDisplay(originalPost);
      
      // Original data should be preserved
      expect(formatted.id).toBe(originalPost.id);
      expect(formatted.title).toBe(originalPost.title);
      expect(formatted.author).toBe(originalPost.author);
      expect(formatted.status).toBe(originalPost.status);
      
      // Content should be sanitized
      expect(formatted.content).not.toContain('<script>');
      expect(formatted.content).toContain('<p>Original content</p>');
      
      // Auto-generated fields should be populated
      expect(formatted.excerpt).toBeTruthy();
      expect(formatted.slug).toBeTruthy();
      expect(formatted.slug).toBe('original-title');
    });
  });

  describe('isBlogPostPublic', () => {
    test('Property 1: Only published posts with publish date are public', () => {
      const testCases = [
        { status: 'published' as BlogPostStatus, publishedAt: new Date(), expected: true },
        { status: 'published' as BlogPostStatus, publishedAt: undefined, expected: false },
        { status: 'draft' as BlogPostStatus, publishedAt: new Date(), expected: false },
        { status: 'archived' as BlogPostStatus, publishedAt: new Date(), expected: false }
      ];

      testCases.forEach(({ status, publishedAt, expected }) => {
        const post = createBlogPost({ status, publishedAt });
        expect(isBlogPostPublic(post)).toBe(expected);
      });
    });
  });

  describe('sortBlogPostsByDate', () => {
    test('Property 1: Posts are sorted by date (newest first)', () => {
      const posts = [
        createBlogPost({ 
          id: '1', 
          publishedAt: new Date('2023-01-01'),
          createdAt: new Date('2023-01-01')
        }),
        createBlogPost({ 
          id: '2', 
          publishedAt: new Date('2023-03-01'),
          createdAt: new Date('2023-03-01')
        }),
        createBlogPost({ 
          id: '3', 
          publishedAt: new Date('2023-02-01'),
          createdAt: new Date('2023-02-01')
        })
      ];

      const sorted = sortBlogPostsByDate(posts);
      
      // Should be sorted newest first
      expect(sorted[0].id).toBe('2'); // March
      expect(sorted[1].id).toBe('3'); // February
      expect(sorted[2].id).toBe('1'); // January
      
      // Original array should not be mutated
      expect(posts[0].id).toBe('1');
    });
  });

  describe('filterBlogPostsByStatus', () => {
    test('Property 1: Filtering returns only posts with matching status', () => {
      const posts = [
        createBlogPost({ id: '1', status: 'draft' }),
        createBlogPost({ id: '2', status: 'published' }),
        createBlogPost({ id: '3', status: 'draft' }),
        createBlogPost({ id: '4', status: 'archived' })
      ];

      const draftPosts = filterBlogPostsByStatus(posts, 'draft');
      const publishedPosts = filterBlogPostsByStatus(posts, 'published');
      const archivedPosts = filterBlogPostsByStatus(posts, 'archived');

      expect(draftPosts).toHaveLength(2);
      expect(draftPosts.every(post => post.status === 'draft')).toBe(true);
      
      expect(publishedPosts).toHaveLength(1);
      expect(publishedPosts[0].status).toBe('published');
      
      expect(archivedPosts).toHaveLength(1);
      expect(archivedPosts[0].status).toBe('archived');
    });
  });

  describe('searchBlogPosts', () => {
    test('Property 1: Search finds posts containing query terms', () => {
      const posts = [
        createBlogPost({ 
          id: '1', 
          title: 'JavaScript Tutorial',
          content: '<p>Learn JavaScript programming</p>'
        }),
        createBlogPost({ 
          id: '2', 
          title: 'Python Guide',
          content: '<p>Python programming basics</p>'
        }),
        createBlogPost({ 
          id: '3', 
          title: 'Web Development',
          content: '<p>HTML, CSS, and JavaScript</p>'
        })
      ];

      const jsResults = searchBlogPosts(posts, 'JavaScript');
      const programmingResults = searchBlogPosts(posts, 'programming');
      const emptyResults = searchBlogPosts(posts, 'nonexistent');

      expect(jsResults).toHaveLength(2); // Posts 1 and 3
      expect(jsResults.every(post => 
        post.title.toLowerCase().includes('javascript') || 
        post.content.toLowerCase().includes('javascript')
      )).toBe(true);

      expect(programmingResults).toHaveLength(2); // Posts 1 and 2
      expect(emptyResults).toHaveLength(0);
    });
  });

  describe('Property 6: Preview and Final Rendering Consistency', () => {
    /**
     * For any blog post content, the preview mode should render the same HTML output 
     * as the final public display
     * Validates: Requirements 2.5
     */
    test('Property 6: Preview rendering matches final display', () => {
      const testContents = [
        '<p>Simple paragraph content</p>',
        '<h1>Title</h1><p>Content with <strong>bold</strong> and <em>italic</em></p>',
        '<ul><li>List item 1</li><li>List item 2</li></ul>',
        '<blockquote>This is a quote</blockquote>',
        '<p>Content with <a href="https://example.com">link</a></p>',
        '<div class="video-embed"><iframe src="https://www.youtube.com/embed/test"></iframe></div>'
      ];

      testContents.forEach(content => {
        const previewFormatted = formatBlogPostForDisplay(createBlogPost({ content }));
        const finalFormatted = formatBlogPostForDisplay(createBlogPost({ content }));
        
        // Preview and final should produce identical output
        expect(previewFormatted.content).toBe(finalFormatted.content);
        expect(previewFormatted.excerpt).toBe(finalFormatted.excerpt);
        
        // Both should be sanitized consistently
        expect(previewFormatted.content).not.toContain('<script>');
        expect(finalFormatted.content).not.toContain('<script>');
      });
    });

    test('Property 6: Formatting consistency across multiple calls', () => {
      const post = createBlogPost({
        content: '<p>Test content with <strong>formatting</strong></p>',
        excerpt: '', // Will be auto-generated
        slug: '' // Will be auto-generated
      });

      const formatted1 = formatBlogPostForDisplay(post);
      const formatted2 = formatBlogPostForDisplay(post);
      const formatted3 = formatBlogPostForDisplay(post);

      // All formatting calls should produce identical results
      expect(formatted1.content).toBe(formatted2.content);
      expect(formatted2.content).toBe(formatted3.content);
      expect(formatted1.excerpt).toBe(formatted2.excerpt);
      expect(formatted2.excerpt).toBe(formatted3.excerpt);
      expect(formatted1.slug).toBe(formatted2.slug);
      expect(formatted2.slug).toBe(formatted3.slug);
    });
  });

  describe('Property 9: Status Display Accuracy', () => {
    /**
     * For any blog post with a publication status, the admin dashboard display 
     * should show the correct status indicator
     * Validates: Requirements 3.4
     */
    test('Property 9: Status indicators match post status', () => {
      const statuses: BlogPostStatus[] = ['draft', 'published', 'archived'];
      
      statuses.forEach(status => {
        const post = createBlogPost({ status });
        const formatted = formatBlogPostForDisplay(post);
        
        // Status should be preserved and accurate
        expect(formatted.status).toBe(status);
        
        // Public visibility should match status
        const isPublic = isBlogPostPublic(formatted);
        if (status === 'published' && formatted.publishedAt) {
          expect(isPublic).toBe(true);
        } else {
          expect(isPublic).toBe(false);
        }
      });
    });

    test('Property 9: Status filtering accuracy', () => {
      const posts = [
        createBlogPost({ id: '1', status: 'draft' }),
        createBlogPost({ id: '2', status: 'published', publishedAt: new Date() }),
        createBlogPost({ id: '3', status: 'archived' }),
        createBlogPost({ id: '4', status: 'draft' }),
        createBlogPost({ id: '5', status: 'published', publishedAt: new Date() })
      ];

      const draftPosts = filterBlogPostsByStatus(posts, 'draft');
      const publishedPosts = filterBlogPostsByStatus(posts, 'published');
      const archivedPosts = filterBlogPostsByStatus(posts, 'archived');

      // Verify filtering accuracy
      expect(draftPosts).toHaveLength(2);
      expect(draftPosts.every(post => post.status === 'draft')).toBe(true);
      
      expect(publishedPosts).toHaveLength(2);
      expect(publishedPosts.every(post => post.status === 'published')).toBe(true);
      
      expect(archivedPosts).toHaveLength(1);
      expect(archivedPosts.every(post => post.status === 'archived')).toBe(true);
    });
  });

  describe('Property 11: Published Posts Chronological Ordering', () => {
    /**
     * For any set of published blog posts, the public blog page should display them 
     * in reverse chronological order (newest first)
     * Validates: Requirements 4.2
     */
    test('Property 11: Posts are sorted newest first', () => {
      const posts = [
        createBlogPost({ 
          id: '1', 
          publishedAt: new Date('2023-01-01'),
          createdAt: new Date('2023-01-01')
        }),
        createBlogPost({ 
          id: '2', 
          publishedAt: new Date('2023-03-01'),
          createdAt: new Date('2023-03-01')
        }),
        createBlogPost({ 
          id: '3', 
          publishedAt: new Date('2023-02-01'),
          createdAt: new Date('2023-02-01')
        }),
        createBlogPost({ 
          id: '4', 
          publishedAt: new Date('2023-04-01'),
          createdAt: new Date('2023-04-01')
        })
      ];

      const sorted = sortBlogPostsByDate(posts);
      
      // Should be in reverse chronological order (newest first)
      expect(sorted[0].id).toBe('4'); // April (newest)
      expect(sorted[1].id).toBe('2'); // March
      expect(sorted[2].id).toBe('3'); // February
      expect(sorted[3].id).toBe('1'); // January (oldest)
      
      // Verify dates are actually in descending order
      for (let i = 0; i < sorted.length - 1; i++) {
        const currentDate = sorted[i].publishedAt || sorted[i].createdAt;
        const nextDate = sorted[i + 1].publishedAt || sorted[i + 1].createdAt;
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    test('Property 11: Sorting handles missing publishedAt dates', () => {
      const posts = [
        createBlogPost({ 
          id: '1', 
          publishedAt: undefined,
          createdAt: new Date('2023-01-01')
        }),
        createBlogPost({ 
          id: '2', 
          publishedAt: new Date('2023-02-01'),
          createdAt: new Date('2023-02-01')
        }),
        createBlogPost({ 
          id: '3', 
          publishedAt: undefined,
          createdAt: new Date('2023-03-01')
        })
      ];

      const sorted = sortBlogPostsByDate(posts);
      
      // Should fall back to createdAt when publishedAt is missing
      expect(sorted[0].id).toBe('3'); // March (newest createdAt)
      expect(sorted[1].id).toBe('2'); // February (has publishedAt)
      expect(sorted[2].id).toBe('1'); // January (oldest createdAt)
    });
  });

  describe('Property 12: Blog Post Display Completeness', () => {
    /**
     * For any blog post displayed in the public interface, the rendered output should 
     * include title, publication date, author, and content preview
     * Validates: Requirements 4.3
     */
    test('Property 12: Public display includes all required fields', () => {
      const post = createBlogPost({
        title: 'Complete Blog Post',
        content: '<p>This is the full content of the blog post with more details.</p>',
        author: 'test-author',
        authorName: 'Test Author',
        publishedAt: new Date('2023-01-15'),
        status: 'published'
      });

      const formatted = formatBlogPostForDisplay(post);
      
      // Verify all required display fields are present
      expect(formatted.title).toBeTruthy();
      expect(formatted.title).toBe('Complete Blog Post');
      
      expect(formatted.authorName).toBeTruthy();
      expect(formatted.authorName).toBe('Test Author');
      
      expect(formatted.publishedAt).toBeTruthy();
      expect(formatted.publishedAt).toBeInstanceOf(Date);
      
      expect(formatted.excerpt).toBeTruthy();
      expect(formatted.excerpt.length).toBeGreaterThan(0);
      
      expect(formatted.content).toBeTruthy();
      expect(formatted.content).toContain('full content');
    });

    test('Property 12: Display formatting preserves essential information', () => {
      const posts = [
        createBlogPost({ 
          title: 'Short Title',
          content: '<p>Short content.</p>',
          authorName: 'Author One'
        }),
        createBlogPost({ 
          title: 'Very Long Title That Should Be Handled Properly Without Truncation Issues',
          content: '<p>' + 'Long content. '.repeat(100) + '</p>',
          authorName: 'Author With A Very Long Name'
        }),
        createBlogPost({ 
          title: 'Title with Special Characters: @#$%^&*()',
          content: '<p>Content with <strong>HTML</strong> and <em>formatting</em>.</p>',
          authorName: 'Special Author'
        })
      ];

      posts.forEach(post => {
        const formatted = formatBlogPostForDisplay(post);
        
        // Essential information should be preserved
        expect(formatted.title).toBe(post.title);
        expect(formatted.authorName).toBe(post.authorName);
        expect(formatted.content).toContain('content');
        expect(formatted.excerpt).toBeTruthy();
        
        // HTML should be sanitized but structure preserved
        if (post.content.includes('<strong>')) {
          expect(formatted.content).toContain('<strong>');
        }
        if (post.content.includes('<em>')) {
          expect(formatted.content).toContain('<em>');
        }
      });
    });
  });

  describe('Property 13: Full Post Content Display', () => {
    /**
     * For any individual blog post page, the displayed content should include 
     * all post content including any embedded videos
     * Validates: Requirements 4.4
     */
    test('Property 13: Full content display includes all elements', () => {
      const postWithVideo = createBlogPost({
        title: 'Post with Video',
        content: `
          <p>Introduction paragraph.</p>
          <div class="video-embed">
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
          </div>
          <p>Conclusion paragraph.</p>
        `,
        videoEmbeds: [{
          id: 'embed-1',
          platform: 'youtube',
          videoId: 'dQw4w9WgXcQ',
          embedCode: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          title: 'Test Video',
          position: 0
        }]
      });

      const formatted = formatBlogPostForDisplay(postWithVideo);
      
      // Full content should be preserved
      expect(formatted.content).toContain('Introduction paragraph');
      expect(formatted.content).toContain('Conclusion paragraph');
      expect(formatted.content).toContain('youtube.com/embed');
      
      // Video embeds should be preserved
      expect(formatted.videoEmbeds).toHaveLength(1);
      expect(formatted.videoEmbeds[0].platform).toBe('youtube');
      expect(formatted.videoEmbeds[0].videoId).toBe('dQw4w9WgXcQ');
    });

    test('Property 13: Content with multiple media types is preserved', () => {
      const richContent = `
        <h1>Main Title</h1>
        <p>Introduction with <a href="https://example.com">external link</a>.</p>
        <blockquote>Important quote from source.</blockquote>
        <ul>
          <li>First point</li>
          <li>Second point</li>
        </ul>
        <div class="video-embed">
          <iframe src="https://player.vimeo.com/video/123456789"></iframe>
        </div>
        <p>Final paragraph with <strong>emphasis</strong>.</p>
      `;

      const post = createBlogPost({ content: richContent });
      const formatted = formatBlogPostForDisplay(post);
      
      // All content types should be preserved
      expect(formatted.content).toContain('<h1>Main Title</h1>');
      expect(formatted.content).toContain('<blockquote>');
      expect(formatted.content).toContain('<ul>');
      expect(formatted.content).toContain('<li>');
      expect(formatted.content).toContain('vimeo.com/video');
      expect(formatted.content).toContain('<strong>emphasis</strong>');
      expect(formatted.content).toContain('href="https://example.com"');
    });
  });

  describe('Property 15: Post Metadata Display Requirements', () => {
    /**
     * For any blog post display, the rendered output should include 
     * publication date and author information
     * Validates: Requirements 5.3
     */
    test('Property 15: Metadata is always included in display', () => {
      const testCases = [
        {
          post: createBlogPost({
            authorName: 'John Doe',
            publishedAt: new Date('2023-01-15T10:30:00Z'),
            status: 'published'
          }),
          expectedAuthor: 'John Doe',
          expectedDate: new Date('2023-01-15T10:30:00Z')
        },
        {
          post: createBlogPost({
            authorName: 'Jane Smith',
            publishedAt: undefined,
            createdAt: new Date('2023-02-20T14:45:00Z'),
            status: 'draft'
          }),
          expectedAuthor: 'Jane Smith',
          expectedDate: new Date('2023-02-20T14:45:00Z')
        }
      ];

      testCases.forEach(({ post, expectedAuthor, expectedDate }) => {
        const formatted = formatBlogPostForDisplay(post);
        
        // Author information should be present
        expect(formatted.authorName).toBe(expectedAuthor);
        expect(formatted.author).toBeTruthy();
        
        // Date information should be present
        const displayDate = formatted.publishedAt || formatted.createdAt;
        expect(displayDate).toBeInstanceOf(Date);
        expect(displayDate.getTime()).toBe(expectedDate.getTime());
      });
    });

    test('Property 15: Metadata formatting is consistent', () => {
      const posts = Array.from({ length: 10 }, (_, i) => 
        createBlogPost({
          authorName: `Author ${i + 1}`,
          publishedAt: new Date(`2023-0${(i % 9) + 1}-01`),
          status: 'published'
        })
      );

      posts.forEach(post => {
        const formatted = formatBlogPostForDisplay(post);
        
        // Metadata should always be present and properly typed
        expect(typeof formatted.authorName).toBe('string');
        expect(formatted.authorName.length).toBeGreaterThan(0);
        expect(formatted.publishedAt).toBeInstanceOf(Date);
        expect(formatted.createdAt).toBeInstanceOf(Date);
        expect(formatted.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  // Property-based tests with random data
  describe('Property-based tests', () => {
    test('Property 1: Blog post storage integrity across random inputs', () => {
      // Generate 50 random blog post scenarios
      for (let i = 0; i < 50; i++) {
        const randomTitle = `Test Title ${i} ${Math.random().toString(36).substring(7)}`;
        const randomContent = `<p>Content ${i}: ${'A'.repeat(Math.floor(Math.random() * 100))}</p>`;
        const randomAuthor = `author-${i}`;
        
        const post = createBlogPost({
          title: randomTitle,
          content: randomContent,
          author: randomAuthor
        });

        // Test slug generation consistency
        const slug1 = generateSlug(post.title);
        const slug2 = generateSlug(post.title);
        expect(slug1).toBe(slug2);
        expect(slug1).toMatch(/^[a-z0-9-]*$/);

        // Test excerpt generation
        const excerpt = generateExcerpt(post.content);
        expect(excerpt.length).toBeGreaterThan(0);
        expect(excerpt).not.toContain('<');
        expect(excerpt).not.toContain('>');

        // Test validation
        const validation = validateBlogPost(post);
        expect(validation.isValid).toBe(true);

        // Test formatting preserves core data
        const formatted = formatBlogPostForDisplay(post);
        expect(formatted.id).toBe(post.id);
        expect(formatted.title).toBe(post.title);
        expect(formatted.author).toBe(post.author);
        expect(formatted.status).toBe(post.status);
      }
    });

    test('Property 1: Malicious content is always sanitized', () => {
      const maliciousPatterns = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<div onclick="malicious()">',
        '<a href="javascript:alert()">',
        '<iframe src="javascript:alert()">',
        '<object data="javascript:alert()">',
        '<embed src="javascript:alert()">'
      ];

      maliciousPatterns.forEach(pattern => {
        const content = `<p>Safe content</p>${pattern}<p>More safe content</p>`;
        const sanitized = sanitizeHtmlContent(content);
        
        // Should not contain dangerous patterns
        expect(sanitized.toLowerCase()).not.toContain('javascript:');
        expect(sanitized.toLowerCase()).not.toContain('<script');
        expect(sanitized.toLowerCase()).not.toContain('onerror');
        expect(sanitized.toLowerCase()).not.toContain('onclick');
        
        // Should preserve safe content
        expect(sanitized).toContain('Safe content');
        expect(sanitized).toContain('More safe content');
      });
    });
  });
});