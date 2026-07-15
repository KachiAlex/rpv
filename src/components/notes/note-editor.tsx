"use client";
import { useState, useEffect } from 'react';
import { FileText, X, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { NotesService, type Note } from '@/lib/services/notes-service';

interface NoteEditorProps {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

export function NoteEditor({ translationId, book, chapter, verse, onClose }: NoteEditorProps) {
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const notesService = new NotesService();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotes();
    }
  }, [isAuthenticated, user, translationId, book, chapter, verse]);

  const loadNotes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const loadedNotes = await notesService.getNotes(user.uid, translationId, book, chapter, verse);
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !text.trim()) return;
    
    setLoading(true);
    try {
      if (editingNoteId) {
        await notesService.updateNote(user.uid, editingNoteId, text);
      } else {
        await notesService.addNote(user.uid, {
          userId: user.uid,
          translationId,
          book,
          chapter,
          verse,
          text,
        });
      }
      
      setText('');
      setEditingNoteId(null);
      await loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setText(note.text);
    setEditingNoteId(note.id);
  };

  const handleDelete = async (noteId: string) => {
    if (!user || !confirm('Delete this note?')) return;
    
    setLoading(true);
    try {
      await notesService.deleteNote(user.uid, noteId);
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setEditingNoteId(null);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
              <X size={20} />
            </button>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">Please sign in to use notes.</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} />
              Notes
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {book} {chapter}:{verse}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && notes.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No notes yet. Add your first note below!</div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border border-neutral-200 dark:border-neutral-600"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(note.updatedAt).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="text-brand-600 hover:text-brand-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">{note.text}</p>
              </div>
            ))
          )}

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={editingNoteId ? "Edit note..." : "Add a note..."}
              className="w-full p-3 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100 min-h-[100px]"
              rows={4}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                disabled={loading || !text.trim()}
                className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {editingNoteId ? 'Update' : 'Save'} Note
              </button>
              {editingNoteId && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

