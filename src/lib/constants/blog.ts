import type { BlogPostStatus } from '../types';

/**
 * Blog system constants and configuration
 */

// Blog Post Status Options
export const BLOG_POST_STATUSES: Record<BlogPostStatus, { label: string; color: string; description: string }> = {
  draft: {
    label: 'Draft',
    color: 'gray',
    description: 'Post is being worked on and not visible to public'
  },
  published: {
    label: 'Published',
    color: 'green',
    description: 'Post is live and visible to public'
  },
  archived: {
    label: 'Archived',
    color: 'yellow',
    description: 'Post is hidden from public but preserved in admin'
  }
};

// Video Platform Configuration
export const VIDEO_PLATFORMS = {
  youtube: {
    name: 'YouTube',
    urlPatterns: [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/
    ],
    embedTemplate: (videoId: string) => 
      `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
    thumbnailTemplate: (videoId: string) => 
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  },
  vimeo: {
    name: 'Vimeo',
    urlPatterns: [
      /^https?:\/\/(www\.)?vimeo\.com\/(\d+)/
    ],
    embedTemplate: (videoId: string) => 
      `<iframe src="https://player.vimeo.com/video/${videoId}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`,
    thumbnailTemplate: (videoId: string) => 
      `https://vumbnail.com/${videoId}.jpg`
  }
} as const;

// Blog Configuration
export const BLOG_CONFIG = {
  DEFAULT_POSTS_PER_PAGE: 10,
  MAX_POSTS_PER_PAGE: 50,
  DEFAULT_EXCERPT_LENGTH: 150,
  MAX_TITLE_LENGTH: 200,
  MAX_SLUG_LENGTH: 100,
  SLUG_SEPARATOR: '-',
  
  // Rich Text Editor Configuration
  EDITOR_CONFIG: {
    toolbar: [
      'undo redo | formatselect | bold italic underline strikethrough',
      'alignleft aligncenter alignright alignjustify',
      'bullist numlist outdent indent',
      'link unlink | image media',
      'forecolor backcolor | removeformat',
      'code | fullscreen preview'
    ],
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    menubar: 'file edit view insert format tools table help',
    height: 400,
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; }'
  }
} as const;

// Firestore Collection Names
export const FIRESTORE_COLLECTIONS = {
  BLOG_POSTS: 'blog-posts',
  BLOG_METADATA: 'blog-metadata'
} as const;

// Security and Validation
export const SECURITY_CONFIG = {
  ALLOWED_HTML_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'iframe', 'div', 'span'
  ],
  ALLOWED_HTML_ATTRIBUTES: {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'width', 'height'],
    'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    '*': ['class', 'id', 'style']
  },
  MAX_CONTENT_LENGTH: 50000, // 50KB
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
} as const;