import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react-native';
import { AdvancedFilterPanel } from '@/components/enhanced/AdvancedFilterPanel';

vi.mock('@mobile/hooks/use-filters', () => ({
  useFilters: vi.fn(() => ({
    values: {},
    activeFiltersCount: 0,
    applyFilters: vi.fn(),
    resetFilters: vi.fn(),
    handleMultiSelect: vi.fn(),
    handleSingleSelect: vi.fn(),
    handleRangeChange: vi.fn(),
    handleToggle: vi.fn(),
  })),
}));

describe('AdvancedFilterPanel', () => {
  const mockCategories = [
    {
      id: 'breed',
      label: 'Breed',
      type: 'multi-select' as const,
      options: [
        { id: 'golden', label: 'Golden Retriever' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter panel', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Filters')).toBeDefined();
  });
});

