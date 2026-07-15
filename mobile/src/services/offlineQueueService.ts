import * as db from './database';
import { v4 as uuidv4 } from 'uuid';

export interface QueuedAction {
  id: string;
  action: string;
  data: any;
  createdAt: number;
  synced: boolean;
}

export type OfflineAction = 'bookmark_add' | 'bookmark_remove' | 'preference_update' | 'note_add';

class OfflineQueueService {
  /**
   * Queue an offline action
   */
  async queueAction(action: OfflineAction, data: any): Promise<string> {
    try {
      const id = uuidv4();
      await db.queueOfflineChange(id, action, data);
      console.log(`Queued action: ${action}`, data);
      return id;
    } catch (error) {
      console.error('Error queuing action:', error);
      throw error;
    }
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<QueuedAction[]> {
    try {
      const results = await db.getOfflineQueue();
      return results.map((item: any) => ({
        id: item.id,
        action: item.action,
        data: JSON.parse(item.data),
        createdAt: item.createdAt,
        synced: item.synced === 1,
      }));
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  /**
   * Get pending actions count
   */
  async getPendingCount(): Promise<number> {
    try {
      const results = await db.getOfflineQueue();
      return results.length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Mark action as synced
   */
  async markAsSynced(id: string): Promise<void> {
    try {
      await db.markQueueItemSynced(id);
      console.log(`Marked action as synced: ${id}`);
    } catch (error) {
      console.error('Error marking action as synced:', error);
      throw error;
    }
  }

  /**
   * Queue bookmark addition
   */
  async queueBookmarkAdd(verseId: string, userId: string): Promise<string> {
    return this.queueAction('bookmark_add', {
      verseId,
      userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Queue bookmark removal
   */
  async queueBookmarkRemove(bookmarkId: string, userId: string): Promise<string> {
    return this.queueAction('bookmark_remove', {
      bookmarkId,
      userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Queue preference update
   */
  async queuePreferenceUpdate(key: string, value: string): Promise<string> {
    return this.queueAction('preference_update', {
      key,
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Queue note addition
   */
  async queueNoteAdd(verseId: string, userId: string, noteText: string): Promise<string> {
    return this.queueAction('note_add', {
      verseId,
      userId,
      noteText,
      timestamp: Date.now(),
    });
  }

  /**
   * Process queue with sync handler
   */
  async processQueue(
    syncHandler: (action: QueuedAction) => Promise<boolean>
  ): Promise<{ successful: number; failed: number }> {
    try {
      const pendingActions = await this.getPendingActions();
      let successful = 0;
      let failed = 0;

      for (const action of pendingActions) {
        try {
          const synced = await syncHandler(action);
          if (synced) {
            await this.markAsSynced(action.id);
            successful++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error processing action ${action.id}:`, error);
          failed++;
        }
      }

      console.log(`Queue processing complete: ${successful} successful, ${failed} failed`);
      return { successful, failed };
    } catch (error) {
      console.error('Error processing queue:', error);
      return { successful: 0, failed: 0 };
    }
  }

  /**
   * Clear all queued actions
   */
  async clearQueue(): Promise<void> {
    try {
      await db.runAsync(`DELETE FROM offline_queue`);
      console.log('Offline queue cleared');
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM offline_queue WHERE synced = 0'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting queue size:', error);
      return 0;
    }
  }
}

export default new OfflineQueueService();
