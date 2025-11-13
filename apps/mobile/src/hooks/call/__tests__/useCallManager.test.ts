import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCallManager } from '@/hooks/call/useCallManager';

vi.mock('react-native-webrtc', () => ({
  RTCPeerConnection: vi.fn(),
  RTCSessionDescription: vi.fn(),
  RTCIceCandidate: vi.fn(),
}));

describe('useCallManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates call manager instance', () => {
    const { result } = renderHook(() => useCallManager());

    expect(result.current).toBeDefined();
  });
});

