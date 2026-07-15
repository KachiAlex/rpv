'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { VideoEmbedHandler } from '../../lib/video-embed-handler';
import { generateSlug, validateBlogPost } from '../../lib/utils/blog-utils';
import { blogService } from '../../lib/services/blog-service';
import type { BlogPost, BlogPostStatus, VideoEmbed } from '../../lib/types';

interface BlogEditorProps {
  post?: BlogPost | null;
  onSave?: (post: BlogPost) => void;
  onCancel?: () => void;
  className?: string;
}

export function BlogEditor({ post, onSave, onCancel, className = '' }: BlogEditorProps) {
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    slug: post?.slug || '',
    status: (post?.status || 'draft') as BlogPostStatus,
    tags: post?.tags?.join(', ') || '',
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || '',
    videoEmbeds: post?.videoEmbeds || [] as VideoEmbed[]
  });

  // Auto-save functionality
  useEffect(() => {
    if (!post?.id) return; // Only auto-save existing posts

    const autoSaveTimer = setTimeout(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [formData, post?.id]);

  // Auto-generate slug when title changes
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const newSlug = generateSlug(formData.title);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
  }, [formData.title]);

  // Auto-generate excerpt when content changes
  useEffect(() => {
    if (formData.content && !formData.excerpt) {
      // Simple excerpt generation - strip HTML and truncate
      const textContent = formData.content.replace(/<[^>]*>/g, '');
      const excerpt = textContent.length > 150 
        ? textContent.substring(0, 150) + '...'
        : textContent;
      setFormData(prev => ({ ...prev, excerpt }));
    }
  }, [formData.content]);

  const handleAutoSave = async () => {
    if (!post?.id || isSaving) return;

    try {
      setAutoSaveStatus('saving');
      await blogService.updatePost(post.id, {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug: formData.slug,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription
      });
      setAutoSaveStatus('saved');
      
      // Clear auto-save status after 3 seconds
      setTimeout(() => setAutoSaveStatus(null), 3000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    setError(null);
  };

  const handleVideoEmbed = () => {
    const videoUrl = prompt('Enter video URL (YouTube or Vimeo):');
    if (!videoUrl) return;

    const embedResult = VideoEmbedHandler.processVideoUrl(videoUrl);
    if (!embedResult.isValid) {
      alert('Invalid video URL. Please enter a valid YouTube or Vimeo URL.');
      return;
    }

    // Insert responsive embed into editor
    const responsiveEmbed = VideoEmbedHandler.generateResponsiveEmbed(embedResult.embedCode);
    
    if (editorRef.current) {
      editorRef.current.insertContent(responsiveEmbed);
    }

    // Add to video embeds array
    const newEmbed: VideoEmbed = {
      id: `embed-${Date.now()}`,
      platform: embedResult.platform as 'youtube' | 'vimeo',
      videoId: embedResult.videoId || '',
      embedCode: embedResult.embedCode,
      thumbnailUrl: embedResult.thumbnailUrl,
      title: embedResult.title,
      position: formData.videoEmbeds.length
    };

    setFormData(prev => ({
      ...prev,
      videoEmbeds: [...prev.videoEmbeds, newEmbed]
    }));
  };

  const handleSave = async (saveStatus: BlogPostStatus = formData.status) => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate form data
      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug: formData.slug,
        author: post?.author || 'current-user', // TODO: Get from auth context
        authorName: post?.authorName || 'Current User', // TODO: Get from auth context
        status: saveStatus,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        videoEmbeds: formData.videoEmbeds,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription
      };

      const validation = validateBlogPost(postData);
      if (!validation.isValid) {
        setError(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      let savedPost: BlogPost;

      if (post?.id) {
        // Update existing post
        await blogService.updatePost(post.id, postData);
        savedPost = { ...post, ...postData, updatedAt: new Date() };
      } else {
        // Create new post
        savedPost = await blogService.createPost(postData);
      }

      onSave?.(savedPost);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save post';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => handleSave('published');
  const handleSaveDraft = () => handleSave('draft');

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // TinyMCE configuration
  const editorConfig = {
    apiKey: 'wtb0344s69mc5y7m5ekj53hs8izipdzudbgb9ebonp5990yq',
    height: 500,
    menubar: 'file edit view insert format tools table help',
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: [
      'undo redo | formatselect | bold italic underline strikethrough',
      'alignleft aligncenter alignright alignjustify',
      'bullist numlist outdent indent',
      'link unlink | image media | videoembed',
      'forecolor backcolor | removeformat',
      'code | fullscreen preview'
    ].join(' | '),
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        font-size: 14px; 
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .video-embed-container {
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
        max-width: 100%;
        margin: 20px 0;
      }
      .video-embed-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    `,
    setup: (editor: any) => {
      // Custom video embed button
      editor.ui.registry.addButton('videoembed', {
        text: 'Video',
        tooltip: 'Embed Video',
        onAction: handleVideoEmbed
      });
    },
    // Security settings
    allow_unsafe_link_target: false,
    convert_urls: false,
    relative_urls: false,
    remove_script_host: true,
    // Paste settings
    paste_as_text: false,
    paste_auto_cleanup_on_paste: true,
    paste_remove_styles: false,
    paste_remove_styles_if_webkit: false,
    // Image settings
    image_advtab: true,
    image_caption: true,
    image_title: true,
    // Link settings
    link_title: true,
    link_target_list: [
      { title: 'Same window', value: '' },
      { title: 'New window', value: '_blank' }
    ]
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {post?.id ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h2>
          
          <div className="flex items-center space-x-3">
            {/* Auto-save status */}
            {autoSaveStatus && (
              <div className="flex items-center text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-gray-600">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600">Auto-saved</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-600">Auto-save failed</span>
                  </>
                )}
              </div>
            )}

            {/* Preview toggle */}
            <button
              onClick={togglePreview}
              className={`px-3 py-1 text-sm rounded-md border ${
                showPreview
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {showPreview ? (
          /* Preview Mode */
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title || 'Untitled Post'}</h1>
              <p className="text-gray-600 mb-4">{formData.excerpt}</p>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span>Status: <span className="capitalize">{formData.status}</span></span>
                <span>Slug: {formData.slug || 'auto-generated'}</span>
                {formData.tags && <span>Tags: {formData.tags}</span>}
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: formData.content }} />
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter post title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="url-friendly-slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate from title
                </p>
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <Editor
                  onInit={(evt, editor) => editorRef.current = editor}
                  value={formData.content}
                  onEditorChange={handleContentChange}
                  init={editorConfig}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Brief description of the post (auto-generated if empty)..."
              />
            </div>

            {/* Tags and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate tags with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* SEO Settings */}
            <details className="border border-gray-200 rounded-md">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                SEO Settings (Optional)
              </summary>
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Custom title for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Meta description for search engines"
                  />
                </div>
              </div>
            </details>

            {/* Video Embeds Summary */}
            {formData.videoEmbeds.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Embedded Videos ({formData.videoEmbeds.length})
                </h3>
                <div className="space-y-2">
                  {formData.videoEmbeds.map((embed, index) => (
                    <div key={embed.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                          {embed.thumbnailUrl && (
                            <img 
                              src={embed.thumbnailUrl} 
                              alt={embed.title || 'Video thumbnail'}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {embed.title || `${embed.platform} Video`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {embed.platform.toUpperCase()} • ID: {embed.videoId}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            videoEmbeds: prev.videoEmbeds.filter(v => v.id !== embed.id)
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}