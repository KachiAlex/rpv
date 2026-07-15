"use client";
import { useState, useEffect } from 'react';
import { Highlighter, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { HighlightService } from '@/lib/services/highlight-service';
import type { HighlightColor, Highlight } from '@/lib/types';

interface HighlightButtonProps {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  onHighlightChange?: (highlight: Highlight | null) => void;
}

const HIGHLIGHT_COLORS: Array<{ color: HighlightColor; name: string; bgClass: string }> = [
  { color: 'yellow', name: 'Yellow', bgClass: 'bg-yellow-200 dark:bg-yellow-900/30' },
  { color: 'blue', name: 'Blue', bgClass: 'bg-blue-200 dark:bg-blue-900/30' },
  { color: 'green', name: 'Green', bgClass: 'bg-green-200 dark:bg-green-900/30' },
  { color: 'pink', name: 'Pink', bgClass: 'bg-pink-200 dark:bg-pink-900/30' },
  { color: 'purple', name: 'Purple', bgClass: 'bg-purple-200 dark:bg-purple-900/30' },
  { color: 'orange', name: 'Orange', bgClass: 'bg-orange-200 dark:bg-orange-900/30' },
];

export function HighlightButton({
  translationId,
  book,
  chapter,
  verse,
  onHighlightChange,
}: HighlightButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const highlightService = new HighlightService();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadHighlight();
    }
  }, [isAuthenticated, user, translationId, book, chapter, verse]);

  const loadHighlight = async () => {
    if (!user) return;
    
    try {
      const existing = await highlightService.getHighlight(user.uid, translationId, book, chapter, verse);
      setHighlight(existing);
      if (onHighlightChange) {
        onHighlightChange(existing);
      }
    } catch (error) {
      console.error('Error loading highlight:', error);
    }
  };

  const handleColorSelect = async (color: HighlightColor) => {
    if (!user || !isAuthenticated) return;
    
    setLoading(true);
    setShowColorPicker(false);
    
    try {
      if (highlight && highlight.color === color) {
        // Same color clicked - remove highlight
        await highlightService.removeHighlight(user.uid, highlight.id);
        setHighlight(null);
        if (onHighlightChange) {
          onHighlightChange(null);
        }
      } else {
        // Add or change highlight
        const highlightData = {
          userId: user.uid,
          translationId,
          book,
          chapter,
          verse,
          color,
        };
        
        const highlightId = await highlightService.addHighlight(user.uid, highlightData);
        const newHighlight: Highlight = {
          id: highlightId,
          ...highlightData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setHighlight(newHighlight);
        if (onHighlightChange) {
          onHighlightChange(newHighlight);
        }
      }
    } catch (error) {
      console.error('Error saving highlight:', error);
      alert('Failed to save highlight');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHighlight = async () => {
    if (!user || !highlight) return;
    
    setLoading(true);
    
    try {
      await highlightService.removeHighlight(user.uid, highlight.id);
      setHighlight(null);
      setShowColorPicker(false);
      if (onHighlightChange) {
        onHighlightChange(null);
      }
    } catch (error) {
      console.error('Error removing highlight:', error);
      alert('Failed to remove highlight');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const currentColorInfo = highlight
    ? HIGHLIGHT_COLORS.find(c => c.color === highlight.color)
    : null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowColorPicker(!showColorPicker);
        }}
        className={`p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
          highlight ? 'bg-opacity-20' : ''
        }`}
        title={highlight ? `Highlighted (${currentColorInfo?.name})` : 'Highlight verse'}
        disabled={loading}
      >
        <Highlighter
          size={18}
          className={`${
            highlight
              ? currentColorInfo?.color === 'yellow'
                ? 'text-yellow-600 dark:text-yellow-400'
                : currentColorInfo?.color === 'blue'
                ? 'text-blue-600 dark:text-blue-400'
                : currentColorInfo?.color === 'green'
                ? 'text-green-600 dark:text-green-400'
                : currentColorInfo?.color === 'pink'
                ? 'text-pink-600 dark:text-pink-400'
                : currentColorInfo?.color === 'purple'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-orange-600 dark:text-orange-400'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
          fill={highlight ? 'currentColor' : 'none'}
        />
      </button>

      {showColorPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowColorPicker(false)}
          />
          <div className="absolute z-50 right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Choose Color
              </div>
              <div className="grid grid-cols-3 gap-2">
                {HIGHLIGHT_COLORS.map((colorInfo) => (
                  <button
                    key={colorInfo.color}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorSelect(colorInfo.color);
                    }}
                    className={`w-10 h-10 rounded-md ${colorInfo.bgClass} border-2 transition-all ${
                      highlight?.color === colorInfo.color
                        ? 'border-brand-600 dark:border-brand-400 ring-2 ring-brand-200 dark:ring-brand-800'
                        : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                    title={colorInfo.name}
                  />
                ))}
              </div>
              {highlight && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveHighlight();
                  }}
                  className="mt-2 flex items-center justify-center gap-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"
                >
                  <X size={14} />
                  Remove Highlight
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

