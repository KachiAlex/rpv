import { FirestoreRepository } from '../repositories/firestore-repository';
import type { ProjectorRef, Reference } from '../types';
import { useBibleStore } from '../store';

export class ProjectionService {
  private repository: FirestoreRepository;

  constructor() {
    this.repository = new FirestoreRepository();
  }

  async sendToProjector(channelId: string, ref: Reference): Promise<void> {
    try {
      const { current } = useBibleStore.getState();
      if (!current) return;

      const book = current.books.find(b => b.name === ref.book);
      const chapter = book?.chapters.find(c => c.number === ref.chapter);
      const verse = chapter?.verses.find(v => v.number === ref.verse);

      const projectorRef: ProjectorRef = {
        translation: current.name,
        book: ref.book,
        chapter: ref.chapter,
        verse: ref.verse,
        text: verse?.text || '',
        timestamp: new Date(),
      };

      await this.repository.saveProjectionChannel(channelId, projectorRef);
    } catch (error) {
      console.error('Error sending to projector:', error);
      throw error;
    }
  }

  subscribeToChannel(channelId: string, callback: (ref: ProjectorRef | null) => void): () => void {
    return this.repository.subscribeToProjectionChannel(channelId, callback);
  }

  async getChannel(channelId: string): Promise<ProjectorRef | null> {
    try {
      return await this.repository.getProjectionChannel(channelId);
    } catch (error) {
      console.error('Error getting channel:', error);
      throw error;
    }
  }
}

