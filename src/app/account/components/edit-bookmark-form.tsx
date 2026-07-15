"use client";
import { useState, useEffect } from 'react';
import { Folder, Tag, X } from 'lucide-react';
import type { Bookmark, BookmarkFolder } from '@/lib/services/user-service';

interface EditBookmarkFormProps {
  bookmark: Bookmark;
  folders: BookmarkFolder[];
  tags: string[];
  onSave: (updates: { folder?: string; tags?: string[]; note?: string }) => Promise<void>;
  onCancel: () => void;
}

export function EditBookmarkForm({
  bookmark,
  folders,
  tags,
  onSave,
  onCancel,
}: EditBookmarkFormProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | ''>(bookmark.folder || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(bookmark.tags || []);
  const [note, setNote] = useState(bookmark.note || '');
  const [newTag, setNewTag] = useState('');

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async () => {
    await onSave({
      folder: selectedFolder || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border p-2 min-h-[100px]"
          placeholder="Add a note..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Folder</label>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="w-full rounded-md border p-2"
        >
          <option value="">No folder</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-brand-100 text-brand-700"
              >
                <Tag size={12} />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-brand-900"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add New Tag */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-1 rounded-md border p-2 text-sm"
            placeholder="Add tag..."
          />
          <button
            onClick={handleAddTag}
            className="px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors text-sm"
          >
            Add
          </button>
        </div>

        {/* Available Tags */}
        {tags.length > 0 && (
          <div>
            <p className="text-xs text-neutral-500 mb-2">Click to add existing tags:</p>
            <div className="flex flex-wrap gap-2">
              {tags
                .filter(tag => !selectedTags.includes(tag))
                .map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    <Tag size={12} />
                    {tag}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md border hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

