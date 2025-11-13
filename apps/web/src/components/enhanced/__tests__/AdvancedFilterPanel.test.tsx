import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedFilterPanel } from '@/components/enhanced/AdvancedFilterPanel';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-filters', () => ({
  useFilters: vi.fn(({ initialValues, onApply }) => ({
    values: initialValues,
    activeFiltersCount: Object.keys(initialValues || {}).filter(
      (key) => initialValues?.[key] !== undefined && initialValues?.[key] !== null && initialValues?.[key] !== ''
    ).length,
    applyFilters: vi.fn(() => onApply?.(initialValues)),
    resetFilters: vi.fn(() => onApply?.({})),
    handleMultiSelect: vi.fn((categoryId, optionId) => {
      const current = (initialValues?.[categoryId] as string[]) || [];
      const newValues = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      onApply?.({ ...initialValues, [categoryId]: newValues });
    }),
    handleSingleSelect: vi.fn((categoryId, optionId) => {
      onApply?.({ ...initialValues, [categoryId]: optionId });
    }),
    handleRangeChange: vi.fn((categoryId, value) => {
      onApply?.({ ...initialValues, [categoryId]: value[0] });
    }),
    handleToggle: vi.fn((categoryId) => {
      onApply?.({ ...initialValues, [categoryId]: !initialValues?.[categoryId] });
    }),
  })),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

describe('AdvancedFilterPanel', () => {
  const mockOnChange = vi.fn();
  const mockOnClose = vi.fn();

  const mockCategories = [
    {
      id: 'breed',
      label: 'Breed',
      type: 'multi-select' as const,
      options: [
        { id: 'golden', label: 'Golden Retriever' },
        { id: 'lab', label: 'Labrador' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'range' as const,
      min: 0,
      max: 20,
      step: 1,
      unit: 'years',
    },
    {
      id: 'vaccinated',
      label: 'Vaccinated',
      type: 'toggle' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter panel with categories', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Breed')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Vaccinated')).toBeInTheDocument();
  });

  it('renders close button when onClose is provided', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={mockOnChange}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close filter panel');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={mockOnChange}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close filter panel');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows active filter count when showActiveCount is true', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{ breed: ['golden'] }}
        onChange={mockOnChange}
        showActiveCount={true}
      />
    );

    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('renders multi-select options', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Labrador')).toBeInTheDocument();
  });

  it('renders range slider for range type', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={mockOnChange}
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('renders reset and apply buttons', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText('Reset all filters')).toBeInTheDocument();
    expect(screen.getByLabelText(/Apply.*filters/)).toBeInTheDocument();
  });

  it('disables reset button when no active filters', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        values={{}}
        onChange={mockOnChange}
      />
    );

    const resetButton = screen.getByLabelText('Reset all filters');
    expect(resetButton).toBeDisabled();
  });
});

