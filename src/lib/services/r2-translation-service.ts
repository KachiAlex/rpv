import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';
import { IndexedDBCache } from '../cache/indexeddb-cache';
import type { Translation, Book, Chapter } from '../types';

// IndexedDB write-through cache so the app keeps working offline:
// every successful fetch is persisted, and failed fetches fall back to the
// last synced copy. After the manifest loads online, a low-priority
// background prefetch downloads any missing books so a machine used for
// projection ends up with the full Bible cached locally.
export class R2TranslationService {
  private cache = new IndexedDBCache();
  private prefetchStarted = false;

  private async cacheBook(translationId: string, book: Book): Promise<void> {
    try {
      const existing = await this.cache.getTranslation(translationId);
      const books = (existing?.books ?? []).filter(b => b.name !== book.name);
      books.push(book);
      await this.cache.saveTranslation({
        ...(existing ?? { id: translationId, name: translationId }),
        books,
      } as Translation);
    } catch {
      /* cache unavailable */
    }
  }

  private async cachedBook(translationId: string, bookName: string): Promise<Book | null> {
    try {
      const cached = await this.cache.getTranslation(translationId);
      const book = cached?.books?.find(b => b.name === bookName);
      return book && book.chapters?.length ? book : null;
    } catch {
      return null;
    }
  }

  private async cacheManifest(translations: Translation[]): Promise<void> {
    for (const t of translations) {
      try {
        const existing = await this.cache.getTranslation(t.id);
        // Manifest book stubs carry no verses — keep any already-cached full
        // content for matching book names, and preserve cached books that are
        // absent from the manifest.
        const mergedBooks = (t.books ?? []).map(b => {
          const full = existing?.books?.find(eb => eb.name === b.name && eb.chapters?.length);
          return full ?? b;
        });
        for (const eb of existing?.books ?? []) {
          if (eb.chapters?.length && !mergedBooks.some(b => b.name === eb.name)) {
            mergedBooks.push(eb);
          }
        }
        await this.cache.saveTranslation({ ...t, books: mergedBooks });
      } catch {
        /* ignore */
      }
    }
  }

  private schedulePrefetch(translations: Translation[]): void {
    if (this.prefetchStarted || typeof window === 'undefined') return;
    this.prefetchStarted = true;
    setTimeout(async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      for (const t of translations) {
        for (const b of t.books ?? []) {
          try {
            const cached = await this.cachedBook(t.id, b.name);
            if (cached) continue;
            await this.getBookContent(t.id, b.name);
            await new Promise(r => setTimeout(r, 250));
          } catch {
            /* offline mid-prefetch — resume next session */
            return;
          }
        }
      }
    }, 3000);
  }

  private async authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await getAuthToken();
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  async getTranslation(id: string): Promise<Translation | null> {
    try {
      const res = await fetch(getApiUrl(`/api/r2/translations/${encodeURIComponent(id)}/`));
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (data.translation) await this.cache.saveTranslation(data.translation).catch(() => {});
      return data.translation || null;
    } catch (error) {
      console.error('Error getting translation:', error);
      try {
        return await this.cache.getTranslation(id);
      } catch {
        return null;
      }
    }
  }

  async getTranslationLazy(id: string, loadContent: boolean = false): Promise<Translation | null> {
    try {
      const url = getApiUrl(`/api/r2/translations/${encodeURIComponent(id)}/?full=${loadContent}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (data.translation) {
        if (loadContent) {
          await this.cache.saveTranslation(data.translation).catch(() => {});
        } else {
          await this.cacheManifest([data.translation]).catch(() => {});
        }
      }
      return data.translation || null;
    } catch (error) {
      console.error('Error getting translation (lazy):', error);
      try {
        const cached = await this.cache.getTranslation(id);
        if (cached) return cached;
      } catch {
        /* fall through */
      }
      return null;
    }
  }

  async getBookContent(
    translationId: string,
    bookName: string
  ): Promise<Book | null> {
    try {
      const res = await fetch(
        getApiUrl(`/api/r2/translations/${encodeURIComponent(translationId)}/books/${encodeURIComponent(bookName)}/`)
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (data.book) await this.cacheBook(translationId, data.book);
      return data.book || null;
    } catch (error) {
      console.error('Error getting book content:', error);
      return this.cachedBook(translationId, bookName);
    }
  }

  async getChapterContent(
    translationId: string,
    bookName: string,
    chapterNumber: number
  ): Promise<Chapter | null> {
    const book = await this.getBookContent(translationId, bookName);
    if (!book) return null;
    return book.chapters.find(c => c.number === chapterNumber) || null;
  }

  async getAllTranslations(): Promise<Translation[]> {
    try {
      const res = await fetch(getApiUrl('/api/r2/translations/'));
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const translations: Translation[] = data.translations || [];
      await this.cacheManifest(translations).catch(() => {});
      this.schedulePrefetch(translations);
      return translations;
    } catch (error) {
      console.error('Error getting all translations:', error);
      try {
        return await this.cache.getAllTranslations();
      } catch {
        return [];
      }
    }
  }

  async saveTranslation(translation: Translation): Promise<void> {
    try {
      const res = await fetch(getApiUrl('/api/r2/translations/'), {
        method: 'POST',
        headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(translation),
      });
      if (!res.ok) throw new Error(`Failed to save translation (${res.status})`);
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    }
  }

  async mergeTranslation(newTranslation: Translation): Promise<Translation> {
    try {
      const res = await fetch(getApiUrl('/api/r2/translations/'), {
        method: 'POST',
        headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(newTranslation),
      });
      if (!res.ok) throw new Error('Failed to merge translation');
      const data = await res.json();
      return data.translation || newTranslation;
    } catch (error) {
      console.error('Error merging translation:', error);
      throw error;
    }
  }

  async addOrUpdateVerse(
    translationId: string,
    book: string,
    chapter: number,
    verse: number,
    text: string
  ): Promise<void> {
    try {
      const res = await fetch(getApiUrl('/api/r2/translations/'), {
        method: 'POST',
        headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: translationId,
          name: translationId,
          books: [{
            name: book,
            chapters: [{
              number: chapter,
              verses: [{ number: verse, text }],
            }],
          }],
        }),
      });
      if (!res.ok) throw new Error(`Failed to add/update verse (${res.status})`);
    } catch (error) {
      console.error('Error adding/updating verse:', error);
      throw error;
    }
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const translations = await this.getAllTranslations();
        if (active) callback(translations);
      } catch {
        // ignore
      }
      if (active) setTimeout(poll, 30000);
    };
    poll();
    return () => { active = false; };
  }

  subscribeToTranslation(id: string, callback: (translation: Translation | null) => void): () => void {
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const translation = await this.getTranslation(id);
        if (active) callback(translation);
      } catch {
        // ignore
      }
      if (active) setTimeout(poll, 30000);
    };
    poll();
    return () => { active = false; };
  }

  async toggleBookPublicationStatus(translationId: string, bookName: string): Promise<boolean> {
    try {
      const translation = await this.getTranslation(translationId);
      if (!translation) throw new Error(`Translation ${translationId} not found`);
      const book = translation.books.find(b => b.name === bookName);
      if (!book) throw new Error(`Book ${bookName} not found`);
      const currentStatus = book.published !== undefined ? book.published : true;
      const newStatus = !currentStatus;

      const res = await fetch(getApiUrl('/api/r2/book-publication/'), {
        method: 'POST',
        headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ translationId, bookName, published: newStatus }),
      });
      if (!res.ok) throw new Error(`Failed to update publication status (${res.status})`);
      return newStatus;
    } catch (error) {
      console.error('Error toggling book publication status:', error);
      throw error;
    }
  }

  async getTranslationsWithPublishedBooks(): Promise<Translation[]> {
    const translations = await this.getAllTranslations();
    return translations.map(t => ({
      ...t,
      books: t.books.filter(b => b.published !== false),
    }));
  }

  filterPublishedBooks(translation: Translation): Translation {
    return {
      ...translation,
      books: translation.books.filter(book => book.published !== false),
    };
  }

  async bulkUpdateBookPublicationStatus(
    translationId: string,
    bookUpdates: Array<{ bookName: string; published: boolean }>
  ): Promise<void> {
    try {
      for (const update of bookUpdates) {
        const res = await fetch(getApiUrl('/api/r2/book-publication/'), {
          method: 'POST',
          headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            translationId,
            bookName: update.bookName,
            published: update.published,
          }),
        });
        if (!res.ok) throw new Error(`Failed to update ${update.bookName} (${res.status})`);
      }
    } catch (error) {
      console.error('Error in bulk book publication status update:', error);
      throw error;
    }
  }

  async publishBook(translationId: string, bookName: string): Promise<void> {
    const res = await fetch(getApiUrl('/api/r2/book-publication/'), {
      method: 'POST',
      headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ translationId, bookName, published: true }),
    });
    if (!res.ok) throw new Error(`Failed to publish book (${res.status})`);
  }

  async unpublishBook(translationId: string, bookName: string): Promise<void> {
    const res = await fetch(getApiUrl('/api/r2/book-publication/'), {
      method: 'POST',
      headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ translationId, bookName, published: false }),
    });
    if (!res.ok) throw new Error(`Failed to unpublish book (${res.status})`);
  }

  async deleteBook(translationId: string, bookName: string): Promise<void> {
    const res = await fetch(
      getApiUrl(`/api/r2/translations/${encodeURIComponent(translationId)}/books/${encodeURIComponent(bookName)}/`),
      { method: 'DELETE', headers: await this.authHeaders() }
    );
    if (!res.ok) throw new Error('Failed to delete book');
  }

  async updateBookIntroduction(
    translationId: string,
    bookName: string,
    introduction: string
  ): Promise<void> {
    const res = await fetch(getApiUrl('/api/r2/book-publication/'), {
      method: 'POST',
      headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ translationId, bookName, introduction }),
    });
    if (!res.ok) throw new Error(`Failed to update introduction (${res.status})`);
  }

  async uploadFile(translationId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('translationId', translationId);
    const res = await fetch(getApiUrl('/api/r2/upload-file/'), {
      method: 'POST',
      headers: await this.authHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    const data = await res.json();
    return data.key;
  }
}
