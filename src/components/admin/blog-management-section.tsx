'use client';

import React, { useState, useEffect } from 'react';
import { blogService } from '../../lib/services/blog-service';
import { SimpleBlogEditor } from './simple-blog-editor';
import type { BlogPost, BlogPostStatus } from '../../lib/types';

interface BlogManagementSectionProps {
  className?: string;
}

export function BlogManagementSection({ className = '' }: BlogManagementSectionProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | BlogPostStatus>('all');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  
  // Editor modal state
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Load blog posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allPosts = await blogService.getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load blog posts';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts based on search and status
  const filteredPosts = posts.filter(post => {
    // Search filter
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    // Status filter
    if (filterStatus === 'all') return true;
    return post.status === filterStatus;
  });

  // Handle post status change
  const handleStatusChange = async (postId: string, newStatus: BlogPostStatus) => {
    try {
      setError(null);
      
      switch (newStatus) {
        case 'published':
          await blogService.publishPost(postId);
          break;
        case 'draft':
          await blogService.unpublishPost(postId);
          break;
        case 'archived':
          await blogService.archivePost(postId);
          break;
      }
      
      // Reload posts to reflect changes
      await loadPosts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update post status';
      setError(errorMessage);
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await blogService.deletePost(postId);
      await loadPosts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete post';
      setError(errorMessage);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: BlogPostStatus) => {
    if (selectedPosts.size === 0) {
      alert('Please select posts to update');
      return;
    }

    try {
      setError(null);
      await blogService.bulkUpdateStatus(Array.from(selectedPosts), newStatus);
      setSelectedPosts(new Set());
      await loadPosts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update posts';
      setError(errorMessage);
    }
  };

  // Toggle post selection
  const togglePostSelection = (postId: string) => {
    const newSelection = new Set(selectedPosts);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPosts(newSelection);
  };

  // Select all filtered posts
  const selectAllPosts = () => {
    const allFilteredIds = new Set(filteredPosts.map(post => post.id));
    setSelectedPosts(allFilteredIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPosts(new Set());
  };

  // Handle create new post
  const handleCreatePost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  // Handle editor save
  const handleEditorSave = async (post: BlogPost) => {
    setShowEditor(false);
    setEditingPost(null);
    await loadPosts(); // Refresh the list
  };

  // Handle editor cancel
  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  // Calculate summary statistics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(post => post.status === 'published').length;
  const draftPosts = posts.filter(post => post.status === 'draft').length;
  const archivedPosts = posts.filter(post => post.status === 'archived').length;

  // Format date for display
  const formatDate = (value?: Date | string) => {
    if (!value) {
      return '—';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: BlogPostStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
            <p className="text-gray-600 mt-1">
              Create, edit, and manage blog posts
            </p>
          </div>
          
          {/* Summary Statistics */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
              <div className="text-gray-500">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{publishedPosts}</div>
              <div className="text-gray-500">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{draftPosts}</div>
              <div className="text-gray-500">Drafts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{archivedPosts}</div>
              <div className="text-gray-500">Archived</div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCreatePost}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Create New Post
            </button>
            
            {selectedPosts.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedPosts.size} selected
                </span>
                <button
                  onClick={() => handleBulkStatusUpdate('published')}
                  className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('draft')}
                  className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
                >
                  Draft
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('archived')}
                  className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                >
                  Archive
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search posts by title, content, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | BlogPostStatus)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
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

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <svg className="animate-spin w-8 h-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Loading blog posts...</span>
          </div>
        </div>
      )}

      {/* Blog Posts List */}
      {!isLoading && (
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredPosts.length === 0 ? (
            <div className="p-12">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Create your first blog post to get started.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                    onChange={() => selectedPosts.size === filteredPosts.length ? clearSelection() : selectAllPosts()}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-4"
                  />
                  <div className="grid grid-cols-12 gap-4 w-full text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Title</div>
                    <div className="col-span-2">Author</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-4"
                      />
                      <div className="grid grid-cols-12 gap-4 w-full">
                        {/* Title */}
                        <div className="col-span-4">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {post.excerpt}
                          </div>
                        </div>

                        {/* Author */}
                        <div className="col-span-2">
                          <div className="text-sm text-gray-900">{post.authorName}</div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(post.status)}`}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="col-span-2">
                          <div className="text-sm text-gray-900">
                            {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {post.publishedAt ? 'Published' : 'Created'}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm"
                            >
                              Edit
                            </button>
                            
                            {post.status !== 'published' && (
                              <button
                                onClick={() => handleStatusChange(post.id, 'published')}
                                className="text-green-600 hover:text-green-900 text-sm"
                              >
                                Publish
                              </button>
                            )}
                            
                            {post.status === 'published' && (
                              <button
                                onClick={() => handleStatusChange(post.id, 'draft')}
                                className="text-yellow-600 hover:text-yellow-900 text-sm"
                              >
                                Unpublish
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blog Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <SimpleBlogEditor
              post={editingPost}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              className="max-h-[90vh] overflow-y-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}