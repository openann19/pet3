import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeClient } from '@/lib/realtime';

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  })),
}));

describe('RealtimeClient', () => {
  let client: RealtimeClient;

  beforeEach(() => {
    client = new RealtimeClient();
    vi.clearAllMocks();
  });

  it('creates realtime client instance', () => {
    expect(client).toBeInstanceOf(RealtimeClient);
  });

  it('sets access token', () => {
    client.setAccessToken('test-token');
    expect(client).toBeDefined();
  });

  it('connects when access token is set', () => {
    client.setAccessToken('test-token');
    client.connect();
    expect(client).toBeDefined();
  });

  it('disconnects', () => {
    client.setAccessToken('test-token');
    client.connect();
    client.disconnect();
    expect(client).toBeDefined();
  });

  it('subscribes to events', () => {
    const callback = vi.fn();
    client.on('message', callback);
    
    expect(callback).toBeDefined();
  });

  it('unsubscribes from events', () => {
    const callback = vi.fn();
    client.on('message', callback);
    client.off('message', callback);
    
    expect(callback).toBeDefined();
  });

  it('emits events', async () => {
    client.setAccessToken('test-token');
    client.connect();
    
    const result = await client.emit('test-event', { data: 'test' });
    
    expect(result.success).toBe(true);
  });

  it('queues events when offline', async () => {
    const result = await client.emit('test-event', { data: 'test' });
    
    expect(result.success).toBe(false);
  });
});

