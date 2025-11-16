import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  Timestamp, 
  writeBatch
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { Translation, ProjectorRef } from '../types';

export class FirestoreRepository {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized. Please check your Firebase configuration.');
    }
    return db;
  }

  // Translation operations
  async getTranslation(id: string): Promise<Translation | null> {
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

      // Reconstruct books/chapters from chunks
      const booksSnap = await getDocs(collection(db, 'translations', id, 'books'));
      const books = [] as Translation['books'];
      for (const b of booksSnap.docs) {
        try {
          const bookName = (b.data().name as string) || b.id;
          const chaptersSnap = await getDocs(collection(db, 'translations', id, 'books', b.id, 'chapters'));
          const chapters = chaptersSnap.docs
            .map(ch => {
              const verses = (ch.data().verses || []) as Array<{ number: number; text: string }>;
              return { number: Number(ch.id), verses: Array.isArray(verses) ? verses : [] };
            })
            .filter(ch => !isNaN(ch.number))
            .sort((a, b) => a.number - b.number);
          if (bookName && Array.isArray(chapters)) {
            books.push({ name: bookName, chapters });
          }
        } catch (bookError) {
          console.warn(`Error loading book ${b.id} for translation ${id}:`, bookError);
          // Skip this book but continue
        }
      }

      return { 
        id: translationId, 
        name, 
        books: Array.isArray(books) ? books : [], 
        createdAt: base.createdAt?.toDate(), 
        updatedAt: base.updatedAt?.toDate() 
      } as Translation;
    } catch (error) {
      console.warn(`Error loading translation ${id}:`, error);
      return null;
    }
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

  async saveBook(translationId: string, book: { name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> }): Promise<void> {
    const db = this.getDb();
    const batch = writeBatch(db);

    // Ensure book container doc (can be metadata only)
    const bookDoc = doc(db, 'translations', translationId, 'books', book.name);
    batch.set(bookDoc, { name: book.name }, { merge: true });

    for (const chapter of book.chapters) {
      const chDoc = doc(db, 'translations', translationId, 'books', book.name, 'chapters', String(chapter.number));
      batch.set(chDoc, { number: chapter.number, verses: chapter.verses }, { merge: true });
    }

    await batch.commit();
  }

  async saveBooks(translationId: string, translationName: string, books: Array<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> }>): Promise<void> {
    const db = this.getDb();
    // Ensure root doc exists with metadata
    const now = Timestamp.now();
    const root = doc(db, 'translations', translationId);
    await setDoc(root, { id: translationId, name: translationName, updatedAt: now }, { merge: true });
    for (const b of books) {
      await this.saveBook(translationId, b);
    }
  }

  async getAllTranslations(): Promise<Translation[]> {
    const db = this.getDb();
    const q = query(collection(db, 'translations'));
    const querySnapshot = await getDocs(q);
    
    console.log('[FirestoreRepository] getAllTranslations - Found', querySnapshot.docs.length, 'translation root documents');
    
    const translations: Translation[] = [];
    for (const d of querySnapshot.docs) {
      try {
        const base = d.data();
        const id = base.id as string;
        const name = (base.name as string) || id;

        console.log('[FirestoreRepository] Loading translation:', id, name);

        // Reconstruct books/chapters
        const booksSnap = await getDocs(collection(db, 'translations', id, 'books'));
        console.log('[FirestoreRepository] Found', booksSnap.docs.length, 'books for translation', id);
        
        const books = [] as Translation['books'];
        for (const b of booksSnap.docs) {
          try {
            const bookName = (b.data().name as string) || b.id;
            console.log('[FirestoreRepository] Loading book:', bookName, 'for translation', id);
            
            const chaptersSnap = await getDocs(collection(db, 'translations', id, 'books', b.id, 'chapters'));
            console.log('[FirestoreRepository] Found', chaptersSnap.docs.length, 'chapters for book', bookName);
            
            const chapters = chaptersSnap.docs
              .map(ch => {
                const verses = (ch.data().verses || []) as Array<{ number: number; text: string }>;
                return { number: Number(ch.id), verses: Array.isArray(verses) ? verses : [] };
              })
              .filter(ch => !isNaN(ch.number))
              .sort((a, b) => a.number - b.number);
            
            const totalVerses = chapters.reduce((sum, ch) => sum + ch.verses.length, 0);
            console.log('[FirestoreRepository] Book', bookName, 'has', chapters.length, 'chapters with', totalVerses, 'total verses');
            
            if (bookName && Array.isArray(chapters)) {
              books.push({ name: bookName, chapters });
            }
          } catch (bookError) {
            console.warn(`[FirestoreRepository] Error loading book ${b.id} for translation ${id}:`, bookError);
            // Skip this book but continue
          }
        }

        if (id && name && Array.isArray(books)) {
          const totalBooks = books.length;
          const totalChapters = books.reduce((sum, b) => sum + b.chapters.length, 0);
          const totalVerses = books.reduce((sum, b) => sum + b.chapters.reduce((sumCh, ch) => sumCh + ch.verses.length, 0), 0);
          console.log('[FirestoreRepository] Translation', id, 'has', totalBooks, 'books,', totalChapters, 'chapters,', totalVerses, 'verses');
          
          translations.push({ id, name, books, createdAt: base.createdAt?.toDate(), updatedAt: base.updatedAt?.toDate() } as Translation);
        }
      } catch (translationError) {
        console.warn(`[FirestoreRepository] Error loading translation ${d.id}:`, translationError);
        // Skip this translation but continue
      }
    }

    console.log('[FirestoreRepository] Returning', translations.length, 'translations');
    return translations;
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
        // Swallow permission errors so UI can fallback to local seed/cache
        console.warn('Firestore subscription error (translation):', error?.message || error);
      }
    );
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    const db = this.getDb();
    const q = query(collection(db, 'translations'));
    
    // Load full translations initially and on updates
    const loadFullTranslations = async () => {
      try {
        const querySnapshot = await getDocs(q);
        const translations: Translation[] = [];
        
        for (const d of querySnapshot.docs) {
          try {
            const base = d.data();
            const id = base.id as string;
            const name = (base.name as string) || id;

            // Reconstruct books/chapters from subcollections
            const booksSnap = await getDocs(collection(db, 'translations', id, 'books'));
            const books = [] as Translation['books'];
            for (const b of booksSnap.docs) {
              try {
                const bookName = (b.data().name as string) || b.id;
                const chaptersSnap = await getDocs(collection(db, 'translations', id, 'books', b.id, 'chapters'));
                const chapters = chaptersSnap.docs
                  .map(ch => {
                    const verses = (ch.data().verses || []) as Array<{ number: number; text: string }>;
                    return { number: Number(ch.id), verses: Array.isArray(verses) ? verses : [] };
                  })
                  .filter(ch => !isNaN(ch.number))
                  .sort((a, b) => a.number - b.number);
                if (bookName && Array.isArray(chapters)) {
                  books.push({ name: bookName, chapters });
                }
              } catch (bookError) {
                console.warn(`Error loading book ${b.id} for translation ${id}:`, bookError);
              }
            }

            if (id && name && Array.isArray(books)) {
              translations.push({ id, name, books, createdAt: base.createdAt?.toDate(), updatedAt: base.updatedAt?.toDate() } as Translation);
            }
          } catch (translationError) {
            console.warn(`Error loading translation ${d.id}:`, translationError);
          }
        }
        
        callback(translations);
      } catch (error) {
        console.warn('Error loading full translations:', error);
      }
    };
    
    // Load initially
    loadFullTranslations();
    
    // Subscribe to changes and reload when translations change
    const unsubscribe = onSnapshot(
      q,
      () => {
        // Reload full translations when root documents change
        loadFullTranslations();
      },
      (error) => {
        // Swallow permission errors so UI can fallback to local seed/cache
        console.warn('Firestore subscription error (all translations):', error?.message || error);
      }
    );
    
    return unsubscribe;
  }

  // Projection channel operations
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
}

