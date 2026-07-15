import type { VideoEmbedResult } from './types';
import { VIDEO_PLATFORMS } from './constants/blog';

/**
 * Video Embed Handler - Processes video URLs and generates embed codes
 * Supports YouTube and Vimeo platforms with security validation
 */
export class VideoEmbedHandler {
  /**
   * Process a video URL and generate embed information
   */
  static processVideoUrl(url: string): VideoEmbedResult {
    if (!url || typeof url !== 'string') {
      return {
        platform: 'unknown',
        embedCode: '',
        isValid: false
      };
    }

    const trimmedUrl = url.trim();
    
    // Try YouTube first
    const youtubeResult = this.processYouTubeUrl(trimmedUrl);
    if (youtubeResult.isValid) {
      return youtubeResult;
    }

    // Try Vimeo
    const vimeoResult = this.processVimeoUrl(trimmedUrl);
    if (vimeoResult.isValid) {
      return vimeoResult;
    }

    // Unknown platform
    return {
      platform: 'unknown',
      embedCode: '',
      isValid: false
    };
  }

  /**
   * Process YouTube URL
   */
  private static processYouTubeUrl(url: string): VideoEmbedResult {
    const platform = VIDEO_PLATFORMS.youtube;
    
    for (const pattern of platform.urlPatterns) {
      const match = url.match(pattern);
      if (match) {
        const videoId = match[2]; // Video ID is in the second capture group
        
        if (this.isValidYouTubeVideoId(videoId)) {
          return {
            platform: 'youtube',
            videoId,
            embedCode: platform.embedTemplate(videoId),
            thumbnailUrl: platform.thumbnailTemplate(videoId),
            isValid: true
          };
        }
      }
    }

    return {
      platform: 'unknown',
      embedCode: '',
      isValid: false
    };
  }

  /**
   * Process Vimeo URL
   */
  private static processVimeoUrl(url: string): VideoEmbedResult {
    const platform = VIDEO_PLATFORMS.vimeo;
    
    for (const pattern of platform.urlPatterns) {
      const match = url.match(pattern);
      if (match) {
        const videoId = match[2]; // Video ID is in the second capture group
        
        if (this.isValidVimeoVideoId(videoId)) {
          return {
            platform: 'vimeo',
            videoId,
            embedCode: platform.embedTemplate(videoId),
            thumbnailUrl: platform.thumbnailTemplate(videoId),
            isValid: true
          };
        }
      }
    }

    return {
      platform: 'unknown',
      embedCode: '',
      isValid: false
    };
  }

  /**
   * Validate YouTube video ID format
   */
  private static isValidYouTubeVideoId(videoId: string): boolean {
    if (!videoId || typeof videoId !== 'string') {
      return false;
    }
    
    // YouTube video IDs are 11 characters long and contain alphanumeric characters, hyphens, and underscores
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  /**
   * Validate Vimeo video ID format
   */
  private static isValidVimeoVideoId(videoId: string): boolean {
    if (!videoId || typeof videoId !== 'string') {
      return false;
    }
    
    // Vimeo video IDs are numeric and can be 1-10 digits long
    return /^\d{1,10}$/.test(videoId);
  }

  /**
   * Sanitize embed code for security
   */
  static sanitizeEmbedCode(embedCode: string): string {
    if (!embedCode || typeof embedCode !== 'string') {
      return '';
    }

    // Remove any script tags
    let sanitized = embedCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove any on* event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Ensure iframe src is from allowed domains
    sanitized = this.validateIframeSrc(sanitized);
    
    return sanitized;
  }

  /**
   * Validate iframe src attribute to ensure it's from allowed domains
   */
  private static validateIframeSrc(embedCode: string): string {
    const allowedDomains = [
      'www.youtube.com',
      'youtube.com',
      'player.vimeo.com',
      'vimeo.com'
    ];

    // Extract src attribute from iframe
    const srcMatch = embedCode.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) {
      return embedCode; // No src found, return as is
    }

    const srcUrl = srcMatch[1];
    
    try {
      const url = new URL(srcUrl);
      const hostname = url.hostname.toLowerCase();
      
      // Check if hostname is in allowed domains
      const isAllowed = allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        // Replace with empty src if not allowed
        return embedCode.replace(/src\s*=\s*["'][^"']+["']/i, 'src=""');
      }
      
      // Ensure HTTPS
      if (url.protocol !== 'https:') {
        url.protocol = 'https:';
        return embedCode.replace(/src\s*=\s*["'][^"']+["']/i, `src="${url.toString()}"`);
      }
      
      return embedCode;
    } catch (error) {
      // Invalid URL, remove src
      return embedCode.replace(/src\s*=\s*["'][^"']+["']/i, 'src=""');
    }
  }

  /**
   * Extract video ID from embed code
   */
  static extractVideoIdFromEmbed(embedCode: string): { platform: 'youtube' | 'vimeo' | 'unknown'; videoId?: string } {
    if (!embedCode || typeof embedCode !== 'string') {
      return { platform: 'unknown' };
    }

    // Extract src URL from iframe
    const srcMatch = embedCode.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) {
      return { platform: 'unknown' };
    }

    const srcUrl = srcMatch[1];

    // Check for YouTube
    const youtubeMatch = srcUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return {
        platform: 'youtube',
        videoId: youtubeMatch[1]
      };
    }

    // Check for Vimeo
    const vimeoMatch = srcUrl.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (vimeoMatch) {
      return {
        platform: 'vimeo',
        videoId: vimeoMatch[1]
      };
    }

    return { platform: 'unknown' };
  }

  /**
   * Get supported platforms list
   */
  static getSupportedPlatforms(): Array<{ name: string; platform: string }> {
    return [
      { name: 'YouTube', platform: 'youtube' },
      { name: 'Vimeo', platform: 'vimeo' }
    ];
  }

  /**
   * Check if a URL is from a supported platform
   */
  static isSupportedPlatform(url: string): boolean {
    const result = this.processVideoUrl(url);
    return result.isValid && result.platform !== 'unknown';
  }

  /**
   * Generate responsive embed code wrapper
   */
  static generateResponsiveEmbed(embedCode: string): string {
    if (!embedCode || typeof embedCode !== 'string') {
      return '';
    }

    // Wrap in responsive container
    return `
      <div class="video-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          ${embedCode.replace(/width\s*=\s*["']\d+["']/gi, 'width="100%"').replace(/height\s*=\s*["']\d+["']/gi, 'height="100%"')}
        </div>
      </div>
    `.trim();
  }

  /**
   * Batch process multiple video URLs
   */
  static processMultipleUrls(urls: string[]): VideoEmbedResult[] {
    if (!Array.isArray(urls)) {
      return [];
    }

    return urls.map(url => this.processVideoUrl(url));
  }

  /**
   * Get video thumbnail URL
   */
  static getVideoThumbnail(platform: 'youtube' | 'vimeo', videoId: string): string {
    if (platform === 'youtube' && this.isValidYouTubeVideoId(videoId)) {
      return VIDEO_PLATFORMS.youtube.thumbnailTemplate(videoId);
    }
    
    if (platform === 'vimeo' && this.isValidVimeoVideoId(videoId)) {
      return VIDEO_PLATFORMS.vimeo.thumbnailTemplate(videoId);
    }
    
    return '';
  }

  /**
   * Validate embed code structure
   */
  static validateEmbedCode(embedCode: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!embedCode || typeof embedCode !== 'string') {
      errors.push('Embed code is required');
      return { isValid: false, errors };
    }

    // Check for iframe tag
    if (!/<iframe\b[^>]*>/i.test(embedCode)) {
      errors.push('Embed code must contain an iframe element');
    }

    // Check for src attribute
    if (!/src\s*=\s*["'][^"']+["']/i.test(embedCode)) {
      errors.push('Iframe must have a valid src attribute');
    }

    // Check for dangerous content
    if (/<script\b/i.test(embedCode)) {
      errors.push('Embed code cannot contain script tags');
    }

    if (/javascript:/i.test(embedCode)) {
      errors.push('Embed code cannot contain javascript: URLs');
    }

    if (/on\w+\s*=/i.test(embedCode)) {
      errors.push('Embed code cannot contain event handlers');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export convenience functions
export const processVideoUrl = VideoEmbedHandler.processVideoUrl.bind(VideoEmbedHandler);
export const sanitizeEmbedCode = VideoEmbedHandler.sanitizeEmbedCode.bind(VideoEmbedHandler);
export const generateResponsiveEmbed = VideoEmbedHandler.generateResponsiveEmbed.bind(VideoEmbedHandler);
export const isSupportedPlatform = VideoEmbedHandler.isSupportedPlatform.bind(VideoEmbedHandler);
export const getSupportedPlatforms = VideoEmbedHandler.getSupportedPlatforms.bind(VideoEmbedHandler);