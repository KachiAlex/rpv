import { R2TranslationService } from './r2-translation-service';
import type { Translation, Book, Chapter } from '../types';

/**
 * HybridTranslationService uses R2 (Cloudflare R2) for all operations.
 */
export class HybridTranslationService {
  private r2: R2TranslationService;

  constructor() {
    this.r2 = new R2TranslationService();
  }

  async getTranslation(id: string): Promise<Translation | null> {
    const r2Result = await this.r2.getTranslation(id);
    if (r2Result && r2Result.books && r2Result.books.length > 0) {
      return r2Result;
    }
    return r2Result;
  }

  async getTranslationLazy(id: string, loadContent: boolean = false): Promise<Translation | null> {
    const r2Result = await this.r2.getTranslationLazy(id, loadContent);
    if (r2Result && r2Result.books && r2Result.books.length > 0) {
      return r2Result;
    }
    return r2Result;
  }

  async getBookContent(translationId: string, bookName: string): Promise<Book | null> {
    const r2Result = await this.r2.getBookContent(translationId, bookName);
    if (r2Result && r2Result.chapters && r2Result.chapters.length > 0) {
      return r2Result;
    }
    return r2Result;
  }

  async getChapterContent(translationId: string, bookName: string, chapterNumber: number): Promise<Chapter | null> {
    const r2Result = await this.r2.getChapterContent(translationId, bookName, chapterNumber);
    if (r2Result && r2Result.verses && r2Result.verses.length > 0) {
      return r2Result;
    }
    return r2Result;
  }

  async getAllTranslations(): Promise<Translation[]> {
    return await this.r2.getAllTranslations().catch(() => [] as Translation[]);
  }

  async saveTranslation(translation: Translation): Promise<void> {
    // Save to R2 (primary)
    await this.r2.saveTranslation(translation).catch((e) => console.warn('[Hybrid] R2 save failed:', e));
  }

  async mergeTranslation(newTranslation: Translation): Promise<Translation> {
    // Merge in R2 (primary)
    const r2Result = await this.r2.mergeTranslation(newTranslation).catch((e) => {
      console.warn('[Hybrid] R2 merge failed:', e);
      return null;
    });
    return r2Result || newTranslation;
  }

  async addOrUpdateVerse(
    translationId: string,
    book: string,
    chapter: number,
    verse: number,
    text: string
  ): Promise<void> {
    await this.r2.addOrUpdateVerse(translationId, book, chapter, verse, text).catch((e) => console.warn('[Hybrid] R2 addOrUpdateVerse failed:', e));
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    return this.r2.subscribeToAllTranslations(callback);
  }

  subscribeToTranslation(id: string, callback: (translation: Translation | null) => void): () => void {
    return this.r2.subscribeToTranslation(id, callback);
  }

  async toggleBookPublicationStatus(translationId: string, bookName: string): Promise<boolean> {
    const r2Result = await this.r2.toggleBookPublicationStatus(translationId, bookName).catch((e) => {
      console.warn('[Hybrid] R2 toggleBookPublicationStatus failed:', e);
      return null;
    });
    if (r2Result !== null) return r2Result;
    return true;
  }

  async getTranslationsWithPublishedBooks(): Promise<Translation[]> {
    const all = await this.getAllTranslations();
    return all.map(t => ({
      ...t,
      books: t.books.filter(b => b.published !== false),
    })).filter(t => t.books.length > 0);
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
    await this.r2.bulkUpdateBookPublicationStatus(translationId, bookUpdates).catch((e) => console.warn('[Hybrid] R2 bulkUpdate failed:', e));
  }

  async publishBook(translationId: string, bookName: string): Promise<void> {
    await this.r2.publishBook(translationId, bookName).catch((e) => console.warn('[Hybrid] R2 publishBook failed:', e));
  }

  async unpublishBook(translationId: string, bookName: string): Promise<void> {
    await this.r2.unpublishBook(translationId, bookName).catch((e) => console.warn('[Hybrid] R2 unpublishBook failed:', e));
  }

  async deleteBook(translationId: string, bookName: string): Promise<void> {
    await this.r2.deleteBook(translationId, bookName).catch((e) => console.warn('[Hybrid] R2 deleteBook failed:', e));
  }

  async updateBookIntroduction(
    translationId: string,
    bookName: string,
    introduction: string
  ): Promise<void> {
    await this.r2.updateBookIntroduction(translationId, bookName, introduction).catch((e) => console.warn('[Hybrid] R2 updateBookIntroduction failed:', e));
  }

  async uploadFile(translationId: string, file: File): Promise<string> {
    // Upload to R2 (primary storage for files)
    return this.r2.uploadFile(translationId, file);
  }
}
