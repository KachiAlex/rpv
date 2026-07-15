"use client";
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService, type UserPreferences, type Bookmark, type ReadingHistory, type BookmarkFolder } from '@/lib/services/user-service';
import { Bookmark as BookmarkIcon, History, Settings, User, Calendar, Highlighter, TrendingUp, Folder, Tag, Plus, X, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { HighlightService } from '@/lib/services/highlight-service';
import { ReadingProgressService } from '@/lib/services/reading-progress-service';
import { useBibleStore } from '@/lib/store';
import { EditBookmarkForm } from './components/edit-bookmark-form';
import type { Highlight } from '@/lib/types';

function AccountPageContent() {
  const { user, isAuthenticated } = useAuth();
  const { translations, current } = useBibleStore();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookProgress, setBookProgress] = useState<Array<{ book: string; progress: number; chaptersRead: number; totalChapters: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'highlights' | 'progress' | 'settings'>('bookmarks');
  const userService = new UserService();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user, current?.id]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const highlightService = new HighlightService();
      const progressService = new ReadingProgressService();
      const translationId = current?.id || 'RPV';
      
      const [prefs, bookmarksData, foldersData, tagsData, historyData, highlightsData, progressData] = await Promise.all([
        userService.getPreferences(user.uid),
        userService.getBookmarks(user.uid),
        userService.getFolders(user.uid),
        userService.getAllTags(user.uid),
        userService.getReadingHistory(user.uid, 50),
        highlightService.getHighlights(user.uid),
        progressService.getTranslationProgress(user.uid, translationId),
      ]);
      
      setPreferences(prefs);
      setBookmarks(bookmarksData);
      setFolders(foldersData);
      setTags(tagsData);
      setHistory(historyData);
      setHighlights(highlightsData);
      setBookProgress(progressData);
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return;
    
    try {
      await userService.savePreferences(user.uid, updates);
      setPreferences({ ...preferences, ...updates });
      alert('Preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    }
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    
    try {
      await userService.createFolder(user.uid, newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl border bg-white p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
            <User size={32} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-neutral-600">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'bookmarks'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BookmarkIcon size={16} className="inline mr-2" />
            Bookmarks ({bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <History size={16} className="inline mr-2" />
            History ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'highlights'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Highlighter size={16} className="inline mr-2" />
            Highlights ({highlights.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'progress'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <TrendingUp size={16} className="inline mr-2" />
            Progress ({bookProgress.length} books)
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Settings size={16} className="inline mr-2" />
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'bookmarks' && (
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Bookmarks</h2>
            <button
              onClick={() => setShowNewFolderDialog(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors text-sm"
            >
              <Plus size={16} />
              New Folder
            </button>
          </div>

          {/* Folders & Tags Filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedFolder(null); setSelectedTag(null); }}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                !selectedFolder && !selectedTag
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => { setSelectedFolder(folder.id); setSelectedTag(null); }}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors ${
                  selectedFolder === folder.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <Folder size={14} />
                {folder.name}
              </button>
            ))}
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(tag); setSelectedFolder(null); }}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors ${
                  selectedTag === tag
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <Tag size={14} />
                {tag}
              </button>
            ))}
          </div>

          {/* Filtered Bookmarks */}
          {(() => {
            let filteredBookmarks = bookmarks;
            if (selectedFolder) {
              filteredBookmarks = filteredBookmarks.filter(b => b.folder === selectedFolder);
            }
            if (selectedTag) {
              filteredBookmarks = filteredBookmarks.filter(b => b.tags && b.tags.includes(selectedTag));
            }
            
            return filteredBookmarks.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">
                {bookmarks.length === 0 
                  ? 'No bookmarks yet. Start bookmarking verses while reading!'
                  : 'No bookmarks match your filter.'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map((bookmark) => {
                  const folder = folders.find(f => f.id === bookmark.folder);
                  
                  return (
                    <div
                      key={bookmark.id}
                      className="p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <Link
                          href={`/read?translation=${bookmark.translationId}&book=${bookmark.book}&chapter=${bookmark.chapter}&verse=${bookmark.verse}`}
                          className="flex-1"
                        >
                          <div className="font-semibold text-brand-700 mb-1">
                            {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                          </div>
                          {bookmark.note && (
                            <p className="text-sm text-neutral-600 mb-2">{bookmark.note}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {folder && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-brand-100 text-brand-700">
                                <Folder size={12} />
                                {folder.name}
                              </span>
                            )}
                            {bookmark.tags && bookmark.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-700"
                              >
                                <Tag size={12} />
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-neutral-500 mt-2">
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </p>
                        </Link>
                        <button
                          onClick={() => setEditingBookmark(bookmark)}
                          className="ml-2 p-2 rounded-md hover:bg-neutral-100 transition-colors"
                          title="Edit bookmark"
                        >
                          <Edit2 size={16} className="text-neutral-400 hover:text-neutral-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Folder</h3>
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="p-1 rounded-md hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded-md border p-2"
                  placeholder="e.g., Favorite Verses"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNewFolderDialog(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 rounded-md border hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bookmark Dialog */}
      {editingBookmark && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Bookmark</h3>
              <button
                onClick={() => setEditingBookmark(null)}
                className="p-1 rounded-md hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>
            <EditBookmarkForm
              bookmark={editingBookmark}
              folders={folders}
              tags={tags}
              onSave={async (updates) => {
                await userService.updateBookmark(user.uid, editingBookmark.id, updates);
                await loadData();
                setEditingBookmark(null);
              }}
              onCancel={() => setEditingBookmark(null)}
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Reading History</h2>
          {history.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No reading history yet. Start reading to see your history!</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <Link
                  key={item.id}
                  href={`/read?translation=${item.translationId}&book=${item.book}&chapter=${item.chapter}&verse=${item.verse}`}
                  className="block p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-brand-700 mb-1">
                        {item.book} {item.chapter}:{item.verse}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'highlights' && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">My Highlights</h2>
          {highlights.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No highlights yet. Start highlighting verses while reading!</p>
          ) : (
            <div className="space-y-3">
              {highlights.map((highlight) => {
                const colorMap: Record<string, string> = {
                  yellow: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700',
                  blue: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700',
                  green: 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700',
                  pink: 'bg-pink-100 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700',
                  purple: 'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700',
                  orange: 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700',
                };
                
                return (
                  <Link
                    key={highlight.id}
                    href={`/read?translation=${highlight.translationId}&book=${highlight.book}&chapter=${highlight.chapter}&verse=${highlight.verse}`}
                    className={`block p-4 rounded-lg border-2 hover:opacity-80 transition-opacity ${colorMap[highlight.color] || 'bg-neutral-100 border-neutral-300'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-brand-700 mb-1">
                          {highlight.book} {highlight.chapter}:{highlight.verse}
                        </div>
                        {highlight.note && (
                          <p className="text-sm text-neutral-600 mb-2">{highlight.note}</p>
                        )}
                        <p className="text-xs text-neutral-500">
                          {new Date(highlight.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Reading Progress</h2>
          {bookProgress.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No reading progress yet. Start reading to see your progress!</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Track your reading progress across all books in {current?.name || 'your translation'}
              </p>
              <div className="space-y-3">
                {bookProgress
                  .sort((a, b) => b.progress - a.progress) // Sort by progress (highest first)
                  .map((progress) => (
                    <div key={progress.book} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-brand-700 dark:text-brand-300">
                          {progress.book}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          {progress.progress}%
                        </div>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progress.progress === 100
                              ? 'bg-green-500 dark:bg-green-400'
                              : 'bg-gradient-to-r from-brand-600 to-accent-purple'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {progress.chaptersRead} / {progress.totalChapters} chapters read
                      </div>
                    </div>
                  ))}
              </div>
              {bookProgress.length > 0 && (
                <div className="mt-4 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-brand-700 dark:text-brand-300">
                      Overall Progress
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 font-semibold">
                      {Math.round(
                        bookProgress.reduce((sum, p) => sum + p.progress, 0) / bookProgress.length
                      )}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && preferences && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            <h3 className="font-medium text-brand-700 dark:text-brand-300 mb-2">Quick Links</h3>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
            >
              <Calendar size={16} />
              Browse Reading Plans
            </Link>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => updatePreferences({ theme: e.target.value as 'light' | 'dark' | 'auto' })}
                className="w-full rounded-md border p-2"
              >
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <select
                value={preferences.fontSize}
                onChange={(e) => updatePreferences({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
                className="w-full rounded-md border p-2"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <input
                type="text"
                value={preferences.language}
                onChange={(e) => updatePreferences({ language: e.target.value })}
                className="w-full rounded-md border p-2"
                placeholder="en"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountPageContent />
    </ProtectedRoute>
  );
}

