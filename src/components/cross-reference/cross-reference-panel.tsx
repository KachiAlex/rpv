"use client";
import { useState, useEffect } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { CrossReferenceService } from '@/lib/services/cross-reference-service';
import { useBibleStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import type { CrossReference } from '@/lib/types';

interface CrossReferencePanelProps {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
}

export function CrossReferencePanel({
  translationId,
  book,
  chapter,
  verse,
}: CrossReferencePanelProps) {
  const [crossRefs, setCrossRefs] = useState<CrossReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { translations, setCurrent } = useBibleStore();
  const router = useRouter();
  const crossRefService = new CrossReferenceService();

  useEffect(() => {
    loadCrossReferences();
  }, [translationId, book, chapter, verse]);

  const loadCrossReferences = async () => {
    setLoading(true);
    try {
      // Get from Firestore
      const refs = await crossRefService.getCrossReferences(translationId, book, chapter, verse);
      
      // If no refs in Firestore, check common cross-references
      if (refs.length === 0) {
        const commonRefs = crossRefService.getCommonCrossReferences(book, chapter, verse);
        const formattedRefs: CrossReference[] = commonRefs.map((ref, idx) => ({
          id: `common-${idx}`,
          fromTranslationId: translationId,
          fromBook: ref.fromBook,
          fromChapter: ref.fromChapter,
          fromVerse: ref.fromVerse,
          toTranslationId: translationId,
          toBook: ref.toBook,
          toChapter: ref.toChapter,
          toVerse: ref.toVerse,
          type: ref.type,
        }));
        setCrossRefs(formattedRefs);
      } else {
        setCrossRefs(refs);
      }
    } catch (error) {
      console.error('Error loading cross-references:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (ref: CrossReference) => {
    const targetTranslationId = ref.toTranslationId || translationId;
    const targetTranslation = translations.find(t => t.id === targetTranslationId);
    
    if (targetTranslation) {
      setCurrent(targetTranslationId);
      router.push(`/read?translation=${targetTranslationId}&book=${encodeURIComponent(ref.toBook)}&chapter=${ref.toChapter}&verse=${ref.toVerse}`);
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'quotation': return 'Quoted in';
      case 'similar': return 'Similar to';
      case 'parallel': return 'Parallel passage';
      case 'related': return 'Related verse';
      default: return 'See also';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'quotation': return 'text-blue-600 dark:text-blue-400';
      case 'similar': return 'text-green-600 dark:text-green-400';
      case 'parallel': return 'text-purple-600 dark:text-purple-400';
      case 'related': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  if (loading) {
    return (
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
        Loading cross-references...
      </div>
    );
  }

  if (crossRefs.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
      >
        <span className="flex items-center gap-1">
          <ExternalLink size={14} />
          Cross-References ({crossRefs.length})
        </span>
        {expanded ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {crossRefs.map((ref) => (
            <button
              key={ref.id}
              onClick={() => handleNavigate(ref)}
              className="block w-full text-left p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors text-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className={`font-medium ${getTypeColor(ref.type)}`}>
                    {ref.toBook} {ref.toChapter}:{ref.toVerse}
                  </span>
                  {ref.type && (
                    <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                      • {getTypeLabel(ref.type)}
                    </span>
                  )}
                </div>
                <ExternalLink size={12} className="text-neutral-400" />
              </div>
              {ref.note && (
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {ref.note}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

