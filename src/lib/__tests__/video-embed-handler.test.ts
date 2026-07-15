/**
 * Feature: admin-blog-system
 * Property Tests for Video Embed Handler
 * Validates: Requirements 2.2, 2.3, 6.4
 */

import { VideoEmbedHandler, processVideoUrl, sanitizeEmbedCode, isSupportedPlatform } from '../video-embed-handler';
import type { VideoEmbedResult } from '../types';

describe('VideoEmbedHandler Property Tests', () => {
  describe('Property 4: Video URL Processing Accuracy', () => {
    /**
     * For any valid video URL from supported platforms (YouTube, Vimeo), 
     * the system should generate syntactically correct embed code that contains the video ID
     * Validates: Requirements 2.2
     */
    test('Property 4: Valid YouTube URLs generate correct embed codes', () => {
      const youtubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtu.be/dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://youtu.be/dQw4w9WgXcQ'
      ];

      youtubeUrls.forEach(url => {
        const result = VideoEmbedHandler.processVideoUrl(url);
        
        // Should be valid
        expect(result.isValid).toBe(true);
        expect(result.platform).toBe('youtube');
        expect(result.videoId).toBe('dQw4w9WgXcQ');
        
        // Embed code should be syntactically correct
        expect(result.embedCode).toContain('<iframe');
        expect(result.embedCode).toContain('</iframe>');
        expect(result.embedCode).toContain('src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
        expect(result.embedCode).toContain('width="560"');
        expect(result.embedCode).toContain('height="315"');
        
        // Should have thumbnail URL
        expect(result.thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
      });
    });

    test('Property 4: Valid Vimeo URLs generate correct embed codes', () => {
      const vimeoUrls = [
        'https://vimeo.com/123456789',
        'https://www.vimeo.com/123456789',
        'http://vimeo.com/123456789',
        'http://www.vimeo.com/123456789'
      ];

      vimeoUrls.forEach(url => {
        const result = VideoEmbedHandler.processVideoUrl(url);
        
        // Should be valid
        expect(result.isValid).toBe(true);
        expect(result.platform).toBe('vimeo');
        expect(result.videoId).toBe('123456789');
        
        // Embed code should be syntactically correct
        expect(result.embedCode).toContain('<iframe');
        expect(result.embedCode).toContain('</iframe>');
        expect(result.embedCode).toContain('src="https://player.vimeo.com/video/123456789"');
        expect(result.embedCode).toContain('width="560"');
        expect(result.embedCode).toContain('height="315"');
        
        // Should have thumbnail URL
        expect(result.thumbnailUrl).toBe('https://vumbnail.com/123456789.jpg');
      });
    });

    test('Property 4: Invalid URLs return invalid results', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'https://example.com',
        'https://youtube.com/invalid',
        'https://vimeo.com/invalid',
        'https://youtube.com/watch?v=invalid-id',
        'https://vimeo.com/not-numeric',
        null,
        undefined,
        123,
        {}
      ];

      invalidUrls.forEach(url => {
        const result = VideoEmbedHandler.processVideoUrl(url as any);
        
        expect(result.isValid).toBe(false);
        expect(result.platform).toBe('unknown');
        expect(result.embedCode).toBe('');
      });
    });
  });

  describe('Property 5: Video Platform Support Completeness', () => {
    /**
     * For any URL from YouTube or Vimeo, the video embed handler should 
     * successfully identify the platform and extract the video ID
     * Validates: Requirements 2.3
     */
    test('Property 5: YouTube platform identification is complete', () => {
      const youtubeTestCases = [
        { url: 'https://www.youtube.com/watch?v=abcdefghijk', expectedId: 'abcdefghijk' },
        { url: 'https://youtube.com/watch?v=ABCDEFGHIJK', expectedId: 'ABCDEFGHIJK' },
        { url: 'https://youtu.be/123456789ab', expectedId: '123456789ab' },
        { url: 'https://www.youtu.be/abc-def_ghi', expectedId: 'abc-def_ghi' },
        { url: 'http://youtube.com/watch?v=mixedCASE12', expectedId: 'mixedCASE12' }
      ];

      youtubeTestCases.forEach(({ url, expectedId }) => {
        const result = VideoEmbedHandler.processVideoUrl(url);
        
        expect(result.platform).toBe('youtube');
        expect(result.videoId).toBe(expectedId);
        expect(result.isValid).toBe(true);
        expect(isSupportedPlatform(url)).toBe(true);
      });
    });

    test('Property 5: Vimeo platform identification is complete', () => {
      const vimeoTestCases = [
        { url: 'https://vimeo.com/1', expectedId: '1' },
        { url: 'https://vimeo.com/123456789', expectedId: '123456789' },
        { url: 'https://www.vimeo.com/9876543210', expectedId: '9876543210' },
        { url: 'http://vimeo.com/555', expectedId: '555' }
      ];

      vimeoTestCases.forEach(({ url, expectedId }) => {
        const result = VideoEmbedHandler.processVideoUrl(url);
        
        expect(result.platform).toBe('vimeo');
        expect(result.videoId).toBe(expectedId);
        expect(result.isValid).toBe(true);
        expect(isSupportedPlatform(url)).toBe(true);
      });
    });

    test('Property 5: Unsupported platforms are correctly identified', () => {
      const unsupportedUrls = [
        'https://dailymotion.com/video/x123456',
        'https://twitch.tv/videos/123456789',
        'https://facebook.com/watch?v=123456789',
        'https://instagram.com/p/ABC123/',
        'https://tiktok.com/@user/video/123456789',
        'https://example.com/video.mp4'
      ];

      unsupportedUrls.forEach(url => {
        const result = VideoEmbedHandler.processVideoUrl(url);
        
        expect(result.platform).toBe('unknown');
        expect(result.isValid).toBe(false);
        expect(isSupportedPlatform(url)).toBe(false);
      });
    });

    test('Property 5: Platform support list is accurate', () => {
      const supportedPlatforms = VideoEmbedHandler.getSupportedPlatforms();
      
      expect(supportedPlatforms).toHaveLength(2);
      expect(supportedPlatforms).toContainEqual({ name: 'YouTube', platform: 'youtube' });
      expect(supportedPlatforms).toContainEqual({ name: 'Vimeo', platform: 'vimeo' });
    });
  });

  describe('Property 21: Video URL Validation and Sanitization', () => {
    /**
     * For any video URL input, the system should validate that it's from a supported platform 
     * and sanitize the resulting embed code to prevent XSS attacks
     * Validates: Requirements 6.4
     */
    test('Property 21: Malicious embed codes are sanitized', () => {
      const maliciousEmbedCodes = [
        '<iframe src="https://www.youtube.com/embed/test" onload="alert(\'xss\')"></iframe>',
        '<iframe src="https://www.youtube.com/embed/test"><script>alert("xss")</script></iframe>',
        '<iframe src="javascript:alert(\'xss\')" width="560" height="315"></iframe>',
        '<iframe src="https://malicious.com/embed/test" width="560" height="315"></iframe>',
        '<iframe src="http://www.youtube.com/embed/test" onclick="malicious()"></iframe>',
        '<iframe src="https://www.youtube.com/embed/test" onerror="hack()"></iframe>'
      ];

      maliciousEmbedCodes.forEach(maliciousCode => {
        const sanitized = sanitizeEmbedCode(maliciousCode);
        
        // Should not contain dangerous patterns
        expect(sanitized.toLowerCase()).not.toContain('javascript:');
        expect(sanitized.toLowerCase()).not.toContain('<script');
        expect(sanitized.toLowerCase()).not.toContain('onload');
        expect(sanitized.toLowerCase()).not.toContain('onclick');
        expect(sanitized.toLowerCase()).not.toContain('onerror');
        expect(sanitized.toLowerCase()).not.toContain('onmouseover');
        
        // Should not contain malicious domains
        expect(sanitized).not.toContain('malicious.com');
        
        // Should enforce HTTPS for valid domains
        if (sanitized.includes('youtube.com') || sanitized.includes('vimeo.com')) {
          expect(sanitized).toContain('https://');
          expect(sanitized).not.toContain('http://www.');
        }
      });
    });

    test('Property 21: Valid embed codes are preserved during sanitization', () => {
      const validEmbedCodes = [
        '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
        '<iframe src="https://player.vimeo.com/video/123456789" width="560" height="315" frameborder="0" allowfullscreen></iframe>'
      ];

      validEmbedCodes.forEach(validCode => {
        const sanitized = sanitizeEmbedCode(validCode);
        
        // Should preserve iframe structure
        expect(sanitized).toContain('<iframe');
        expect(sanitized).toContain('</iframe>');
        expect(sanitized).toContain('width="560"');
        expect(sanitized).toContain('height="315"');
        
        // Should preserve valid src URLs
        expect(sanitized).toMatch(/src="https:\/\/(www\.youtube\.com|player\.vimeo\.com)/);
      });
    });

    test('Property 21: URL validation prevents malicious domains', () => {
      const maliciousUrls = [
        'https://malicious-youtube.com/watch?v=dQw4w9WgXcQ',
        'https://fake-vimeo.com/123456789',
        'https://youtube.evil.com/watch?v=dQw4w9WgXcQ',
        'https://vimeo.malicious.org/123456789',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>'
      ];

      maliciousUrls.forEach(url => {
        const result = VideoEmbedHandler.processVideoUrl(url);
        
        expect(result.isValid).toBe(false);
        expect(result.platform).toBe('unknown');
        expect(result.embedCode).toBe('');
      });
    });

    test('Property 21: Embed code validation catches security issues', () => {
      const testCases = [
        {
          code: '<iframe src="https://www.youtube.com/embed/test"></iframe>',
          shouldBeValid: true
        },
        {
          code: '<script>alert("xss")</script>',
          shouldBeValid: false,
          expectedErrors: ['iframe', 'script']
        },
        {
          code: '<iframe onclick="malicious()"></iframe>',
          shouldBeValid: false,
          expectedErrors: ['event handlers', 'src']
        },
        {
          code: '<iframe src="javascript:alert()"></iframe>',
          shouldBeValid: false,
          expectedErrors: ['javascript']
        },
        {
          code: '<div>Not an iframe</div>',
          shouldBeValid: false,
          expectedErrors: ['iframe']
        }
      ];

      testCases.forEach(({ code, shouldBeValid, expectedErrors }) => {
        const validation = VideoEmbedHandler.validateEmbedCode(code);
        
        expect(validation.isValid).toBe(shouldBeValid);
        
        if (expectedErrors) {
          expectedErrors.forEach(errorKeyword => {
            expect(validation.errors.some(error => 
              error.toLowerCase().includes(errorKeyword.toLowerCase())
            )).toBe(true);
          });
        }
      });
    });
  });

  describe('Property-based tests with random data', () => {
    test('Property 4: Video URL processing consistency across random inputs', () => {
      // Generate 50 random URL scenarios
      for (let i = 0; i < 50; i++) {
        const randomVideoId = Math.random().toString(36).substring(2, 13); // 11 chars for YouTube
        const randomVimeoId = Math.floor(Math.random() * 1000000000).toString(); // Numeric for Vimeo
        
        const testUrls = [
          `https://www.youtube.com/watch?v=${randomVideoId}`,
          `https://youtu.be/${randomVideoId}`,
          `https://vimeo.com/${randomVimeoId}`,
          `https://www.vimeo.com/${randomVimeoId}`
        ];

        testUrls.forEach(url => {
          const result1 = VideoEmbedHandler.processVideoUrl(url);
          const result2 = VideoEmbedHandler.processVideoUrl(url);
          
          // Results should be consistent
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.platform).toBe(result2.platform);
          expect(result1.videoId).toBe(result2.videoId);
          expect(result1.embedCode).toBe(result2.embedCode);
          
          if (result1.isValid) {
            // Valid results should have proper structure
            expect(result1.embedCode).toContain('<iframe');
            expect(result1.embedCode).toContain('</iframe>');
            expect(result1.embedCode).toContain('src="https://');
            expect(result1.videoId).toBeTruthy();
          }
        });
      }
    });

    test('Property 5: Platform identification across random video IDs', () => {
      // Test with various YouTube video ID formats
      for (let i = 0; i < 25; i++) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
        let youtubeId = '';
        for (let j = 0; j < 11; j++) {
          youtubeId += chars[Math.floor(Math.random() * chars.length)];
        }
        
        const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
        const result = VideoEmbedHandler.processVideoUrl(youtubeUrl);
        
        expect(result.platform).toBe('youtube');
        expect(result.videoId).toBe(youtubeId);
        expect(result.isValid).toBe(true);
      }

      // Test with various Vimeo video ID formats
      for (let i = 0; i < 25; i++) {
        const vimeoId = Math.floor(Math.random() * 9999999999).toString(); // 1-10 digits
        const vimeoUrl = `https://vimeo.com/${vimeoId}`;
        const result = VideoEmbedHandler.processVideoUrl(vimeoUrl);
        
        expect(result.platform).toBe('vimeo');
        expect(result.videoId).toBe(vimeoId);
        expect(result.isValid).toBe(true);
      }
    });

    test('Property 21: Sanitization robustness across random malicious patterns', () => {
      const maliciousPatterns = [
        'javascript:',
        '<script>',
        'onload=',
        'onclick=',
        'onerror=',
        'onmouseover=',
        'eval(',
        'alert(',
        'document.cookie',
        'window.location'
      ];

      for (let i = 0; i < 30; i++) {
        // Generate random malicious embed code
        const randomPattern = maliciousPatterns[Math.floor(Math.random() * maliciousPatterns.length)];
        const randomPayload = Math.random().toString(36).substring(7);
        
        const maliciousEmbed = `<iframe src="https://www.youtube.com/embed/test" ${randomPattern}"${randomPayload}"></iframe>`;
        
        const sanitized = sanitizeEmbedCode(maliciousEmbed);
        
        // Should not contain the malicious pattern
        expect(sanitized.toLowerCase()).not.toContain(randomPattern.toLowerCase());
        
        // Should still be a valid iframe structure if it was originally
        if (maliciousEmbed.includes('<iframe') && maliciousEmbed.includes('</iframe>')) {
          expect(sanitized).toContain('<iframe');
          expect(sanitized).toContain('</iframe>');
        }
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Property 4: Handles edge cases gracefully', () => {
      const edgeCases = [
        '',
        ' ',
        '\n\t',
        'https://',
        'https://youtube.com',
        'https://vimeo.com',
        'https://youtube.com/watch',
        'https://youtube.com/watch?v=',
        'https://vimeo.com/',
        'https://youtu.be/',
        'https://www.youtube.com/watch?v=toolong123456',
        'https://vimeo.com/notanumber'
      ];

      edgeCases.forEach(edgeCase => {
        const result = VideoEmbedHandler.processVideoUrl(edgeCase);
        
        // Should not throw errors
        expect(result).toBeDefined();
        expect(result.isValid).toBe(false);
        expect(result.platform).toBe('unknown');
        expect(result.embedCode).toBe('');
      });
    });

    test('Property 21: Sanitization handles malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        123,
        {},
        [],
        '<iframe',
        '</iframe>',
        '<iframe></iframe>',
        '<iframe src=""></iframe>',
        'not html at all'
      ];

      malformedInputs.forEach(input => {
        const result = sanitizeEmbedCode(input as any);
        
        // Should not throw errors
        expect(typeof result).toBe('string');
        
        // Should not contain dangerous patterns
        expect(result.toLowerCase()).not.toContain('<script');
        expect(result.toLowerCase()).not.toContain('javascript:');
      });
    });
  });

  describe('Utility Functions', () => {
    test('Responsive embed generation works correctly', () => {
      const embedCode = '<iframe width="560" height="315" src="https://www.youtube.com/embed/test"></iframe>';
      const responsive = VideoEmbedHandler.generateResponsiveEmbed(embedCode);
      
      expect(responsive).toContain('video-embed-container');
      expect(responsive).toContain('position: relative');
      expect(responsive).toContain('padding-bottom: 56.25%');
      expect(responsive).toContain('width="100%"');
      expect(responsive).toContain('height="100%"');
    });

    test('Batch processing works correctly', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://vimeo.com/123456789',
        'https://invalid.com/video'
      ];

      const results = VideoEmbedHandler.processMultipleUrls(urls);
      
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[0].platform).toBe('youtube');
      expect(results[1].isValid).toBe(true);
      expect(results[1].platform).toBe('vimeo');
      expect(results[2].isValid).toBe(false);
      expect(results[2].platform).toBe('unknown');
    });

    test('Thumbnail URL generation works correctly', () => {
      const youtubeThumbnail = VideoEmbedHandler.getVideoThumbnail('youtube', 'dQw4w9WgXcQ');
      const vimeoThumbnail = VideoEmbedHandler.getVideoThumbnail('vimeo', '123456789');
      const invalidThumbnail = VideoEmbedHandler.getVideoThumbnail('youtube', 'invalid');
      
      expect(youtubeThumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
      expect(vimeoThumbnail).toBe('https://vumbnail.com/123456789.jpg');
      expect(invalidThumbnail).toBe('');
    });
  });
});