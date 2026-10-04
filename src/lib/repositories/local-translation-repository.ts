import { promises as fs } from 'fs';
import path from 'path';
import type { Translation, Book } from '../types';

const LOCAL_DIR = path.join(process.cwd(), 'public', 'translations');

export class LocalTranslationRepository {
  static isAvailable(): boolean {
    try {
      return typeof process.cwd === 'function';
    } catch {
      return false;
    }
  }

  async getAllTranslations(): Promise<Translation[]> {
    try {
      const files = await fs.readdir(LOCAL_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      const translations: Translation[] = [];

      for (const file of jsonFiles) {
        const filePath = path.join(LOCAL_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        if (data.translations && Array.isArray(data.translations)) {
          translations.push(...data.translations);
        }
      }

      return translations;
    } catch {
      return [];
    }
  }

  async getTranslation(id: string, full: boolean = false): Promise<Translation | null> {
    try {
      const translations = await this.getAllTranslations();
      const translation = translations.find(t => t.id === id);
      if (!translation) return null;
      if (!full) {
        return {
          ...translation,
          books: translation.books.map(b => ({ name: b.name, chapters: [] })),
        };
      }
      return translation;
    } catch {
      return null;
    }
  }

  async getBookContent(translationId: string, bookName: string): Promise<Book | null> {
    try {
      const translation = await this.getTranslation(translationId, true);
      if (!translation) return null;
      return translation.books.find(b => b.name === bookName) || null;
    } catch {
      return null;
    }
  }

  async saveTranslation(_translation: Translation): Promise<void> {}
}
