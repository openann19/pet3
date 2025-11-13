import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartSearch } from '@/components/enhanced/SmartSearch';

vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn((key: string, initial: string[]) => {
    const [value, setValue] = vi.fn(() => [initial, vi.fn()])();
    return [value, setValue];
  }),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('SmartSearch', () => {
  const mockData = [
    { id: '1', name: 'Golden Retriever', breed: 'Retriever' },
    { id: '2', name: 'Labrador', breed: 'Retriever' },
    { id: '3', name: 'German Shepherd', breed: 'Shepherd' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['name', 'breed']}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['name']}
        placeholder="Search pets..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search pets...');
    expect(input).toBeInTheDocument();
  });

  it('shows search results when query is entered', async () => {
    const user = userEvent.setup();
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['name']}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'Golden');
    
    await waitFor(() => {
      expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    });
  });

  it('filters results based on search keys', async () => {
    const user = userEvent.setup();
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['breed']}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'Retriever');
    
    await waitFor(() => {
      expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
      expect(screen.getByText('Labrador')).toBeInTheDocument();
      expect(screen.queryByText('German Shepherd')).not.toBeInTheDocument();
    });
  });

  it('calls onSelect when result is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['name']}
        onSelect={mockOnSelect}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'Golden');
    
    await waitFor(() => {
      const result = screen.getByText('Golden Retriever');
      expect(result).toBeInTheDocument();
    });
    
    const result = screen.getByText('Golden Retriever');
    await user.click(result);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockData[0]);
  });

  it('shows trending searches when showTrending is true', async () => {
    const user = userEvent.setup();
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['name']}
        showTrending={true}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByText('Trending Searches')).toBeInTheDocument();
    });
  });

  it('shows search history when showHistory is true', async () => {
    const user = userEvent.setup();
    render(
      <SmartSearch
        data={mockData}
        searchKeys={['name']}
        showHistory={true}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    });
  });

  it('limits results to maxResults', async () => {
    const user = userEvent.setup();
    const largeData = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      name: `Pet ${i}`,
    }));
    
    render(
      <SmartSearch
        data={largeData}
        searchKeys={['name']}
        maxResults={5}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'Pet');
    
    await waitFor(() => {
      const results = screen.getAllByText(/Pet \d+/);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <SmartSearch
        data={mockData}
        searchKeys={['name']}
        className="custom-search"
      />
    );
    
    const searchContainer = container.firstChild as HTMLElement;
    expect(searchContainer).toHaveClass('custom-search');
  });
});

