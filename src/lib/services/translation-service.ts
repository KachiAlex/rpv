import { OptimizedCacheManager } from '../cache/optimized-cache-manager';
import type { Translation, Book, Chapter, Verse } from '../types';

export class TranslationService {
  private cacheManager: OptimizedCacheManager;

  constructor() {
    this.cacheManager = new OptimizedCacheManager();
  }

  async getTranslation(id: string): Promise<Translation | null> {
    try {
      return await this.cacheManager.getTranslation(id);
    } catch (error) {
      console.error('Error getting translation:', error);
      throw error;
    }
  }

  // NEW: Get translation with lazy loading option
  async getTranslationLazy(id: string, loadContent: boolean = false): Promise<Translation | null> {
    try {
      if (loadContent) {
        return await this.cacheManager.getTranslationWithContent(id);
      } else {
        return await this.cacheManager.getTranslation(id);
      }
    } catch (error) {
      console.error('Error getting translation (lazy):', error);
      throw error;
    }
  }

  // NEW: Load specific book content on demand
  async getBookContent(translationId: string, bookName: string): Promise<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }>; published?: boolean } | null> {
    try {
      return await this.cacheManager.getBookContent(translationId, bookName);
    } catch (error) {
      console.error('Error getting book content:', error);
      throw error;
    }
  }

  // NEW: Load specific chapter content on demand
  async getChapterContent(translationId: string, bookName: string, chapterNumber: number): Promise<{ number: number; verses: Array<{ number: number; text: string }> } | null> {
    try {
      return await this.cacheManager.getChapterContent(translationId, bookName, chapterNumber);
    } catch (error) {
      console.error('Error getting chapter content:', error);
      throw error;
    }
  }

  async getAllTranslations(): Promise<Translation[]> {
    try {
      return await this.cacheManager.getAllTranslations();
    } catch (error) {
      console.error('Error getting all translations:', error);
      throw error;
    }
  }

  async saveTranslation(translation: Translation): Promise<void> {
    try {
      const now = new Date();
      const translationWithTimestamps: Translation = {
        ...translation,
        createdAt: translation.createdAt || now,
        updatedAt: now,
      };
      await this.cacheManager.saveTranslation(translationWithTimestamps);
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    }
  }

  async mergeTranslation(newTranslation: Translation): Promise<Translation> {
    try {
      return await this.cacheManager.mergeTranslation(newTranslation);
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
      const translation = await this.getTranslation(translationId);
      
      if (!translation) {
        // Create new translation
        const newTranslation: Translation = {
          id: translationId,
          name: translationId,
          books: [{
            name: book,
            chapters: [{
              number: chapter,
              verses: [{ number: verse, text }]
            }]
          }]
        };
        await this.saveTranslation(newTranslation);
        return;
      }

      // Update existing translation
      const updated = this.addVerseToTranslation(translation, book, chapter, verse, text);
      // Persist only the affected chapter to cloud to avoid large writes
      const updatedBook = updated.books.find(b => b.name === book);
      const updatedChapter = updatedBook?.chapters.find(c => c.number === chapter);
      if (updatedBook && updatedChapter) {
        await this.cacheManager.saveTranslation({
          id: updated.id,
          name: updated.name,
          books: [{ name: updatedBook.name, chapters: [updatedChapter] }],
          createdAt: updated.createdAt,
          updatedAt: new Date(),
        } as any);
      } else {
        await this.saveTranslation(updated);
      }
    } catch (error) {
      console.error('Error adding/updating verse:', error);
      throw error;
    }
  }


  private addVerseToTranslation(
    translation: Translation,
    book: string,
    chapter: number,
    verse: number,
    text: string
  ): Translation {
    const existingBook = translation.books.find(b => b.name === book);
    
    if (existingBook) {
      const existingChapter = existingBook.chapters.find(c => c.number === chapter);
      
      if (existingChapter) {
        const existingVerse = existingChapter.verses.find(v => v.number === verse);
        if (existingVerse) {
          existingVerse.text = text; // Update
        } else {
          existingChapter.verses.push({ number: verse, text }); // Add new
          existingChapter.verses.sort((a, b) => a.number - b.number);
        }
      } else {
        existingBook.chapters.push({
          number: chapter,
          verses: [{ number: verse, text }]
        });
        existingBook.chapters.sort((a, b) => a.number - b.number);
      }
    } else {
      translation.books.push({
        name: book,
        chapters: [{
          number: chapter,
          verses: [{ number: verse, text }]
        }]
      });
    }
    
    return {
      ...translation,
      updatedAt: new Date(),
    };
  }

  subscribeToTranslation(id: string, callback: (translation: Translation | null) => void): () => void {
    // Import OptimizedFirestoreRepository dynamically to avoid issues
    const { OptimizedFirestoreRepository } = require('../repositories/optimized-firestore-repository');
    const repository = new OptimizedFirestoreRepository();
    return repository.subscribeToTranslation(id, callback);
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    const { OptimizedFirestoreRepository } = require('../repositories/optimized-firestore-repository');
    const repository = new OptimizedFirestoreRepository();
    return repository.subscribeToAllTranslations(callback);
  }

  // Book Publication Management Methods
  async toggleBookPublicationStatus(translationId: string, bookName: string): Promise<boolean> {
    try {
      console.log('[TranslationService] Toggling publication status for book:', bookName, 'in translation:', translationId);
      
      // Get current translation to check current status
      const translation = await this.getTranslation(translationId);
      if (!translation) {
        throw new Error(`Translation ${translationId} not found`);
      }
      
      const book = translation.books.find(b => b.name === bookName);
      if (!book) {
        throw new Error(`Book ${bookName} not found in translation ${translationId}`);
      }
      
      const currentStatus = book.published !== undefined ? book.published : true;
      const newStatus = !currentStatus;
      
      // Update using offline-enabled cache manager method
      await this.cacheManager.updateBookPublicationStatusWithOffline(translationId, bookName, newStatus);
      
      console.log('[TranslationService] Successfully toggled book publication status from', currentStatus, 'to', newStatus);
      return newStatus;
    } catch (error) {
      console.error('Error toggling book publication status:', error);
      throw error;
    }
  }

  async getTranslationsWithPublishedBooks(): Promise<Translation[]> {
    try {
      console.log('[TranslationService] Getting translations with published books only');
      
      const { OptimizedFirestoreRepository } = require('../repositories/optimized-firestore-repository');
      const repository = new OptimizedFirestoreRepository();
      return await repository.getTranslationsWithBookFiltering(true); // publishedOnly = true
    } catch (error) {
      console.error('Error getting translations with published books:', error);
      throw error;
    }
  }

  filterPublishedBooks(translation: Translation): Translation {
    return {
      ...translation,
      books: translation.books.filter(book => book.published !== false) // Include books where published is true or undefined
    };
  }

  async bulkUpdateBookPublicationStatus(translationId: string, bookUpdates: Array<{ bookName: string; published: boolean }>): Promise<void> {
    try {
      console.log('[TranslationService] Bulk updating book publication status for translation:', translationId, 'updates:', bookUpdates.length);
      
      // Update using offline-enabled cache manager method
      await this.cacheManager.bulkUpdateBookPublicationStatusWithOffline(translationId, bookUpdates);
      
      console.log('[TranslationService] Successfully completed bulk book publication status update');
    } catch (error) {
      console.error('Error in bulk book publication status update:', error);
      throw error;
    }
  }
}

