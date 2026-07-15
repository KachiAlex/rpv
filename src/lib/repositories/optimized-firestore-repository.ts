import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  getDocs,
  Timestamp, 
  writeBatch
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { Translation, ProjectorRef } from '../types';

export class OptimizedFirestoreRepository {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized. Please check your Firebase configuration.');
    }
    return db;
  }

  // OPTIMIZED: Load only metadata (translation names and book names) initially
  async getAllTranslationsMetadata(): Promise<Translation[]> {
    const db = this.getDb();
    const q = query(collection(db, 'translations'));
    const querySnapshot = await getDocs(q);
    
    console.log('[OptimizedFirestore] getAllTranslationsMetadata - Found', querySnapshot.docs.length, 'translation root documents');
    
    const translations: Translation[] = [];
    for (const d of querySnapshot.docs) {
      try {
        const base = d.data();
        const id = base.id as string;
        const name = (base.name as string) || id;

        console.log('[OptimizedFirestore] Loading translation metadata only:', id, name);

        // Only load book names (metadata) initially, not full content
        const booksSnap = await getDocs(collection(db, 'translations', id, 'books'));
        console.log('[OptimizedFirestore] Found', booksSnap.docs.length, 'books for translation', id);
        
        const books = [] as Translation['books'];
        for (const b of booksSnap.docs) {
          try {
            const bookData = b.data();
            const bookName = (bookData.name as string) || b.id;
            const published = bookData.published !== undefined ? bookData.published : true; // Default to published
            // Create book with empty chapters - will be loaded on demand
            books.push({ name: bookName, chapters: [], published });
          } catch (bookError) {
            console.warn(`[OptimizedFirestore] Error loading book metadata ${b.id} for translation ${id}:`, bookError);
          }
        }

        if (id && name && Array.isArray(books)) {
          console.log('[OptimizedFirestore] Translation', id, 'has', books.length, 'books (metadata only)');
          
          translations.push({ 
            id, 
            name, 
            books, 
            createdAt: base.createdAt?.toDate(), 
            updatedAt: base.updatedAt?.toDate(),
            // Mark as metadata-only for lazy loading
            _isMetadataOnly: true
          } as Translation & { _isMetadataOnly: boolean });
        }
      } catch (translationError) {
        console.warn(`[OptimizedFirestore] Error loading translation ${d.id}:`, translationError);
      }
    }

    console.log('[OptimizedFirestore] Returning', translations.length, 'translations (metadata only)');
    return translations;
  }

  // Load full translation content on demand
  async getTranslationWithContent(id: string): Promise<Translation | null> {
    const db = this.getDb();
    const docRef = doc(db, 'translations', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    try {
      const base = docSnap.data();
      const translationId = base.id as string || id;
      const name = (base.name as string) || translationId;

      console.log('[OptimizedFirestore] Loading full content for translation:', translationId);

      // Load all books with full content
      const booksSnap = await getDocs(collection(db, 'translations', id, 'books'));
      const books = [] as Translation['books'];
      for (const b of booksSnap.docs) {
        try {
          const bookData = b.data();
          const bookName = (bookData.name as string) || b.id;
          const published = bookData.published !== undefined ? bookData.published : true; // Default to published
          const chaptersSnap = await getDocs(collection(db, 'translations', id, 'books', b.id, 'chapters'));
          const chapters = chaptersSnap.docs
            .map(ch => {
              const verses = (ch.data().verses || []) as Array<{ number: number; text: string }>;
              return { number: Number(ch.id), verses: Array.isArray(verses) ? verses : [] };
            })
            .filter(ch => !isNaN(ch.number))
            .sort((a, b) => a.number - b.number);
          if (bookName && Array.isArray(chapters)) {
            books.push({ name: bookName, chapters, published });
          }
        } catch (bookError) {
          console.warn(`Error loading book ${b.id} for translation ${id}:`, bookError);
        }
      }

      const totalChapters = books.reduce((sum, b) => sum + b.chapters.length, 0);
      const totalVerses = books.reduce((sum, b) => sum + b.chapters.reduce((sumCh, ch) => sumCh + ch.verses.length, 0), 0);
      console.log('[OptimizedFirestore] Loaded full content for', translationId, ':', books.length, 'books,', totalChapters, 'chapters,', totalVerses, 'verses');

      return { 
        id: translationId, 
        name, 
        books: Array.isArray(books) ? books : [], 
        createdAt: base.createdAt?.toDate(), 
        updatedAt: base.updatedAt?.toDate() 
      } as Translation;
    } catch (error) {
      console.warn(`Error loading full translation ${id}:`, error);
      return null;
    }
  }

  // Load specific book content on demand
  async getBookContent(translationId: string, bookName: string): Promise<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }>; published?: boolean } | null> {
    const db = this.getDb();
    
    try {
      console.log('[OptimizedFirestore] Loading book content:', bookName, 'from translation:', translationId);
      
      // Get book metadata first to check publication status
      const bookDoc = doc(db, 'translations', translationId, 'books', bookName);
      const bookSnap = await getDoc(bookDoc);
      const published = bookSnap.exists() ? (bookSnap.data().published !== undefined ? bookSnap.data().published : true) : true;
      
      const chaptersSnap = await getDocs(collection(db, 'translations', translationId, 'books', bookName, 'chapters'));
      const chapters = chaptersSnap.docs
        .map(ch => {
          const verses = (ch.data().verses || []) as Array<{ number: number; text: string }>;
          return { number: Number(ch.id), verses: Array.isArray(verses) ? verses : [] };
        })
        .filter(ch => !isNaN(ch.number))
        .sort((a, b) => a.number - b.number);

      const totalVerses = chapters.reduce((sum, ch) => sum + ch.verses.length, 0);
      console.log('[OptimizedFirestore] Loaded book', bookName, ':', chapters.length, 'chapters,', totalVerses, 'verses, published:', published);

      return { name: bookName, chapters, published };
    } catch (error) {
      console.warn(`Error loading book ${bookName} from translation ${translationId}:`, error);
      return null;
    }
  }

  // Load specific chapter content (even more granular)
  async getChapterContent(translationId: string, bookName: string, chapterNumber: number): Promise<{ number: number; verses: Array<{ number: number; text: string }> } | null> {
    const db = this.getDb();
    
    try {
      console.log('[OptimizedFirestore] Loading chapter content:', bookName, chapterNumber, 'from translation:', translationId);
      
      const chapterDoc = doc(db, 'translations', translationId, 'books', bookName, 'chapters', String(chapterNumber));
      const chapterSnap = await getDoc(chapterDoc);
      
      if (!chapterSnap.exists()) {
        return null;
      }
      
      const data = chapterSnap.data();
      const verses = (data.verses || []) as Array<{ number: number; text: string }>;
      
      console.log('[OptimizedFirestore] Loaded chapter', chapterNumber, 'with', verses.length, 'verses');
      
      return {
        number: chapterNumber,
        verses: Array.isArray(verses) ? verses : []
      };
    } catch (error) {
      console.warn(`Error loading chapter ${chapterNumber} from book ${bookName} in translation ${translationId}:`, error);
      return null;
    }
  }

  // Fallback to original method for compatibility
  async getAllTranslations(): Promise<Translation[]> {
    // For now, use metadata-only loading as the default
    return this.getAllTranslationsMetadata();
  }

  // Original methods for saving (unchanged)
  async getTranslation(id: string): Promise<Translation | null> {
    // Use the optimized content loading
    return this.getTranslationWithContent(id);
  }

  async saveTranslation(translation: Translation): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, 'translations', translation.id);
    
    const now = Timestamp.now();
    const data = {
      ...translation,
      createdAt: translation.createdAt ? Timestamp.fromDate(translation.createdAt) : now,
      updatedAt: now,
    };
    
    // Store minimal metadata at root doc
    await setDoc(docRef, { id: translation.id, name: translation.name, createdAt: data.createdAt, updatedAt: data.updatedAt }, { merge: true });

    // Chunk by chapter to avoid 1MB doc limits
    for (const book of translation.books || []) {
      await this.saveBook(translation.id, book);
    }
  }

  async saveBook(translationId: string, book: { name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }>; published?: boolean }): Promise<void> {
    const db = this.getDb();
    const batch = writeBatch(db);

    // Ensure book container doc (can be metadata only)
    const bookDoc = doc(db, 'translations', translationId, 'books', book.name);
    const published = book.published !== undefined ? book.published : true; // Default to published
    batch.set(bookDoc, { name: book.name, published }, { merge: true });

    for (const chapter of book.chapters) {
      const chDoc = doc(db, 'translations', translationId, 'books', book.name, 'chapters', String(chapter.number));
      batch.set(chDoc, { number: chapter.number, verses: chapter.verses }, { merge: true });
    }

    await batch.commit();
  }

  async saveBooks(translationId: string, translationName: string, books: Array<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }>; published?: boolean }>): Promise<void> {
    const db = this.getDb();
    // Ensure root doc exists with metadata
    const now = Timestamp.now();
    const root = doc(db, 'translations', translationId);
    await setDoc(root, { id: translationId, name: translationName, updatedAt: now }, { merge: true });
    for (const b of books) {
      await this.saveBook(translationId, b);
    }
  }

  subscribeToTranslation(id: string, callback: (translation: Translation | null) => void): () => void {
    const db = this.getDb();
    const docRef = doc(db, 'translations', id);
    
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
          return;
        }
        const data = docSnap.data();
        callback({
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Translation);
      },
      (error) => {
        console.warn('Firestore subscription error (translation):', error?.message || error);
      }
    );
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    const db = this.getDb();
    const q = query(collection(db, 'translations'));
    
    // Load metadata-only translations initially and on updates
    const loadMetadataTranslations = async () => {
      try {
        const translations = await this.getAllTranslationsMetadata();
        callback(translations);
      } catch (error) {
        console.warn('Error loading metadata translations:', error);
      }
    };
    
    // Load initially
    loadMetadataTranslations();
    
    // Subscribe to changes and reload when translations change
    const unsubscribe = onSnapshot(
      q,
      () => {
        // Reload metadata when root documents change
        loadMetadataTranslations();
      },
      (error) => {
        console.warn('Firestore subscription error (all translations):', error?.message || error);
      }
    );
    
    return unsubscribe;
  }

  // Projection channel operations (unchanged)
  async getProjectionChannel(channelId: string): Promise<ProjectorRef | null> {
    const db = this.getDb();
    const docRef = doc(db, 'channels', channelId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      ...data,
      timestamp: data.timestamp?.toDate(),
    } as ProjectorRef;
  }

  async saveProjectionChannel(channelId: string, ref: ProjectorRef): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, 'channels', channelId);
    
    const data = {
      ...ref,
      timestamp: ref.timestamp ? Timestamp.fromDate(ref.timestamp) : Timestamp.now(),
    };
    
    await setDoc(docRef, data, { merge: true });
  }

  subscribeToProjectionChannel(channelId: string, callback: (ref: ProjectorRef | null) => void): () => void {
    const db = this.getDb();
    const docRef = doc(db, 'channels', channelId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      
      const data = docSnap.data();
      callback({
        ...data,
        timestamp: data.timestamp?.toDate(),
      } as ProjectorRef);
    });
  }

  // Book Publication Management Methods
  async updateBookPublicationStatus(translationId: string, bookName: string, published: boolean): Promise<void> {
    const db = this.getDb();
    
    try {
      console.log('[OptimizedFirestore] Updating book publication status:', bookName, 'in translation:', translationId, 'to:', published);
      
      const bookDoc = doc(db, 'translations', translationId, 'books', bookName);
      const now = Timestamp.now();
      
      // Simple optimistic locking: include a version field
      const currentBookSnap = await getDoc(bookDoc);
      const currentVersion = currentBookSnap.exists() ? (currentBookSnap.data().version || 0) : 0;
      const newVersion = currentVersion + 1;
      
      await setDoc(bookDoc, { 
        name: bookName, 
        published,
        updatedAt: now,
        version: newVersion
      }, { merge: true });
      
      console.log('[OptimizedFirestore] Successfully updated book publication status with version:', newVersion);
    } catch (error) {
      console.error(`Error updating book publication status for ${bookName} in translation ${translationId}:`, error);
      throw error;
    }
  }

  async getTranslationsWithBookFiltering(publishedOnly: boolean = false): Promise<Translation[]> {
    const db = this.getDb();
    
    try {
      console.log('[OptimizedFirestore] Loading translations with book filtering, publishedOnly:', publishedOnly);
      
      const q = query(collection(db, 'translations'));
      const querySnapshot = await getDocs(q);
      
      const translations: Translation[] = [];
      for (const d of querySnapshot.docs) {
        try {
          const base = d.data();
          const id = base.id as string;
          const name = (base.name as string) || id;

          // Load books with publication status
          const booksSnap = await getDocs(collection(db, 'translations', id, 'books'));
          const books = [] as Translation['books'];
          
          for (const b of booksSnap.docs) {
            try {
              const bookData = b.data();
              const bookName = (bookData.name as string) || b.id;
              const published = bookData.published !== undefined ? bookData.published : true; // Default to published
              
              // Filter books based on publication status if requested
              if (!publishedOnly || published) {
                // Create book with empty chapters - will be loaded on demand
                books.push({ 
                  name: bookName, 
                  chapters: [],
                  published 
                });
              }
            } catch (bookError) {
              console.warn(`[OptimizedFirestore] Error loading book metadata ${b.id} for translation ${id}:`, bookError);
            }
          }

          // Only include translation if it has books (after filtering)
          if (books.length > 0 && id && name) {
            console.log('[OptimizedFirestore] Translation', id, 'has', books.length, publishedOnly ? 'published' : 'total', 'books');
            
            translations.push({ 
              id, 
              name, 
              books, 
              createdAt: base.createdAt?.toDate(), 
              updatedAt: base.updatedAt?.toDate(),
              _isMetadataOnly: true
            } as Translation & { _isMetadataOnly: boolean });
          }
        } catch (translationError) {
          console.warn(`[OptimizedFirestore] Error loading translation ${d.id}:`, translationError);
        }
      }

      console.log('[OptimizedFirestore] Returning', translations.length, 'translations with book filtering');
      return translations;
    } catch (error) {
      console.error('Error loading translations with book filtering:', error);
      throw error;
    }
  }
}