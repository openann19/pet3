import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters } from '@/hooks/use-filters';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('useFilters', () => {
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

  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: {},
      })
    );

    expect(result.current.values).toEqual({});
    expect(result.current.activeFiltersCount).toBe(0);
  });

  it('initializes with provided values', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: { breed: ['golden'] },
      })
    );

    expect(result.current.values.breed).toEqual(['golden']);
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it('handles multi-select', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: {},
      })
    );

    act(() => {
      result.current.handleMultiSelect('breed', 'golden');
    });

    expect(result.current.values.breed).toEqual(['golden']);

    act(() => {
      result.current.handleMultiSelect('breed', 'golden');
    });

    expect(result.current.values.breed).toEqual([]);
  });

  it('handles single-select', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: {},
      })
    );

    act(() => {
      result.current.handleSingleSelect('breed', 'golden');
    });

    expect(result.current.values.breed).toBe('golden');
  });

  it('handles range change', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: {},
      })
    );

    act(() => {
      result.current.handleRangeChange('age', [5]);
    });

    expect(result.current.values.age).toBe(5);
  });

  it('handles toggle', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: {},
      })
    );

    act(() => {
      result.current.handleToggle('vaccinated');
    });

    expect(result.current.values.vaccinated).toBe(true);

    act(() => {
      result.current.handleToggle('vaccinated');
    });

    expect(result.current.values.vaccinated).toBe(false);
  });

  it('resets filters', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: { breed: ['golden'], vaccinated: true },
      })
    );

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.values.breed).toEqual([]);
    expect(result.current.values.vaccinated).toBe(false);
  });

  it('calls onApply when applyFilters is called', () => {
    const mockOnApply = vi.fn();
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: { breed: ['golden'] },
        onApply: mockOnApply,
      })
    );

    act(() => {
      result.current.applyFilters();
    });

    expect(mockOnApply).toHaveBeenCalledWith({ breed: ['golden'] });
  });

  it('calculates active filters count correctly', () => {
    const { result } = renderHook(() =>
      useFilters({
        categories: mockCategories,
        initialValues: {
          breed: ['golden', 'lab'],
          vaccinated: true,
          age: 5,
        },
      })
    );

    expect(result.current.activeFiltersCount).toBe(3);
  });
});

