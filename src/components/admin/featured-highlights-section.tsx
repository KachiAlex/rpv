"use client";
import { useEffect, useState } from 'react';
import { useBibleStore } from '@/lib/store';
import { FeaturedHighlightsService, type FeaturedHighlight } from '@/lib/services/featured-highlights-service';
import { Trash2, Plus, GripVertical } from 'lucide-react';

export function FeaturedHighlightsSection() {
  const { translations } = useBibleStore();
  const [highlights, setHighlights] = useState<FeaturedHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    translationId: '',
    book: '',
    chapter: 1,
    verse: 1,
    text: '',
    title: '',
    description: '',
  });

  const service = new FeaturedHighlightsService();

  // Load featured highlights
  useEffect(() => {
    loadHighlights();
  }, []);

  const loadHighlights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await service.getFeaturedHighlights(100);
      setHighlights(data);
    } catch (err) {
      console.error('Error loading featured highlights:', err);
      setError('Failed to load featured highlights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHighlight = async () => {
    if (!formData.translationId || !formData.book || !formData.text.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      await service.addFeaturedHighlight({
        translationId: formData.translationId,
        book: formData.book,
        chapter: formData.chapter,
        verse: formData.verse,
        text: formData.text,
        title: formData.title || undefined,
        description: formData.description || undefined,
        order: highlights.length + 1,
      });

      setFormData({
        translationId: '',
        book: '',
        chapter: 1,
        verse: 1,
        text: '',
        title: '',
        description: '',
      });
      setShowForm(false);
      await loadHighlights();
    } catch (err) {
      console.error('Error adding highlight:', err);
      alert('Failed to add highlight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!confirm('Are you sure you want to delete this highlight?')) return;

    try {
      setIsLoading(true);
      await service.deleteFeaturedHighlight(id);
      await loadHighlights();
    } catch (err) {
      console.error('Error deleting highlight:', err);
      alert('Failed to delete highlight');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTranslation = translations.find(t => t.id === formData.translationId);
  const selectedBook = selectedTranslation?.books.find(b => b.name === formData.book);
  const selectedChapter = selectedBook?.chapters.find(c => c.number === formData.chapter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Featured Highlights</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
        >
          <Plus size={16} />
          Add Highlight
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h3 className="font-semibold">Add New Featured Highlight</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Translation *</label>
              <select
                value={formData.translationId}
                onChange={(e) => setFormData({ ...formData, translationId: e.target.value, book: '' })}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="">Select translation</option>
                {translations.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Book *</label>
              <select
                value={formData.book}
                onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                disabled={!selectedTranslation}
                className="w-full rounded-md border p-2 text-sm disabled:opacity-50"
              >
                <option value="">Select book</option>
                {selectedTranslation?.books.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Chapter *</label>
              <select
                value={formData.chapter}
                onChange={(e) => setFormData({ ...formData, chapter: Number(e.target.value) })}
                disabled={!selectedBook}
                className="w-full rounded-md border p-2 text-sm disabled:opacity-50"
              >
                {selectedBook?.chapters.map(c => (
                  <option key={c.number} value={c.number}>{c.number}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Verse *</label>
              <select
                value={formData.verse}
                onChange={(e) => setFormData({ ...formData, verse: Number(e.target.value) })}
                disabled={!selectedChapter}
                className="w-full rounded-md border p-2 text-sm disabled:opacity-50"
              >
                {selectedChapter?.verses.map(v => (
                  <option key={v.number} value={v.number}>{v.number}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title (Optional)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., God's Love"
              className="w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this highlight"
              className="w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Verse Text *</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter the verse text"
              className="w-full rounded-md border p-2 text-sm min-h-[80px]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddHighlight}
              disabled={isLoading}
              className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Highlight'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border px-4 py-2 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && !showForm ? (
        <div className="text-center py-8 text-neutral-600">Loading...</div>
      ) : highlights.length === 0 ? (
        <div className="rounded-md bg-neutral-50 p-6 text-center text-neutral-600">
          <p>No featured highlights yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {highlights.map((highlight, index) => (
            <div key={highlight.id} className="flex items-start gap-3 rounded-md border p-3 bg-white">
              <div className="mt-1 text-neutral-400 cursor-grab active:cursor-grabbing">
                <GripVertical size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {highlight.title || `${highlight.book} ${highlight.chapter}:${highlight.verse}`}
                    </p>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{highlight.text}</p>
                    {highlight.description && (
                      <p className="text-xs text-neutral-500 mt-1">{highlight.description}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-2">
                      {translations.find(t => t.id === highlight.translationId)?.name || highlight.translationId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteHighlight(highlight.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete highlight"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
