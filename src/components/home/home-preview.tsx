"use client";
import { useEffect, useState } from 'react';
import { useBibleStore } from '@/lib/store';
import { VerseCard } from '@/components/verse/verse-card';
import { FeaturedHighlightsService, type FeaturedHighlight } from '@/lib/services/featured-highlights-service';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function HomePreview() {
  const { translations, loadTranslations, loadSample } = useBibleStore();
  const [featuredHighlights, setFeaturedHighlights] = useState<FeaturedHighlight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTranslations().catch(async () => await loadSample());
  }, [loadTranslations, loadSample]);

  // Load featured highlights
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const service = new FeaturedHighlightsService();
        const highlights = await service.getFeaturedHighlights(5);
        
        if (highlights.length === 0) {
          setError('No featured highlights available yet');
        } else {
          setFeaturedHighlights(highlights);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error('Error loading featured highlights:', err);
        setError('Failed to load featured highlights');
      } finally {
        setIsLoading(false);
      }
    };

    loadHighlights();
  }, []);

  const currentHighlight = featuredHighlights[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? featuredHighlights.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === featuredHighlights.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-100 to-brand-300 animate-pulse" />
    );
  }

  if (error || !currentHighlight) {
    return (
      <div className="aspect-video rounded-lg border bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 flex items-center justify-center">
        <p className="text-sm text-neutral-600 text-center">{error || 'No highlights to display'}</p>
      </div>
    );
  }

  const translation = translations.find(t => t.id === currentHighlight.translationId);
  const book = translation?.books.find(b => b.name === currentHighlight.book);
  const chapter = book?.chapters.find(c => c.number === currentHighlight.chapter);
  const verse = chapter?.verses.find(v => v.number === currentHighlight.verse);

  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-lg border bg-white p-4 overflow-auto">
        {verse ? (
          <VerseCard
            verse={verse}
            book={currentHighlight.book}
            chapter={currentHighlight.chapter}
            isSelected={true}
            translationName={translation?.name || currentHighlight.translationId}
            translationId={currentHighlight.translationId}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-neutral-600">Verse not found in translation</p>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {featuredHighlights.length > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-md border hover:bg-neutral-50 transition-colors"
            aria-label="Previous highlight"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 flex items-center justify-center gap-1">
            {featuredHighlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-brand-500 w-6' : 'bg-neutral-300 w-2'
                }`}
                aria-label={`Go to highlight ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-md border hover:bg-neutral-50 transition-colors"
            aria-label="Next highlight"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Highlight Info */}
      {currentHighlight.title && (
        <div className="text-sm">
          <p className="font-semibold text-[#4a2c26]">{currentHighlight.title}</p>
          {currentHighlight.description && (
            <p className="text-xs text-[#6a4c43] mt-1">{currentHighlight.description}</p>
          )}
        </div>
      )}
    </div>
  );
}


