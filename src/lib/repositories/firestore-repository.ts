import type { Translation, ProjectorRef } from '../types';

export class FirestoreRepository {
  async getTranslation(_id: string): Promise<Translation | null> { return null; }
  async saveTranslation(_translation: Translation): Promise<void> {}
  async saveBook(_translationId: string, _book: { name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> }): Promise<void> {}
  async saveBooks(_translationId: string, _translationName: string, _books: Array<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> }>): Promise<void> {}
  async getAllTranslations(): Promise<Translation[]> { return []; }
  async getTranslationWithContent(_id: string): Promise<Translation | null> { return null; }
  async getBookContent(_translationId: string, _bookName: string): Promise<{ name: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> } | null> { return null; }
  subscribeToTranslation(_id: string, _callback: (translation: Translation | null) => void): () => void { return () => {}; }
  subscribeToAllTranslations(_callback: (translations: Translation[]) => void): () => void { return () => {}; }
  async getProjectionChannel(_channelId: string): Promise<ProjectorRef | null> { return null; }
  async saveProjectionChannel(_channelId: string, _ref: ProjectorRef): Promise<void> {}
  subscribeToProjectionChannel(_channelId: string, _callback: (ref: ProjectorRef | null) => void): () => void { return () => {}; }
}
