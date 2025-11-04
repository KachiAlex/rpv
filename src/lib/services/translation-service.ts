import { FirestoreRepository } from '../repositories/firestore-repository';
import type { Translation, Book, Chapter, Verse } from '../types';

export class TranslationService {
  private repository: FirestoreRepository;

  constructor() {
    this.repository = new FirestoreRepository();
  }

  async getTranslation(id: string): Promise<Translation | null> {
    try {
      return await this.repository.getTranslation(id);
    } catch (error) {
      console.error('Error getting translation:', error);
      throw error;
    }
  }

  async getAllTranslations(): Promise<Translation[]> {
    try {
      return await this.repository.getAllTranslations();
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
      await this.repository.saveTranslation(translationWithTimestamps);
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    }
  }

  async mergeTranslation(newTranslation: Translation): Promise<Translation> {
    try {
      const existing = await this.getTranslation(newTranslation.id);
      
      if (!existing) {
        // New translation
        await this.saveTranslation(newTranslation);
        return newTranslation;
      }

      // Merge translations
      const merged = this.mergeTranslations(existing, newTranslation);
      await this.saveTranslation(merged);
      return merged;
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
      await this.saveTranslation(updated);
    } catch (error) {
      console.error('Error adding/updating verse:', error);
      throw error;
    }
  }

  private mergeTranslations(existing: Translation, newTranslation: Translation): Translation {
    const existingBook = existing.books.find(b => b.name === newTranslation.books[0]?.name);
    
    let updatedBooks: Book[];
    
    if (existingBook) {
      // Merge chapters into existing book
      const newBook = newTranslation.books[0];
      const updatedChapters = [...existingBook.chapters];
      
      newBook.chapters.forEach(newChapter => {
        const chapterIndex = updatedChapters.findIndex(c => c.number === newChapter.number);
        if (chapterIndex >= 0) {
          // Merge verses into existing chapter
          const existingChapter = updatedChapters[chapterIndex];
          const updatedVerses = [...existingChapter.verses];
          
          newChapter.verses.forEach(newVerse => {
            const verseIndex = updatedVerses.findIndex(v => v.number === newVerse.number);
            if (verseIndex >= 0) {
              updatedVerses[verseIndex] = newVerse; // Update existing
            } else {
              updatedVerses.push(newVerse); // Add new
            }
          });
          
          updatedVerses.sort((a, b) => a.number - b.number);
          updatedChapters[chapterIndex] = { ...existingChapter, verses: updatedVerses };
        } else {
          updatedChapters.push(newChapter); // Add new chapter
        }
      });
      
      updatedChapters.sort((a, b) => a.number - b.number);
      updatedBooks = existing.books.map(b => 
        b.name === existingBook.name ? { ...b, chapters: updatedChapters } : b
      );
    } else {
      // Add new book
      updatedBooks = [...existing.books, newTranslation.books[0]];
    }
    
    return {
      ...existing,
      name: newTranslation.name || existing.name,
      books: updatedBooks,
      updatedAt: new Date(),
    };
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
    return this.repository.subscribeToTranslation(id, callback);
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    return this.repository.subscribeToAllTranslations(callback);
  }
}

