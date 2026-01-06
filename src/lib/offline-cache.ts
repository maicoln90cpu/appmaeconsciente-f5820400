/**
 * Offline Data Cache Manager
 * Provides IndexedDB caching for offline access to baby data
 */

const CACHE_DB_NAME = "maternidade_cache_db";
const CACHE_DB_VERSION = 1;

export interface CacheConfig {
  maxAge: number; // in milliseconds
  tableName: string;
}

interface CachedData<T> {
  data: T[];
  timestamp: number;
  userId: string;
}

const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

class OfflineCacheManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open cache IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores for different data types
        const stores = [
          "baby_feeding_logs",
          "baby_sleep_logs",
          "baby_colic_logs",
          "baby_appointments",
          "baby_medications",
          "baby_routines",
          "baby_achievements",
          "baby_first_times",
          "baby_timeline_events",
          "baby_vaccination_profiles",
          "baby_vaccinations",
          "growth_measurements",
          "baby_milestone_records",
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: "cacheKey" });
            store.createIndex("userId", "userId", { unique: false });
            store.createIndex("timestamp", "timestamp", { unique: false });
          }
        });
      };
    });

    return this.initPromise;
  }

  /**
   * Cache data for a specific table
   */
  async cacheData<T>(
    tableName: string,
    userId: string,
    data: T[]
  ): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      try {
        const transaction = this.db.transaction([tableName], "readwrite");
        const store = transaction.objectStore(tableName);

        const cacheEntry: CachedData<T> & { cacheKey: string } = {
          cacheKey: userId,
          data,
          timestamp: Date.now(),
          userId,
        };

        const request = store.put(cacheEntry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        // Store might not exist, fail gracefully
        console.warn(`Cache store ${tableName} not available:`, error);
        resolve();
      }
    });
  }

  /**
   * Get cached data for a specific table
   */
  async getCachedData<T>(
    tableName: string,
    userId: string,
    maxAge: number = DEFAULT_MAX_AGE
  ): Promise<T[] | null> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      try {
        const transaction = this.db.transaction([tableName], "readonly");
        const store = transaction.objectStore(tableName);
        const request = store.get(userId);

        request.onsuccess = () => {
          const result = request.result as CachedData<T> & { cacheKey: string } | undefined;
          
          if (!result) {
            resolve(null);
            return;
          }

          // Check if cache is still valid
          const age = Date.now() - result.timestamp;
          if (age > maxAge) {
            resolve(null);
            return;
          }

          resolve(result.data);
        };
        request.onerror = () => resolve(null);
      } catch (error) {
        console.warn(`Failed to get cache for ${tableName}:`, error);
        resolve(null);
      }
    });
  }

  /**
   * Clear cache for a specific table and user
   */
  async clearCache(tableName: string, userId: string): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([tableName], "readwrite");
        const store = transaction.objectStore(tableName);
        const request = store.delete(userId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        console.warn(`Failed to clear cache for ${tableName}:`, error);
        resolve();
      }
    });
  }

  /**
   * Clear all caches for a user
   */
  async clearAllCaches(userId: string): Promise<void> {
    await this.initDB();

    if (!this.db) return;

    const storeNames = Array.from(this.db.objectStoreNames);
    
    for (const storeName of storeNames) {
      await this.clearCache(storeName, userId);
    }
  }

  /**
   * Get cache age for debugging
   */
  async getCacheAge(tableName: string, userId: string): Promise<number | null> {
    await this.initDB();

    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      try {
        const transaction = this.db.transaction([tableName], "readonly");
        const store = transaction.objectStore(tableName);
        const request = store.get(userId);

        request.onsuccess = () => {
          const result = request.result as CachedData<unknown> | undefined;
          if (!result) {
            resolve(null);
            return;
          }
          resolve(Date.now() - result.timestamp);
        };
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
}

export const offlineCache = new OfflineCacheManager();
