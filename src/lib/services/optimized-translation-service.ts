import { OptimizedCacheManager } from '../cache/optimized-cache-manager';
import type { Translation, Book, Chapter, Verse } from '../types';

export class OptimizedTranslationService {
  private cacheManager: OptimizedCacheManager;

  constructor() {
    this.cacheManager = new OptimizedCacheManager();
  }

  // OPTIMIZED: Load metadata-only translations first (10-100x faster)
  async getAllTranslations(): Promise<Translation[]> {
    try {
      console.log('[OptimizedTranslationService] Loading translations with metadata-first optimization...');
      const startTime = performance.now();
      
      const translations = await this.cacheManager.getAllTranslations();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`[OptimizedTranslationService] Loaded ${translations.length} translations in ${loadTime.toFixed(2)}ms (metadata-first)`);
      
      // Log optimization metrics
      const metadataOnlyCount = translations.filter(t => (t as any)._isMetadataOnly).length;
      const fullContentCount = translations.length - metadataOnlyCount;
      
      console.log(`[OptimizedTranslationService] Optimization breakdown: ${metadataOnlyCount} metadata-only, ${fullContentCount} full content`);
      
      return translations;
    } catch (error) {
      console.error('Error loading translations (optimized):', error);
      throw error;
    }
  }

  // OPTIMIZED: Load full content only when needed
  async getTranslationWithContent(id: string): Promise<Translation | null> {
    try {
      console.log('[OptimizedTranslationService] Loading full content for translation:', id);
      const startTime = performance.now();
      
      const translation = await this.cacheManager.getTranslationWithContent(id);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (translation) {
        const totalBooks = translation.books?.length || 0;
        const totalChapters = translation.books?.reduce((sum, book) => sum + (book.chapters?.length || 0), 0) || 0;
        const totalVerses = translation.books?.reduce((sum, book) => 
          sum + (book.chapters?.reduce((chSum, ch) => chSum + (ch.verses?.length || 0), 0) || 0), 0) || 0;
        
        console.log(`[OptimizedTranslationService] Loaded full content for ${id} in ${loadTime.toFixed(2)}ms: ${totalBooks} books, ${totalChapters} chapters, ${totalVerses} verses`);
      }
      
      return translation;
    } catch (error) {
      console.error('Error loading translation content:', error);
      throw error;
    }
  }

  // OPTIMIZED: Load specific book content on demand
  async getBookContent(translationId: string, bookName: string): Promise<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> } | null> {
    try {
      console.log('[OptimizedTranslationService] Loading book content on demand:', bookName, 'from translation:', translationId);
      const startTime = performance.now();
      
      const bookContent = await this.cacheManager.getBookContent(translationId, bookName);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (bookContent) {
        const totalChapters = bookContent.chapters?.length || 0;
        const totalVerses = bookContent.chapters?.reduce((sum, ch) => sum + (ch.verses?.length || 0), 0) || 0;
        
        console.log(`[OptimizedTranslationService] Loaded book ${bookName} in ${loadTime.toFixed(2)}ms: ${totalChapters} chapters, ${totalVerses} verses`);
      }
      
      return bookContent;
    } catch (error) {
      console.error('Error loading book content:', error);
      throw error;
    }
  }

  // OPTIMIZED: Load specific chapter content (most granular)
  async getChapterContent(translationId: string, bookName: string, chapterNumber: number): Promise<{ number: number; verses: Array<{ number: number; text: string }> } | null> {
    try {
      console.log('[OptimizedTranslationService] Loading chapter content on demand:', bookName, chapterNumber, 'from translation:', translationId);
      const startTime = performance.now();
      
      const chapterContent = await this.cacheManager.getChapterContent(translationId, bookName, chapterNumber);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (chapterContent) {
        const totalVerses = chapterContent.verses?.length || 0;
        console.log(`[OptimizedTranslationService] Loaded chapter ${bookName} ${chapterNumber} in ${loadTime.toFixed(2)}ms: ${totalVerses} verses`);
      }
      
      return chapterContent;
    } catch (error) {
      console.error('Error loading chapter content:', error);
      throw error;
    }
  }

  // Standard methods for backward compatibility
  async getTranslation(id: string): Promise<Translation | null> {
    try {
      return await this.cacheManager.getTranslation(id);
    } catch (error) {
      console.error('Error getting translation:', error);
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
      await this.saveTranslation(updated);
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

  // Performance monitoring methods
  getCacheStats(): { 
    memoryUsage: string; 
    cacheHitRate: string; 
    totalTranslations: number;
    metadataOnlyCount: number;
    fullContentCount: number;
  } {
    // This would require additional tracking in the cache manager
    // For now, return placeholder data
    return {
      memoryUsage: 'N/A',
      cacheHitRate: 'N/A',
      totalTranslations: 0,
      metadataOnlyCount: 0,
      fullContentCount: 0
    };
  }

  clearCaches(): void {
    this.cacheManager.clearMemoryCache();
  }

  async clearAllCaches(): Promise<void> {
    await this.cacheManager.clearAllCaches();
  }

  // Subscription methods for real-time updates
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
}