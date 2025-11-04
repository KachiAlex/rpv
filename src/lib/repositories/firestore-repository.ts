import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  Timestamp 
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
    
    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Translation;
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
    
    await setDoc(docRef, data, { merge: true });
  }

  async getAllTranslations(): Promise<Translation[]> {
    const db = this.getDb();
    const q = query(collection(db, 'translations'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Translation;
    });
  }

  subscribeToTranslation(id: string, callback: (translation: Translation | null) => void): () => void {
    const db = this.getDb();
    const docRef = doc(db, 'translations', id);
    
    return onSnapshot(docRef, (docSnap) => {
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
    });
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    const db = this.getDb();
    const q = query(collection(db, 'translations'));
    
    return onSnapshot(q, (querySnapshot) => {
      const translations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Translation;
      });
      callback(translations);
    });
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

