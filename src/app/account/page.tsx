"use client";
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService, type UserPreferences, type Bookmark, type ReadingHistory } from '@/lib/services/user-service';
import { Bookmark as BookmarkIcon, History, Settings, User } from 'lucide-react';
import Link from 'next/link';

function AccountPageContent() {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'settings'>('bookmarks');
  const userService = new UserService();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [prefs, bookmarksData, historyData] = await Promise.all([
        userService.getPreferences(user.uid),
        userService.getBookmarks(user.uid),
        userService.getReadingHistory(user.uid, 50),
      ]);
      
      setPreferences(prefs);
      setBookmarks(bookmarksData);
      setHistory(historyData);
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
          <h2 className="text-xl font-semibold mb-4">My Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No bookmarks yet. Start bookmarking verses while reading!</p>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <Link
                  key={bookmark.id}
                  href={`/read?translation=${bookmark.translationId}&book=${bookmark.book}&chapter=${bookmark.chapter}&verse=${bookmark.verse}`}
                  className="block p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-brand-700 mb-1">
                        {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                      </div>
                      {bookmark.note && (
                        <p className="text-sm text-neutral-600 mb-2">{bookmark.note}</p>
                      )}
                      <p className="text-xs text-neutral-500">
                        {new Date(bookmark.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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

      {activeTab === 'settings' && preferences && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
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

