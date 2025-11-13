import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storage } from '@/lib/storage';

// Mock IndexedDB
const mockDB = {
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      get: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        result: null,
      })),
      put: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
      })),
      delete: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
      })),
      getAll: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        result: [],
      })),
      clear: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
      })),
    })),
  })),
  close: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock IndexedDB
    global.indexedDB = {
      open: vi.fn(() => {
        const request = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          result: mockDB,
          error: null,
        };
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({ target: request } as unknown as IDBOpenDBRequestEvent);
          }
        }, 0);
        return request as unknown as IDBOpenDBRequest;
      }),
    } as unknown as typeof indexedDB;
  });

  afterEach(async () => {
    await storage.clear();
  });

  it('initializes database', async () => {
    await storage.initDB();
    expect(storage).toBeDefined();
  });

  it('stores and retrieves values', async () => {
    await storage.initDB();
    
    await storage.set('test-key', { value: 'test-data' });
    const result = await storage.get('test-key');
    
    expect(result).toEqual({ value: 'test-data' });
  });

  it('removes values', async () => {
    await storage.initDB();
    
    await storage.set('test-key', 'test-data');
    await storage.remove('test-key');
    const result = await storage.get('test-key');
    
    expect(result).toBeUndefined();
  });

  it('clears all values', async () => {
    await storage.initDB();
    
    await storage.set('key1', 'value1');
    await storage.set('key2', 'value2');
    await storage.clear();
    
    const result1 = await storage.get('key1');
    const result2 = await storage.get('key2');
    
    expect(result1).toBeUndefined();
    expect(result2).toBeUndefined();
  });

  it('handles localStorage keys', async () => {
    await storage.initDB();
    
    await storage.set('theme', 'dark');
    const result = await storage.get('theme');
    
    expect(result).toBe('dark');
  });
});

