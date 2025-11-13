import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStorage } from '@/hooks/use-storage';

vi.mock('@/lib/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    initDB: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
  })),
}));

vi.mock('@/lib/storage-schemas', () => ({
  validateStorageData: vi.fn((key, value) => value),
}));

describe('useStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    const { storage } = await import('@/lib/storage');
    vi.mocked(storage.clear).mockResolvedValue(undefined);
  });

  it('returns default value when key does not exist', async () => {
    const { storage } = await import('@/lib/storage');
    vi.mocked(storage.get).mockResolvedValue(undefined);

    const { result } = renderHook(() => useStorage('test-key', 'default'));

    await waitFor(() => {
      expect(result.current[0]).toBe('default');
    });
  });

  it('returns stored value when key exists', async () => {
    const { storage } = await import('@/lib/storage');
    vi.mocked(storage.get).mockResolvedValue('stored-value');

    const { result } = renderHook(() => useStorage('test-key', 'default'));

    await waitFor(() => {
      expect(result.current[0]).toBe('stored-value');
    });
  });

  it('updates value when setValue is called', async () => {
    const { storage } = await import('@/lib/storage');
    vi.mocked(storage.get).mockResolvedValue(undefined);
    vi.mocked(storage.set).mockResolvedValue(undefined);

    const { result } = renderHook(() => useStorage('test-key', 'default'));

    await waitFor(() => {
      expect(result.current[0]).toBe('default');
    });

    await act(async () => {
      await result.current[1]('new-value');
    });

    await waitFor(() => {
      expect(storage.set).toHaveBeenCalledWith('test-key', 'new-value');
    });
  });

  it('removes value when deleteValue is called', async () => {
    const { storage } = await import('@/lib/storage');
    vi.mocked(storage.get).mockResolvedValue('value');
    vi.mocked(storage.remove).mockResolvedValue(undefined);

    const { result } = renderHook(() => useStorage('test-key', 'default'));

    await waitFor(() => {
      expect(result.current[0]).toBe('value');
    });

    await act(async () => {
      await result.current[2]();
    });

    await waitFor(() => {
      expect(storage.remove).toHaveBeenCalledWith('test-key');
    });
  });
});

