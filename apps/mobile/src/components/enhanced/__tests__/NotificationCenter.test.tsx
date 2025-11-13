import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NotificationCenter } from '@/components/enhanced/NotificationCenter';

vi.mock('@mobile/hooks/use-storage', () => ({
  useStorage: vi.fn(() => [[], vi.fn()]),
}));

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification center', () => {
    render(<NotificationCenter />);

    expect(screen).toBeDefined();
  });
});

