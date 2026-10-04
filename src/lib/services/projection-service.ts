import { CacheManager } from '../cache/cache-manager';
import type { ProjectorRef, Reference } from '../types';
import { useBibleStore } from '../store';

export class ProjectionService {
  private cacheManager: CacheManager;

  constructor() {
    this.cacheManager = new CacheManager();
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

      await this.cacheManager.saveProjectionChannel(channelId, projectorRef);
    } catch (error) {
      console.error('Error sending to projector:', error);
      throw error;
    }
  }

  subscribeToChannel(channelId: string, callback: (ref: ProjectorRef | null) => void): () => void {
    // Use localStorage for projector channel sync
    if (typeof window === 'undefined') return () => {};

    const read = () => {
      try {
        const raw = localStorage.getItem(`rpv:projector:${channelId}`);
        if (raw) {
          const ref = JSON.parse(raw) as ProjectorRef;
          this.cacheManager.saveProjectionChannel(channelId, ref).catch(() => {});
          callback(ref);
        } else {
          callback(null);
        }
      } catch {
        callback(null);
      }
    };

    read();
    const handler = (e: StorageEvent) => {
      if (e.key === `rpv:projector:${channelId}`) {
        read();
      }
    };
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('storage', handler);
    };
  }

  async getChannel(channelId: string): Promise<ProjectorRef | null> {
    try {
      return await this.cacheManager.getProjectionChannel(channelId);
    } catch (error) {
      console.error('Error getting channel:', error);
      throw error;
    }
  }
}

