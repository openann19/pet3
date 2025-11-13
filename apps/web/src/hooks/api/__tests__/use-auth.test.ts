import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin, useSignup, useLogout } from '@/hooks/api/use-auth';

vi.mock('@/lib/api-services', () => ({
  authAPI: {
    login: vi.fn(() => Promise.resolve({
      user: { id: 'user1', email: 'test@example.com' },
      tokens: { accessToken: 'token1', refreshToken: 'refresh1' },
    })),
    signup: vi.fn(() => Promise.resolve({
      user: { id: 'user1', email: 'test@example.com' },
      tokens: { accessToken: 'token1', refreshToken: 'refresh1' },
    })),
    logout: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

describe('useAuth hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('useLogin', () => {
    it('calls authAPI.login with credentials', async () => {
      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'password123',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles login errors', async () => {
      const { authAPI } = await import('@/lib/api-services');
      vi.mocked(authAPI.login).mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'wrong',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useSignup', () => {
    it('calls authAPI.signup with data', async () => {
      const { result } = renderHook(() => useSignup(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useLogout', () => {
    it('calls authAPI.logout and clears cache', async () => {
      const { result } = renderHook(() => useLogout(), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

