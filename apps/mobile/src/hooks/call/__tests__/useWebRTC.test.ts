import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebRTC } from '@/hooks/call/useWebRTC';

vi.mock('react-native-webrtc', () => ({
  RTCPeerConnection: vi.fn(),
  RTCSessionDescription: vi.fn(),
  RTCIceCandidate: vi.fn(),
}));

describe('useWebRTC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates WebRTC hook instance', () => {
    const { result } = renderHook(() => useWebRTC());

    expect(result.current).toBeDefined();
  });
});

