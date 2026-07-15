import type { CommentaryEntry } from '@/lib/types';
import { commentaryEntries } from '@/data/commentary';

export interface CommentaryFilters {
  translationId?: string;
  book?: string;
  chapter?: number;
  verse?: number;
  query?: string;
}

export class CommentaryService {
  async list(filters: CommentaryFilters = {}): Promise<CommentaryEntry[]> {
    const { translationId, book, chapter, verse, query } = filters;

    let results = commentaryEntries;

    if (translationId) {
      const id = translationId.toLowerCase();
      results = results.filter((entry) => entry.translationId.toLowerCase() === id);
    }

    if (book) {
      const normalizedBook = book.toLowerCase();
      results = results.filter((entry) => entry.book.toLowerCase() === normalizedBook);
    }

    if (typeof chapter === 'number') {
      results = results.filter((entry) => entry.chapter === chapter);
    }

    if (typeof verse === 'number') {
      results = results.filter((entry) => entry.verse === verse);
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      results = results.filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          entry.body.toLowerCase().includes(q) ||
          entry.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return results.sort((a, b) => (a.book === b.book ? a.verse - b.verse : a.book.localeCompare(b.book)));
  }
}
