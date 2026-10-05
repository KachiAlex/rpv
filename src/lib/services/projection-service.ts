import { CacheManager } from '../cache/cache-manager';
import type { ProjectorRef, Reference } from '../types';
import { useBibleStore } from '../store';
import { getApiUrl } from '../api-config';

const channelKey = (channelId: string) => `rpv:projector:${channelId}`;

// Cross-device projector channel sync via /api/projector (R2-backed).
// localStorage remains as a same-device instant-update path and offline
// fallback, so existing projector/remote pages keep working unchanged.
export class ProjectionService {
  private cacheManager: CacheManager;
  private pollTimers = new Map<string, ReturnType<typeof setInterval>>();
  private lastSeen = new Map<string, string>();

  constructor() {
    this.cacheManager = new CacheManager();
  }

  private async postChannel(channelId: string, ref: ProjectorRef): Promise<boolean> {
    try {
      const res = await fetch(getApiUrl('/api/projector'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channelId, ref }),
      });
      return res.ok;
    } catch {
      return false;
    }
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

      const posted = await this.postChannel(channelId, projectorRef);
      if (!posted && typeof window !== 'undefined') {
        // Offline/same-device fallback
        localStorage.setItem(channelKey(channelId), JSON.stringify(projectorRef));
        window.dispatchEvent(new StorageEvent('storage', { key: channelKey(channelId) }));
      }
      await this.cacheManager.saveProjectionChannel(channelId, projectorRef);
    } catch (error) {
      console.error('Error sending to projector:', error);
      throw error;
    }
  }

  subscribeToChannel(channelId: string, callback: (ref: ProjectorRef | null) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const apply = (ref: ProjectorRef) => {
      const stamp = String(ref.timestamp ?? '');
      if (this.lastSeen.get(channelId) === stamp) return;
      this.lastSeen.set(channelId, stamp);
      this.cacheManager.saveProjectionChannel(channelId, ref).catch(() => {});
      callback(ref);
    };

    // Same-device instant updates (legacy behavior)
    const readLocal = () => {
      try {
        const raw = localStorage.getItem(channelKey(channelId));
        if (raw) apply(JSON.parse(raw) as ProjectorRef);
      } catch {
        /* ignore */
      }
    };
    readLocal();
    const handler = (e: StorageEvent) => {
      if (e.key === channelKey(channelId)) readLocal();
    };
    window.addEventListener('storage', handler);

    // Cross-device updates: poll the API every 2s
    const poll = async () => {
      try {
        const res = await fetch(
          getApiUrl(`/api/projector?channel=${encodeURIComponent(channelId)}`),
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.ref) apply(data.ref as ProjectorRef);
      } catch {
        /* offline — keep polling */
      }
    };
    poll();
    const timer = setInterval(poll, 2000);
    this.pollTimers.set(channelId, timer);

    return () => {
      window.removeEventListener('storage', handler);
      clearInterval(timer);
      this.pollTimers.delete(channelId);
    };
  }

  async getChannel(channelId: string): Promise<ProjectorRef | null> {
    try {
      const res = await fetch(
        getApiUrl(`/api/projector?channel=${encodeURIComponent(channelId)}`),
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.ref) return data.ref as ProjectorRef;
      }
    } catch {
      // fall through to local cache
    }
    try {
      return await this.cacheManager.getProjectionChannel(channelId);
    } catch (error) {
      console.error('Error getting channel:', error);
      throw error;
    }
  }
}
