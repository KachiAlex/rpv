import { CacheManager } from '../cache/cache-manager';
import type { ProjectorRef, Reference } from '../types';
import { useBibleStore } from '../store';
import { getApiUrl } from '../api-config';

const channelKey = (channelId: string) => `rpv:projector:${channelId}`;
const broadcastName = (channelId: string) => `rpv-projector-${channelId}`;

// Cross-device projector channel sync via /api/projector (R2-backed).
// Three transport layers, fastest first:
//   1. BroadcastChannel — instant updates between windows on the same machine
//      (e.g. a desktop control window + a projector window on a second display)
//   2. localStorage 'storage' events — instant cross-tab/window fallback
//   3. /api/projector polling — cross-device sync (phone remote → screen)
export class ProjectionService {
  private cacheManager: CacheManager;
  private pollTimers = new Map<string, ReturnType<typeof setInterval>>();
  private channels = new Map<string, BroadcastChannel>();
  private lastSeen = new Map<string, string>();

  constructor() {
    this.cacheManager = new CacheManager();
  }

  private broadcast(channelId: string, ref: ProjectorRef): void {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      let bc = this.channels.get(channelId);
      if (!bc) {
        bc = new BroadcastChannel(broadcastName(channelId));
        this.channels.set(channelId, bc);
      }
      bc.postMessage(ref);
    } catch {
      /* BroadcastChannel unavailable */
    }
  }

  private publishLocal(channelId: string, ref: ProjectorRef): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(channelKey(channelId), JSON.stringify(ref));
      // StorageEvent doesn't fire in the document that wrote it — dispatch
      // manually so a same-window projector view updates instantly too.
      window.dispatchEvent(new StorageEvent('storage', { key: channelKey(channelId) }));
    } catch {
      /* storage unavailable */
    }
    this.broadcast(channelId, ref);
  }

  // Per-channel PIN — the remote/projector pages persist it here so every
  // write automatically carries it. Reads never need it.
  private channelPin(channelId: string): string {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`rpv:projector:pin:${channelId}`)?.trim() || '';
    } catch {
      return '';
    }
  }

  // Throws on server rejection (PIN required/incorrect, invalid payload);
  // TypeError propagates on network failure — callers keep local-only then.
  private async postChannel(channelId: string, ref: ProjectorRef): Promise<void> {
    const pin = this.channelPin(channelId);
    const res = await fetch(getApiUrl('/api/projector'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: channelId, ref, ...(pin ? { pin } : {}) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `Projector publish failed (${res.status})`);
    }
  }

  async isChannelProtected(channelId: string): Promise<boolean> {
    try {
      const res = await fetch(
        getApiUrl(`/api/projector?channel=${encodeURIComponent(channelId)}`),
        { cache: 'no-store' }
      );
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data?.protected);
    } catch {
      return false;
    }
  }

  async sendToProjector(channelId: string, ref: Reference): Promise<void> {
    const { current, _translationService } = useBibleStore.getState();
    if (!current) throw new Error('No translation loaded');

    let text = ref.text ?? '';
    if (!text) {
      const last = ref.endVerse && ref.endVerse > ref.verse ? ref.endVerse : ref.verse;

      // `current` is usually metadata-only (books with empty chapter stubs),
      // so prefer the repository — it has its own IndexedDB/offline cache.
      const lookup = async (): Promise<string> => {
        const online = await _translationService
          .getBookContent(current.id, ref.book)
          .catch(() => null);
        const source =
          online ?? current.books.find(b => b.name === ref.book) ?? null;
        const chapter = source?.chapters?.find(c => c.number === ref.chapter);
        if (!chapter?.verses?.length) return '';
        return chapter.verses
          .filter(v => v.number >= ref.verse && v.number <= last)
          .sort((a, b) => a.number - b.number)
          .map(v => v.text)
          .join(' ');
      };
      text = await lookup();
      if (!text) throw new Error(`Verse not found: ${ref.book} ${ref.chapter}:${ref.verse}`);
    }

    const projectorRef: ProjectorRef = {
      translation: current.name,
      book: ref.book,
      chapter: ref.chapter,
      verse: ref.verse,
      ...(ref.endVerse && ref.endVerse > ref.verse ? { endVerse: ref.endVerse } : {}),
      text,
      timestamp: new Date(),
    };

    // Local transports first — instant for same-machine projector windows.
    // The API POST then makes it visible to remotes on other devices.
    this.publishLocal(channelId, projectorRef);
    try {
      await this.postChannel(channelId, projectorRef);
    } catch (error) {
      // fetch() throws TypeError on network failure — keep local-only then.
      // A server rejection (e.g. wrong PIN) is a real error the UI must show.
      if (error instanceof TypeError) {
        console.warn('[Projector] API unreachable — update stayed local');
      } else {
        throw error;
      }
    }
    await this.cacheManager.saveProjectionChannel(channelId, projectorRef);
  }

  // Blanks the screen until the next verse is sent (BLACK/CLEAR control).
  async blankProjector(channelId: string): Promise<void> {
    const projectorRef: ProjectorRef = {
      translation: '',
      book: '',
      chapter: 0,
      verse: 0,
      text: '',
      timestamp: new Date(),
      blank: true,
    };
    this.publishLocal(channelId, projectorRef);
    try {
      await this.postChannel(channelId, projectorRef);
    } catch (error) {
      if (error instanceof TypeError) {
        console.warn('[Projector] API unreachable — blank stayed local');
      } else {
        throw error;
      }
    }
    await this.cacheManager.saveProjectionChannel(channelId, projectorRef);
  }

  subscribeToChannel(channelId: string, callback: (ref: ProjectorRef | null) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const apply = (ref: ProjectorRef) => {
      // Normalize: local broadcasts carry a Date instance, API polls carry an
      // ISO string — both must dedupe to the same stamp.
      const stamp = ref.timestamp
        ? ref.timestamp instanceof Date
          ? ref.timestamp.toISOString()
          : String(ref.timestamp)
        : '';
      // Only dedupe on a real timestamp — a stamp-less ref must never be
      // skipped forever just because the previous one also lacked it.
      if (stamp && this.lastSeen.get(channelId) === stamp) return;
      if (stamp) this.lastSeen.set(channelId, stamp);
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

    // Instant same-machine updates (separate Electron windows share this too)
    let listener: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        listener = new BroadcastChannel(broadcastName(channelId));
        listener.onmessage = (e) => {
          if (e.data) apply(e.data as ProjectorRef);
        };
      } catch {
        listener = null;
      }
    }

    // Cross-device updates: poll the API every 2s while the tab is visible,
    // paused while hidden (a hidden projector window doesn't need updates —
    // it re-syncs instantly on focus).
    const poll = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
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
    const onVisible = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    poll();
    const timer = setInterval(poll, 2000);
    this.pollTimers.set(channelId, timer);

    return () => {
      window.removeEventListener('storage', handler);
      document.removeEventListener('visibilitychange', onVisible);
      listener?.close();
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
