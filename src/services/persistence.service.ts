/**
 * IndexedDB persistence service for SwimLanes
 *
 * Provides low-level IndexedDB operations for persisting application data
 * in the browser. This service is generic and can be used for any data that
 * needs browser-based persistence (database, user settings, preferences, etc.).
 *
 * Architecture:
 * - Standalone service with no dependencies
 * - Promise-based async API
 * - Comprehensive error handling including quota exceeded
 * - TypeScript typed for safety
 *
 * Usage:
 * ```typescript
 * // Save data
 * await saveToIndexedDB('mydb', 'mystore', 'mykey', data);
 *
 * // Load data
 * const data = await loadFromIndexedDB('mydb', 'mystore', 'mykey');
 *
 * // Clear entire database
 * await clearIndexedDB('mydb');
 * ```
 *
 * @module services/persistence.service
 */

/**
 * Custom error class for persistence-related errors.
 *
 * Wraps underlying IndexedDB errors with additional context.
 */
export class PersistenceError extends Error {
  public readonly cause?: unknown;
  public readonly isQuotaExceeded: boolean;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PersistenceError';
    this.cause = cause;

    // Detect quota exceeded errors
    this.isQuotaExceeded =
      cause instanceof DOMException && (cause.name === 'QuotaExceededError' || cause.code === 22);
  }
}

/**
 * Opens an IndexedDB database and ensures the object store exists.
 *
 * @param dbName - Name of the IndexedDB database
 * @param storeName - Name of the object store
 * @returns Promise resolving to IDBDatabase
 * @throws {PersistenceError} If database cannot be opened
 */
function openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => {
      reject(new PersistenceError(`Failed to open IndexedDB database '${dbName}'`, request.error));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}

/**
 * Save data to IndexedDB.
 *
 * Creates or updates a key-value pair in the specified database and object store.
 * The data should be serializable (JSON-compatible or binary data like Uint8Array).
 *
 * @param dbName - Name of the IndexedDB database
 * @param storeName - Name of the object store
 * @param key - Key to store the data under
 * @param data - Data to store (must be serializable)
 * @throws {PersistenceError} If save operation fails
 * @throws {PersistenceError} with isQuotaExceeded=true if storage quota exceeded
 *
 * @example
 * ```typescript
 * const dbData = new Uint8Array([1, 2, 3]);
 * await saveToIndexedDB('swimlanes-db', 'database', 'main-db', dbData);
 * ```
 */
export async function saveToIndexedDB(
  dbName: string,
  storeName: string,
  key: string,
  data: unknown
): Promise<void> {
  try {
    const db = await openDatabase(dbName, storeName);

    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const putRequest = store.put(data, key);

      putRequest.onerror = () => {
        reject(
          new PersistenceError(
            `Failed to save to IndexedDB (db: ${dbName}, store: ${storeName}, key: ${key})`,
            putRequest.error
          )
        );
      };

      putRequest.onsuccess = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(new PersistenceError('Transaction failed during save', transaction.error));
      };
    });
  } catch (error) {
    // Re-throw PersistenceError as-is, wrap other errors
    if (error instanceof PersistenceError) {
      throw error;
    }
    throw new PersistenceError('Failed to save to IndexedDB', error);
  }
}

/**
 * Load data from IndexedDB.
 *
 * Retrieves data stored under the specified key. Returns null if the key
 * doesn't exist or the database/store doesn't exist.
 *
 * @param dbName - Name of the IndexedDB database
 * @param storeName - Name of the object store
 * @param key - Key to retrieve data from
 * @returns Promise resolving to the stored data, or null if not found
 * @throws {PersistenceError} If load operation fails (but not if key simply doesn't exist)
 *
 * @example
 * ```typescript
 * const dbData = await loadFromIndexedDB('swimlanes-db', 'database', 'main-db');
 * if (dbData) {
 *   console.log('Found existing database');
 * }
 * ```
 */
export async function loadFromIndexedDB<T = unknown>(
  dbName: string,
  storeName: string,
  key: string
): Promise<T | null> {
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => {
        reject(
          new PersistenceError(`Failed to open IndexedDB database '${dbName}'`, request.error)
        );
      };

      request.onsuccess = () => {
        const db = request.result;

        // Database doesn't have the store yet - return null
        if (!db.objectStoreNames.contains(storeName)) {
          if (typeof db.close === 'function') {
            db.close();
          }
          resolve(null);
          return;
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(key);

        getRequest.onerror = () => {
          if (typeof db.close === 'function') {
            db.close();
          }
          reject(
            new PersistenceError(
              `Failed to load from IndexedDB (db: ${dbName}, store: ${storeName}, key: ${key})`,
              getRequest.error
            )
          );
        };

        getRequest.onsuccess = () => {
          if (typeof db.close === 'function') {
            if (typeof db.close === 'function') {
              db.close();
            }
          }
          const result = getRequest.result as T | undefined;
          resolve(result !== undefined ? result : null);
        };
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw error;
    }
    throw new PersistenceError('Failed to load from IndexedDB', error);
  }
}

/**
 * Delete a specific key from IndexedDB.
 *
 * Removes the data stored under the specified key. Does nothing if the
 * key doesn't exist.
 *
 * @param dbName - Name of the IndexedDB database
 * @param storeName - Name of the object store
 * @param key - Key to delete
 * @throws {PersistenceError} If delete operation fails
 *
 * @example
 * ```typescript
 * await deleteFromIndexedDB('swimlanes-db', 'database', 'old-backup');
 * ```
 */
export async function deleteFromIndexedDB(
  dbName: string,
  storeName: string,
  key: string
): Promise<void> {
  try {
    const db = await openDatabase(dbName, storeName);

    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(key);

      deleteRequest.onerror = () => {
        db.close();
        reject(
          new PersistenceError(
            `Failed to delete from IndexedDB (db: ${dbName}, store: ${storeName}, key: ${key})`,
            deleteRequest.error
          )
        );
      };

      deleteRequest.onsuccess = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(new PersistenceError('Transaction failed during delete', transaction.error));
      };
    });
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw error;
    }
    throw new PersistenceError('Failed to delete from IndexedDB', error);
  }
}

/**
 * Clear an entire IndexedDB database.
 *
 * Deletes all data in the specified database by deleting the database itself.
 * This is useful for "reset app data" functionality or clearing caches.
 *
 * @param dbName - Name of the IndexedDB database to delete
 * @throws {PersistenceError} If clear operation fails
 *
 * @example
 * ```typescript
 * // Clear all persisted data
 * await clearIndexedDB('swimlanes-db');
 * console.log('All data cleared');
 * ```
 */
export async function clearIndexedDB(dbName: string): Promise<void> {
  try {
    return await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);

      request.onerror = () => {
        reject(
          new PersistenceError(`Failed to delete IndexedDB database '${dbName}'`, request.error)
        );
      };

      request.onsuccess = () => {
        resolve();
      };

      // Some browsers fire onblocked when database is open elsewhere
      request.onblocked = () => {
        reject(
          new PersistenceError(
            `Cannot delete IndexedDB database '${dbName}' - it is currently open in another tab or window`
          )
        );
      };
    });
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw error;
    }
    throw new PersistenceError('Failed to clear IndexedDB', error);
  }
}

/**
 * Get the estimated storage quota and usage.
 *
 * Returns information about how much storage is available and how much
 * is currently being used. Useful for displaying storage warnings to users.
 *
 * @returns Promise resolving to storage quota and usage in bytes, or null if not supported
 *
 * @example
 * ```typescript
 * const quota = await getStorageQuota();
 * if (quota) {
 *   const percentUsed = (quota.usage / quota.quota) * 100;
 *   console.log(`Using ${percentUsed}% of available storage`);
 * }
 * ```
 */
export async function getStorageQuota(): Promise<{ quota: number; usage: number } | null> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota ?? 0,
      usage: estimate.usage ?? 0,
    };
  } catch (error) {
    console.warn('Failed to get storage quota estimate:', error);
    return null;
  }
}
