import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Translation } from '../types';

interface BibleDBSchema extends DBSchema {
  translations: {
    key: string;
    value: Translation;
    indexes: { 'by-id': string };
  };
  projectionChannels: {
    key: string;
    value: {
      channelId: string;
      ref: any;
      timestamp: number;
    };
    indexes: { 'by-channel': string };
  };
}

const DB_NAME = 'rpv-bible-cache';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BibleDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<BibleDBSchema>> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available in this environment'));
  }

  if (!dbPromise) {
    dbPromise = openDB<BibleDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Translations store
        if (!db.objectStoreNames.contains('translations')) {
          const translationStore = db.createObjectStore('translations', { keyPath: 'id' });
          translationStore.createIndex('by-id', 'id', { unique: true });
        }

        // Projection channels store
        if (!db.objectStoreNames.contains('projectionChannels')) {
          const channelStore = db.createObjectStore('projectionChannels', { keyPath: 'channelId' });
          channelStore.createIndex('by-channel', 'channelId', { unique: true });
        }
      },
    });
  }
  return dbPromise;
}

export class IndexedDBCache {
  private isClientSide(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  }

  async saveTranslation(translation: Translation): Promise<void> {
    if (!this.isClientSide()) {
      return; // Silently skip on server side
    }
    
    try {
      const db = await getDB();
      await db.put('translations', translation);
    } catch (error) {
      console.error('Error saving translation to IndexedDB:', error);
    }
  }

  async getTranslation(id: string): Promise<Translation | null> {
    if (!this.isClientSide()) {
      return null; // Return null on server side
    }
    
    try {
      const db = await getDB();
      return (await db.get('translations', id)) || null;
    } catch (error) {
      console.error('Error getting translation from IndexedDB:', error);
      return null;
    }
  }

  async getAllTranslations(): Promise<Translation[]> {
    if (!this.isClientSide()) {
      return []; // Return empty array on server side
    }
    
    try {
      const db = await getDB();
      return await db.getAll('translations');
    } catch (error) {
      console.error('Error getting all translations from IndexedDB:', error);
      return [];
    }
  }

  async deleteTranslation(id: string): Promise<void> {
    if (!this.isClientSide()) {
      return; // Silently skip on server side
    }
    
    try {
      const db = await getDB();
      await db.delete('translations', id);
    } catch (error) {
      console.error('Error deleting translation from IndexedDB:', error);
    }
  }

  async saveProjectionChannel(channelId: string, ref: any): Promise<void> {
    if (!this.isClientSide()) {
      return; // Silently skip on server side
    }
    
    try {
      const db = await getDB();
      await db.put('projectionChannels', {
        channelId,
        ref,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error saving projection channel to IndexedDB:', error);
    }
  }

  async getProjectionChannel(channelId: string): Promise<any | null> {
    if (!this.isClientSide()) {
      return null; // Return null on server side
    }
    
    try {
      const db = await getDB();
      const data = await db.get('projectionChannels', channelId);
      return data?.ref || null;
    } catch (error) {
      console.error('Error getting projection channel from IndexedDB:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    if (!this.isClientSide()) {
      return; // Silently skip on server side
    }
    
    try {
      const db = await getDB();
      await db.clear('translations');
      await db.clear('projectionChannels');
    } catch (error) {
      console.error('Error clearing IndexedDB cache:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isClientSide()) {
      return false;
    }
    
    try {
      await getDB();
      return true;
    } catch {
      return false;
    }
  }
}

