import { CacheManager } from '../cache/cache-manager';
import type { Translation, Book, Chapter, Verse } from '../types';

export class TranslationService {
  private cacheManager: CacheManager;

  constructor() {
    this.cacheManager = new CacheManager();
  }

  async getTranslation(id: string): Promise<Translation | null> {
    try {
      return await this.cacheManager.getTranslation(id);
    } catch (error) {
      console.error('Error getting translation:', error);
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
    // Import FirestoreRepository dynamically to avoid issues
    const { FirestoreRepository } = require('../repositories/firestore-repository');
    const repository = new FirestoreRepository();
    return repository.subscribeToTranslation(id, callback);
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    const { FirestoreRepository } = require('../repositories/firestore-repository');
    const repository = new FirestoreRepository();
    return repository.subscribeToAllTranslations(callback);
  }
}

