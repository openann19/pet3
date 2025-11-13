import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { ChatScreen } from '@/screens/ChatScreen';

vi.mock('@mobile/hooks/api/use-chat', () => ({
  useChatRooms: vi.fn(() => ({
    data: { items: [] },
    isLoading: false,
    error: null,
  })),
}));

describe('ChatScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat screen', () => {
    render(<ChatScreen />);

    expect(screen).toBeDefined();
  });
});

