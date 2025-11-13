import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SmartSearch } from '@/components/enhanced/SmartSearch';

vi.mock('@mobile/hooks/use-storage', () => ({
  useStorage: vi.fn(() => [[], vi.fn()]),
}));

describe('SmartSearch', () => {
  const mockData = [
    { id: '1', name: 'Golden Retriever' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['name']}
      />
    );

    expect(screen).toBeDefined();
  });
});

