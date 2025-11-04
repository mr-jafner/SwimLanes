/**
 * Unit tests for persistence service
 *
 * Tests IndexedDB operations with a mocked IndexedDB implementation.
 * These tests verify save, load, delete, and clear operations work correctly.
 *
 * @module services/__tests__/persistence.service.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToIndexedDB,
  loadFromIndexedDB,
  deleteFromIndexedDB,
  clearIndexedDB,
  getStorageQuota,
  PersistenceError,
} from '../persistence.service';

/**
 * Mock IndexedDB implementation for testing.
 *
 * This creates a simple in-memory store that mimics IndexedDB behavior
 * without requiring a real browser IndexedDB implementation.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
function setupMockIndexedDB() {
  const databases = new Map<string, Map<string, Map<string, unknown>>>();

  const mockIndexedDB = {
    open: vi.fn((dbName: string, version: number) => {
      const request = {
        result: null as unknown,
        error: null as unknown,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onupgradeneeded: null as (() => void) | null,
        onblocked: null as (() => void) | null,
      };

      setTimeout(() => {
        // Get or create database
        if (!databases.has(dbName)) {
          databases.set(dbName, new Map());
          // Fire upgrade needed for new databases
          if (request.onupgradeneeded) {
            request.result = {
              name: dbName,
              objectStoreNames: {
                contains: (storeName: string) => databases.get(dbName)?.has(storeName) ?? false,
              },
              createObjectStore: (storeName: string) => {
                databases.get(dbName)?.set(storeName, new Map());
              },
              close: vi.fn(),
              transaction: (storeNames: string[], mode: string) => {
                const storeName = storeNames[0];
                const store = databases.get(dbName)?.get(storeName) ?? new Map();

                return {
                  objectStore: () => ({
                    put: (value: unknown, key: string) => {
                      const putReq = {
                        result: undefined,
                        error: null as unknown,
                        onsuccess: null as (() => void) | null,
                        onerror: null as (() => void) | null,
                      };
                      setTimeout(() => {
                        store.set(key, value);
                        putReq.onsuccess?.();
                      }, 0);
                      return putReq;
                    },
                    get: (key: string) => {
                      const getReq = {
                        result: store.get(key),
                        error: null as unknown,
                        onsuccess: null as (() => void) | null,
                        onerror: null as (() => void) | null,
                      };
                      setTimeout(() => getReq.onsuccess?.(), 0);
                      return getReq;
                    },
                    delete: (key: string) => {
                      const delReq = {
                        result: undefined,
                        error: null as unknown,
                        onsuccess: null as (() => void) | null,
                        onerror: null as (() => void) | null,
                      };
                      setTimeout(() => {
                        store.delete(key);
                        delReq.onsuccess?.();
                      }, 0);
                      return delReq;
                    },
                  }),
                  error: null,
                  onerror: null as (() => void) | null,
                };
              },
            };
            request.onupgradeneeded();
          }
        }

        // Return existing database
        request.result = {
          name: dbName,
          objectStoreNames: {
            contains: (storeName: string) => databases.get(dbName)?.has(storeName) ?? false,
          },
          createObjectStore: (storeName: string) => {
            databases.get(dbName)?.set(storeName, new Map());
          },
          close: vi.fn(),
          transaction: (storeNames: string[], mode: string) => {
            const storeName = storeNames[0];
            const store = databases.get(dbName)?.get(storeName);

            if (!store) {
              throw new Error(`Object store '${storeName}' not found`);
            }

            return {
              objectStore: () => ({
                put: (value: unknown, key: string) => {
                  const putReq = {
                    result: undefined,
                    error: null as unknown,
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                  };
                  setTimeout(() => {
                    store.set(key, value);
                    putReq.onsuccess?.();
                  }, 0);
                  return putReq;
                },
                get: (key: string) => {
                  const getReq = {
                    result: store.get(key),
                    error: null as unknown,
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                  };
                  setTimeout(() => getReq.onsuccess?.(), 0);
                  return getReq;
                },
                delete: (key: string) => {
                  const delReq = {
                    result: undefined,
                    error: null as unknown,
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                  };
                  setTimeout(() => {
                    store.delete(key);
                    delReq.onsuccess?.();
                  }, 0);
                  return delReq;
                },
              }),
              error: null,
              onerror: null as (() => void) | null,
            };
          },
        };

        request.onsuccess?.();
      }, 0);

      return request;
    }),

    deleteDatabase: vi.fn((dbName: string) => {
      const request = {
        result: undefined,
        error: null as unknown,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onblocked: null as (() => void) | null,
      };

      setTimeout(() => {
        databases.delete(dbName);
        request.onsuccess?.();
      }, 0);

      return request;
    }),
  };

  // @ts-expect-error - Mocking global indexedDB
  globalThis.indexedDB = mockIndexedDB;

  return { databases, mockIndexedDB };
}

describe('Persistence Service', () => {
  beforeEach(() => {
    setupMockIndexedDB();
  });

  describe('saveToIndexedDB', () => {
    it('should save data to IndexedDB', async () => {
      const testData = { foo: 'bar', num: 42 };

      await saveToIndexedDB('test-db', 'test-store', 'test-key', testData);

      // Verify by loading it back
      const loaded = await loadFromIndexedDB('test-db', 'test-store', 'test-key');
      expect(loaded).toEqual(testData);
    });

    it('should save binary data (Uint8Array)', async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      await saveToIndexedDB('test-db', 'test-store', 'binary-key', testData);

      const loaded = await loadFromIndexedDB<Uint8Array>('test-db', 'test-store', 'binary-key');
      expect(loaded).toEqual(testData);
    });

    it('should overwrite existing data with same key', async () => {
      await saveToIndexedDB('test-db', 'test-store', 'key1', 'original');
      await saveToIndexedDB('test-db', 'test-store', 'key1', 'updated');

      const loaded = await loadFromIndexedDB('test-db', 'test-store', 'key1');
      expect(loaded).toBe('updated');
    });

    it('should create database and store if they do not exist', async () => {
      await expect(saveToIndexedDB('new-db', 'new-store', 'key1', 'value1')).resolves.not.toThrow();

      const loaded = await loadFromIndexedDB('new-db', 'new-store', 'key1');
      expect(loaded).toBe('value1');
    });
  });

  describe('loadFromIndexedDB', () => {
    it('should load existing data', async () => {
      const testData = { test: 'data' };
      await saveToIndexedDB('test-db', 'test-store', 'my-key', testData);

      const loaded = await loadFromIndexedDB('test-db', 'test-store', 'my-key');
      expect(loaded).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      await saveToIndexedDB('test-db', 'test-store', 'key1', 'exists');

      const loaded = await loadFromIndexedDB('test-db', 'test-store', 'non-existent-key');
      expect(loaded).toBeNull();
    });

    it('should return null for non-existent database', async () => {
      const loaded = await loadFromIndexedDB('non-existent-db', 'test-store', 'key1');
      expect(loaded).toBeNull();
    });

    it('should return null for non-existent store', async () => {
      await saveToIndexedDB('test-db', 'store1', 'key1', 'data');

      const loaded = await loadFromIndexedDB('test-db', 'non-existent-store', 'key1');
      expect(loaded).toBeNull();
    });

    it('should handle TypeScript generic type correctly', async () => {
      interface TestData {
        id: number;
        name: string;
      }

      const testData: TestData = { id: 1, name: 'Test' };
      await saveToIndexedDB('test-db', 'test-store', 'typed-key', testData);

      const loaded = await loadFromIndexedDB<TestData>('test-db', 'test-store', 'typed-key');
      expect(loaded).toEqual(testData);
      expect(loaded?.id).toBe(1);
      expect(loaded?.name).toBe('Test');
    });
  });

  describe('deleteFromIndexedDB', () => {
    it('should delete existing data', async () => {
      await saveToIndexedDB('test-db', 'test-store', 'key-to-delete', 'data');

      // Verify it exists
      let loaded = await loadFromIndexedDB('test-db', 'test-store', 'key-to-delete');
      expect(loaded).toBe('data');

      // Delete it
      await deleteFromIndexedDB('test-db', 'test-store', 'key-to-delete');

      // Verify it's gone
      loaded = await loadFromIndexedDB('test-db', 'test-store', 'key-to-delete');
      expect(loaded).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(
        deleteFromIndexedDB('test-db', 'test-store', 'non-existent')
      ).resolves.not.toThrow();
    });

    it('should only delete specified key, not others', async () => {
      await saveToIndexedDB('test-db', 'test-store', 'key1', 'data1');
      await saveToIndexedDB('test-db', 'test-store', 'key2', 'data2');

      await deleteFromIndexedDB('test-db', 'test-store', 'key1');

      const loaded1 = await loadFromIndexedDB('test-db', 'test-store', 'key1');
      const loaded2 = await loadFromIndexedDB('test-db', 'test-store', 'key2');

      expect(loaded1).toBeNull();
      expect(loaded2).toBe('data2');
    });
  });

  describe('clearIndexedDB', () => {
    it('should delete entire database', async () => {
      // Create some data
      await saveToIndexedDB('test-db', 'store1', 'key1', 'data1');
      await saveToIndexedDB('test-db', 'store1', 'key2', 'data2');

      // Clear the database
      await clearIndexedDB('test-db');

      // Verify data is gone
      const loaded1 = await loadFromIndexedDB('test-db', 'store1', 'key1');
      const loaded2 = await loadFromIndexedDB('test-db', 'store1', 'key2');

      expect(loaded1).toBeNull();
      expect(loaded2).toBeNull();
    });

    it('should not throw when clearing non-existent database', async () => {
      await expect(clearIndexedDB('non-existent-db')).resolves.not.toThrow();
    });

    it('should not affect other databases', async () => {
      await saveToIndexedDB('db1', 'store1', 'key1', 'data1');
      await saveToIndexedDB('db2', 'store1', 'key1', 'data2');

      await clearIndexedDB('db1');

      const loaded1 = await loadFromIndexedDB('db1', 'store1', 'key1');
      const loaded2 = await loadFromIndexedDB('db2', 'store1', 'key1');

      expect(loaded1).toBeNull();
      expect(loaded2).toBe('data2');
    });
  });

  describe('PersistenceError', () => {
    it('should wrap errors with context', () => {
      const originalError = new Error('Original error');
      const persistenceError = new PersistenceError('Failed to save', originalError);

      expect(persistenceError).toBeInstanceOf(Error);
      expect(persistenceError).toBeInstanceOf(PersistenceError);
      expect(persistenceError.message).toBe('Failed to save');
      expect(persistenceError.cause).toBe(originalError);
      expect(persistenceError.name).toBe('PersistenceError');
    });

    it('should detect QuotaExceededError by name', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      const persistenceError = new PersistenceError('Failed to save', quotaError);

      expect(persistenceError.isQuotaExceeded).toBe(true);
    });

    it('should detect QuotaExceededError by code', () => {
      const quotaError = new DOMException('Quota exceeded');
      // Manually set code to 22 (QuotaExceededError code)
      Object.defineProperty(quotaError, 'code', { value: 22 });

      const persistenceError = new PersistenceError('Failed to save', quotaError);

      expect(persistenceError.isQuotaExceeded).toBe(true);
    });

    it('should not flag non-quota errors as quota exceeded', () => {
      const normalError = new Error('Normal error');
      const persistenceError = new PersistenceError('Failed to save', normalError);

      expect(persistenceError.isQuotaExceeded).toBe(false);
    });
  });

  describe('getStorageQuota', () => {
    it('should return quota information when supported', async () => {
      // Mock navigator.storage.estimate
      const mockEstimate = vi.fn().mockResolvedValue({
        quota: 1000000,
        usage: 500000,
      });

      Object.defineProperty(globalThis.navigator, 'storage', {
        value: { estimate: mockEstimate },
        writable: true,
        configurable: true,
      });

      const quota = await getStorageQuota();

      expect(quota).toEqual({
        quota: 1000000,
        usage: 500000,
      });
      expect(mockEstimate).toHaveBeenCalled();
    });

    it('should return null when storage API not supported', async () => {
      // Remove navigator.storage
      Object.defineProperty(globalThis.navigator, 'storage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const quota = await getStorageQuota();

      expect(quota).toBeNull();
    });

    it('should handle missing quota/usage values', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({});

      Object.defineProperty(globalThis.navigator, 'storage', {
        value: { estimate: mockEstimate },
        writable: true,
        configurable: true,
      });

      const quota = await getStorageQuota();

      expect(quota).toEqual({
        quota: 0,
        usage: 0,
      });
    });
  });
});
