/**
 * Enhanced IndexedDB Manager for offline data persistence
 * Provides typed, promise-based access to IndexedDB
 */

const DB_NAME = 'maternidade_cache_db';
const DB_VERSION = 2;

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number | null;
  tags: string[];
}

interface StoreConfig {
  name: string;
  keyPath: string;
  indexes: Array<{ name: string; keyPath: string; unique: boolean }>;
}

const STORES: StoreConfig[] = [
  {
    name: 'cache',
    keyPath: 'key',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'expiresAt', keyPath: 'expiresAt', unique: false },
    ],
  },
  {
    name: 'drafts',
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },
];

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB init failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        STORES.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
            });
            storeConfig.indexes.forEach(idx => {
              store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
            });
          }
        });
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    await this.init();
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // ============= Cache Operations =============

  async setCache<T>(
    key: string,
    data: T,
    options: { expiresIn?: number; tags?: string[] } = {}
  ): Promise<void> {
    const store = await this.getStore('cache', 'readwrite');
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: options.expiresIn ? Date.now() + options.expiresIn : null,
      tags: options.tags || [],
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCache<T>(key: string): Promise<T | null> {
    const store = await this.getStore('cache', 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check expiration
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          this.deleteCache(key).catch(console.error);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCache(key: string): Promise<void> {
    const store = await this.getStore('cache', 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<number> {
    const store = await this.getStore('cache', 'readwrite');
    const now = Date.now();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry;
          if (entry.expiresAt && entry.expiresAt < now) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async invalidateByTag(tag: string): Promise<number> {
    const store = await this.getStore('cache', 'readwrite');
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry;
          if (entry.tags.includes(tag)) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============= Draft Operations =============

  async saveDraft(type: string, data: Record<string, unknown>, id?: string): Promise<string> {
    const store = await this.getStore('drafts', 'readwrite');
    const draftId = id || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const existingDraft = id ? await this.getDraft(id) : null;

    const draft = {
      id: draftId,
      type,
      data,
      createdAt: existingDraft?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => resolve(draftId);
      request.onerror = () => reject(request.error);
    });
  }

  async getDraft(id: string): Promise<DraftEntry | null> {
    const store = await this.getStore('drafts', 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getDraftsByType(type: string): Promise<DraftEntry[]> {
    const store = await this.getStore('drafts', 'readonly');
    const index = store.index('type');

    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDraft(id: string): Promise<void> {
    const store = await this.getStore('drafts', 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDrafts(): Promise<DraftEntry[]> {
    const store = await this.getStore('drafts', 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ============= Utility Methods =============

  async getStorageEstimate(): Promise<{ usage: number; quota: number; usagePercent: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        usagePercent: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
      };
    }
    return { usage: 0, quota: 0, usagePercent: 0 };
  }

  async clearAllData(): Promise<void> {
    await this.init();

    const promises = STORES.map(storeConfig => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeConfig.name], 'readwrite');
        const store = transaction.objectStore(storeConfig.name);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }
}

export interface DraftEntry {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export const indexedDBManager = new IndexedDBManager();
