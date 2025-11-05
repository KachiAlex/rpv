import { getFirebase } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface Note {
  id: string;
  userId: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export class NotesService {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  async getNotes(userId: string, translationId: string, book: string, chapter: number, verse: number): Promise<Note[]> {
    const db = this.getDb();
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(
      notesRef,
      where('translationId', '==', translationId),
      where('book', '==', book),
      where('chapter', '==', chapter),
      where('verse', '==', verse),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Note[];
  }

  async getAllNotes(userId: string, limit: number = 100): Promise<Note[]> {
    const db = this.getDb();
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, orderBy('updatedAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .slice(0, limit)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Note[];
  }

  async addNote(
    userId: string,
    note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const db = this.getDb();
    const notesRef = collection(db, 'users', userId, 'notes');
    const now = new Date();
    
    const newNote = {
      ...note,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = doc(notesRef);
    await setDoc(docRef, newNote);
    return docRef.id;
  }

  async updateNote(userId: string, noteId: string, text: string): Promise<void> {
    const db = this.getDb();
    await updateDoc(doc(db, 'users', userId, 'notes', noteId), {
      text,
      updatedAt: new Date(),
    });
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const db = this.getDb();
    await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
  }
}

