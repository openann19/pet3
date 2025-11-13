import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from '@/hooks/use-navigation';

vi.mock('@/lib/routes', () => ({
  routes: {
    discover: { path: '/discover' },
    matches: { path: '/matches' },
    profile: { path: '/profile' },
  },
  getSafeRouteParams: vi.fn((view, params) => params || {}),
  isValidView: vi.fn((view) => ['discover', 'matches', 'profile'].includes(view)),
  getDefaultView: vi.fn(() => 'discover'),
}));

describe('useNavigation', () => {
  const mockSetCurrentView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates navigation hook', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentView));

    expect(result.current.navigate).toBeDefined();
    expect(result.current.navigateToView).toBeDefined();
    expect(result.current.routes).toBeDefined();
  });

  it('navigates to view with config', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentView));

    act(() => {
      result.current.navigate({
        view: 'matches',
        params: {},
      });
    });

    expect(mockSetCurrentView).toHaveBeenCalledWith('matches');
  });

  it('navigates to view directly', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentView));

    act(() => {
      result.current.navigateToView('profile');
    });

    expect(mockSetCurrentView).toHaveBeenCalledWith('profile');
  });

  it('validates view before navigation', () => {
    const { result } = renderHook(() => useNavigation(mockSetCurrentView));

    act(() => {
      result.current.navigateToView('invalid-view');
    });

    // Should fallback to default view
    expect(mockSetCurrentView).toHaveBeenCalled();
  });
});

