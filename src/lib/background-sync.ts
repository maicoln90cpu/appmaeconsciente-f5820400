// Background Sync utility for offline form submissions
import { analytics } from './analytics';
import { logger } from './logger';

interface SyncTask {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

const SYNC_QUEUE_KEY = 'background_sync_queue';
const MAX_RETRIES = 3;

class BackgroundSyncManager {
  private queue: SyncTask[] = [];
  private processing = false;
  private onlineHandler: (() => void) | null = null;

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private setupOnlineListener() {
    this.onlineHandler = () => {
      logger.info('Connection restored, processing sync queue...');
      this.processQueue();
    };
    window.addEventListener('online', this.onlineHandler);
  }

  /**
   * Remove todos os listeners e para o processamento.
   * Deve ser chamado antes de descartar a instância.
   */
  destroy() {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
  }

  async addTask(type: string, data: any): Promise<string> {
    const task: SyncTask = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(task);
    this.saveQueue();

    analytics.track({
      name: 'background_sync_queued',
      properties: { type, taskId: task.id },
    });

    // Tentar process immediately if online
    if (navigator.onLine && !this.processing) {
      this.processQueue();
    }

    return task.id;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const task = this.queue[0];

      try {
        await this.executeTask(task);
        this.queue.shift(); // Remover successful task
        analytics.track({
          name: 'background_sync_success',
          properties: { type: task.type, taskId: task.id },
        });
      } catch (error) {
        console.error('Failed to execute sync task:', error);
        task.retries++;

        if (task.retries >= MAX_RETRIES) {
          console.error('Max retries reached for task:', task);
          this.queue.shift(); // Remover failed task
          analytics.track({
            name: 'background_sync_failed',
            properties: { type: task.type, taskId: task.id, error: String(error) },
          });
        } else {
          // Move to end of queue for retry
          this.queue.push(this.queue.shift()!);
        }
        break; // Parar processing on error
      }
    }

    this.saveQueue();
    this.processing = false;
  }

  private async executeTask(task: SyncTask): Promise<void> {
    const event = new CustomEvent('background-sync-execute', {
      detail: task,
    });
    window.dispatchEvent(event);

    // Aguardar a bit for the handler to process
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

// Singleton com proteção contra duplicação em HMR
function createBackgroundSync(): BackgroundSyncManager {
  const key = '__backgroundSyncManager';
  const existing = (globalThis as any)[key] as BackgroundSyncManager | undefined;
  if (existing) {
    existing.destroy();
  }
  const instance = new BackgroundSyncManager();
  (globalThis as any)[key] = instance;
  return instance;
}

export const backgroundSync = createBackgroundSync();
