"use client";
import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';
import type { Bookmark as BookmarkType } from '@/lib/services/user-service';

interface BookmarkButtonProps {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
}

export function BookmarkButton({ translationId, book, chapter, verse }: BookmarkButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const userService = new UserService();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    checkBookmark();
  }, [isAuthenticated, user, translationId, book, chapter, verse]);

  const checkBookmark = async () => {
    if (!user) return;
    
    try {
      const bookmark = await userService.getBookmark(user.uid, translationId, book, chapter, verse);
      setIsBookmarked(!!bookmark);
      setBookmarkId(bookmark?.id || null);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated || !user) {
      alert('Please sign in to use bookmarks');
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked && bookmarkId) {
        await userService.removeBookmark(user.uid, bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        const id = await userService.addBookmark(user.uid, {
          translationId,
          book,
          chapter,
          verse,
        });
        setIsBookmarked(true);
        setBookmarkId(id);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className="p-2 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50"
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck size={20} className="text-brand-600" />
      ) : (
        <Bookmark size={20} className="text-neutral-400" />
      )}
    </button>
  );
}

