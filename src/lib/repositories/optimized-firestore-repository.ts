import type { Translation, ProjectorRef } from '../types';

export class OptimizedFirestoreRepository {
  async getAllTranslationsMetadata(): Promise<Translation[]> { return []; }
  async getTranslationWithContent(_id: string): Promise<Translation | null> { return null; }
  async getBookContent(_translationId: string, _bookName: string): Promise<{ name: string; chapters: any[]; published?: boolean } | null> { return null; }
  async getChapterContent(_translationId: string, _bookName: string, _chapterNumber: number): Promise<{ number: number; verses: any[] } | null> { return null; }
  async getTranslation(_id: string): Promise<Translation | null> { return null; }
  async saveTranslation(_translation: Translation): Promise<void> {}
  async saveBooks(_translationId: string, _translationName: string, _books: any[]): Promise<void> {}
  async mergeTranslation(_translation: Translation): Promise<Translation> { return _translation; }
  async getProjectionChannel(_channelId: string): Promise<ProjectorRef | null> { return null; }
  async saveProjectionChannel(_channelId: string, _ref: ProjectorRef): Promise<void> {}
  async updateBookPublicationStatus(_translationId: string, _bookName: string, _published: boolean): Promise<void> {}
  subscribeToTranslation(_id: string, _callback: (translation: Translation | null) => void): () => void { return () => {}; }
  subscribeToAllTranslations(_callback: (translations: Translation[]) => void): () => void { return () => {}; }
}