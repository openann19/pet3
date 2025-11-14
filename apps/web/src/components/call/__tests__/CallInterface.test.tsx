import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallInterface from '@/components/call/CallInterface';
import type { CallSession } from '@/lib/call-types';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
  useBounceOnTap: vi.fn(() => ({
    animatedStyle: {},
    handlePress: vi.fn(),
  })),
}));

describe('CallInterface', () => {
  const mockSession: CallSession = {
    call: {
      id: 'call1',
      roomId: 'room1',
      status: 'active',
      type: 'video',
      initiatorId: 'user1',
      recipientId: 'user2',
      duration: 0,
      quality: 'excellent',
    },
    localParticipant: {
      id: 'user1',
      name: 'User 1',
      avatar: '/avatar1.jpg',
      isMuted: false,
      isVideoEnabled: true,
    },
    remoteParticipant: {
      id: 'user2',
      name: 'User 2',
      avatar: '/avatar2.jpg',
      isMuted: false,
      isVideoEnabled: true,
    },
    localStream: undefined,
    remoteStream: undefined,
    isMinimized: false,
    videoQuality: '720p',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders call interface', () => {
    render(
      <CallInterface
        session={mockSession}
        onEndCall={vi.fn()}
        onToggleMute={vi.fn()}
        onToggleVideo={vi.fn()}
      />
    );

    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('calls onEndCall when end call button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnEndCall = vi.fn();

    render(
      <CallInterface
        session={mockSession}
        onEndCall={mockOnEndCall}
        onToggleMute={vi.fn()}
        onToggleVideo={vi.fn()}
      />
    );

    const endCallButton = screen.getByLabelText(/end call/i);
    await user.click(endCallButton);

    await waitFor(() => {
      expect(mockOnEndCall).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onToggleMute when mute button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggleMute = vi.fn();

    render(
      <CallInterface
        session={mockSession}
        onEndCall={vi.fn()}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={vi.fn()}
      />
    );

    const muteButton = screen.getByLabelText(/mute/i);
    await user.click(muteButton);

    await waitFor(() => {
      expect(mockOnToggleMute).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onToggleVideo when video button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggleVideo = vi.fn();

    render(
      <CallInterface
        session={mockSession}
        onEndCall={vi.fn()}
        onToggleMute={vi.fn()}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    const videoButton = screen.getByLabelText(/video/i);
    await user.click(videoButton);

    await waitFor(() => {
      expect(mockOnToggleVideo).toHaveBeenCalledTimes(1);
    });
  });

  it('displays call duration', async () => {
    vi.useFakeTimers();
    render(
      <CallInterface
        session={mockSession}
        onEndCall={vi.fn()}
        onToggleMute={vi.fn()}
        onToggleVideo={vi.fn()}
      />
    );

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.getByText(/00:05/)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});

