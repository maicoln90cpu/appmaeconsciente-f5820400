/**
 * Enhanced Offline Sync Manager
 * Provides robust offline data synchronization with:
 * - IndexedDB for persistent queue storage
 * - Automatic retry with exponential backoff
 * - Conflict resolution strategies
 * - Real-time sync status updates
 */
import { analytics } from './analytics';
import { logger } from './logger';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type ConflictStrategy = 'client-wins' | 'server-wins' | 'merge' | 'manual';

export interface SyncTask {
  id: string;
  type: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
  retries: number;
  status: SyncStatus;
  errorMessage?: string;
  conflictData?: Record<string, any>;
}

export interface SyncConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  conflictStrategy: ConflictStrategy;
}

const DEFAULT_CONFIG: SyncConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  conflictStrategy: 'client-wins',
};

const DB_NAME = 'maternidade_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

type SyncHandler = (task: SyncTask) => Promise<void>;
type StatusListener = (tasks: SyncTask[]) => void;

class OfflineSyncManager {
  private db: IDBDatabase | null = null;
  private handlers: Map<string, SyncHandler> = new Map();
  private statusListeners: Set<StatusListener> = new Set();
  private processing = false;
  private config: SyncConfig;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initDB();
    this.setupListeners();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
        this.processQueue();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  private setupListeners(): void {
    this.onlineHandler = () => {
      logger.info('🔄 Connection restored, syncing...');
      this.processQueue();
    };

    this.offlineHandler = () => {
      logger.info('📴 Offline mode activated');
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    // Verificação periódica de sync (a cada 30 segundos quando online)
    this.intervalId = setInterval(() => {
      if (navigator.onLine && !this.processing) {
        this.processQueue();
      }
    }, 30000);
  }

  /**
   * Remove todos os listeners e timers. Chamar antes de descartar a instância.
   */
  destroy(): void {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
      this.offlineHandler = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.statusListeners.clear();
  }

  /**
   * Register a handler for a specific task type
   */
  registerHandler(type: string, handler: SyncHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Add a listener for sync status updates
   */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatusChange(): void {
    this.getAllTasks().then(tasks => {
      this.statusListeners.forEach(listener => listener(tasks));
    });
  }

  /**
   * Queue a new sync task
   */
  async queueTask(
    type: string,
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, any>
  ): Promise<string> {
    const task: SyncTask = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      table,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    };

    await this.saveTask(task);

    analytics.track({
      name: 'offline_sync_queued',
      properties: { type, table, operation, taskId: task.id },
    });

    this.notifyStatusChange();

    if (navigator.onLine && !this.processing) {
      this.processQueue();
    }

    return task.id;
  }

  /**
   * Queue multiple operations as a batch
   */
  async queueBatch(
    tasks: Array<{
      type: string;
      table: string;
      operation: 'insert' | 'update' | 'delete';
      data: Record<string, any>;
    }>
  ): Promise<string[]> {
    const ids = await Promise.all(
      tasks.map(t => this.queueTask(t.type, t.table, t.operation, t.data))
    );
    return ids;
  }

  private async saveTask(task: SyncTask): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(task);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getTask(id: string): Promise<SyncTask | undefined> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteTask(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTasks(): Promise<SyncTask[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const tasks = request.result.sort((a: SyncTask, b: SyncTask) => a.timestamp - b.timestamp);
        resolve(tasks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingTasks(): Promise<SyncTask[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter(t => t.status === 'pending' || t.status === 'failed');
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<void> {
    if (this.processing || !navigator.onLine) return;

    this.processing = true;
    const pendingTasks = await this.getPendingTasks();

    for (const task of pendingTasks) {
      try {
        task.status = 'syncing';
        await this.saveTask(task);
        this.notifyStatusChange();

        const handler = this.handlers.get(task.type);
        if (!handler) {
          console.warn(`No handler registered for task type: ${task.type}`);
          task.status = 'failed';
          task.errorMessage = `No handler for type: ${task.type}`;
          await this.saveTask(task);
          continue;
        }

        await handler(task);
        await this.deleteTask(task.id);

        analytics.track({
          name: 'offline_sync_success',
          properties: { type: task.type, taskId: task.id },
        });

        this.notifyStatusChange();
      } catch (error: any) {
        console.error(`Sync failed for task ${task.id}:`, error);

        task.retries++;
        task.errorMessage = error.message || 'Unknown error';

        if (task.retries >= this.config.maxRetries) {
          task.status = 'failed';
          analytics.track({
            name: 'offline_sync_failed',
            properties: {
              type: task.type,
              taskId: task.id,
              error: task.errorMessage,
              retries: task.retries,
            },
          });
        } else {
          task.status = 'pending';
          const delay = Math.min(
            this.config.baseDelayMs * Math.pow(2, task.retries),
            this.config.maxDelayMs
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        await this.saveTask(task);
        this.notifyStatusChange();
      }
    }

    this.processing = false;
  }

  /**
   * Retry a specific failed task
   */
  async retryTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (task && task.status === 'failed') {
      task.status = 'pending';
      task.retries = 0;
      task.errorMessage = undefined;
      await this.saveTask(task);
      this.notifyStatusChange();
      this.processQueue();
    }
  }

  /**
   * Retry all failed tasks
   */
  async retryAllFailed(): Promise<void> {
    const tasks = await this.getAllTasks();
    const failedTasks = tasks.filter(t => t.status === 'failed');

    for (const task of failedTasks) {
      task.status = 'pending';
      task.retries = 0;
      task.errorMessage = undefined;
      await this.saveTask(task);
    }

    this.notifyStatusChange();
    this.processQueue();
  }

  /**
   * Discard a failed task
   */
  async discardTask(taskId: string): Promise<void> {
    await this.deleteTask(taskId);
    this.notifyStatusChange();
  }

  /**
   * Clear all tasks
   */
  async clearQueue(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        this.notifyStatusChange();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get sync statistics
   */
  async getStats(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    total: number;
  }> {
    const tasks = await this.getAllTasks();
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      syncing: tasks.filter(t => t.status === 'syncing').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      total: tasks.length,
    };
  }

  /**
   * Check if we're currently online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }
}

// Singleton com proteção contra duplicação em HMR
function createOfflineSync(): OfflineSyncManager {
  const key = '__offlineSyncManager';
  const existing = (globalThis as any)[key] as OfflineSyncManager | undefined;
  if (existing) {
    existing.destroy();
  }
  const instance = new OfflineSyncManager();
  (globalThis as any)[key] = instance;
  return instance;
}

export const offlineSync = createOfflineSync();
