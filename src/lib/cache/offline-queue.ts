import type { Translation } from '../types';

export interface PendingOperation {
  id: string;
  type: 'saveTranslation' | 'mergeTranslation' | 'addOrUpdateVerse' | 'sendToProjector';
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'rpv-offline-queue';
const MAX_RETRIES = 3;

export class OfflineQueue {
  async getPendingOperations(): Promise<PendingOperation[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (!stored) return [];
      
      const operations: PendingOperation[] = JSON.parse(stored);
      return operations.filter(op => op.retries < MAX_RETRIES);
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  async addOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const operations = await this.getPendingOperations();
      const newOperation: PendingOperation = {
        ...operation,
        id: `${operation.type}-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        retries: 0,
      };
      
      operations.push(newOperation);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  async removeOperation(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const operations = await this.getPendingOperations();
      const filtered = operations.filter(op => op.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from offline queue:', error);
    }
  }

  async incrementRetry(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const operations = await this.getPendingOperations();
      const updated = operations.map(op => 
        op.id === id ? { ...op, retries: op.retries + 1 } : op
      );
      localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error incrementing retry:', error);
    }
  }

  async clearQueue(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }

  async processQueue(
    handlers: {
      saveTranslation?: (data: Translation) => Promise<void>;
      mergeTranslation?: (data: Translation) => Promise<void>;
      addOrUpdateVerse?: (data: any) => Promise<void>;
      sendToProjector?: (data: any) => Promise<void>;
    }
  ): Promise<void> {
    const operations = await this.getPendingOperations();
    
    for (const operation of operations) {
      try {
        const handler = handlers[operation.type];
        if (!handler) {
          await this.removeOperation(operation.id);
          continue;
        }

        await handler(operation.data);
        await this.removeOperation(operation.id);
      } catch (error) {
        console.error(`Error processing ${operation.type}:`, error);
        await this.incrementRetry(operation.id);
      }
    }
  }
}

