import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '@/api/auth-api';

vi.mock('@/lib/api-client', () => ({
  APIClient: {
    get: vi.fn(() => Promise.resolve({
      data: { id: 'user1', email: 'test@example.com' },
    })),
    post: vi.fn(() => Promise.resolve({
      data: {
        user: { id: 'user1', email: 'test@example.com' },
        accessToken: 'token1',
        refreshToken: 'refresh1',
      },
    })),
  },
}));

vi.mock('@/lib/endpoints', () => ({
  ENDPOINTS: {
    AUTH: {
      ME: '/auth/me',
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      RESET_PASSWORD: '/auth/reset-password',
      FORGOT_PASSWORD: '/auth/forgot-password',
    },
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets current user', async () => {
    const user = await authApi.me();

    expect(user).toEqual({ id: 'user1', email: 'test@example.com' });
  });

  it('logs in user', async () => {
    const response = await authApi.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.user).toBeDefined();
    expect(response.accessToken).toBe('token1');
    expect(response.refreshToken).toBe('refresh1');
  });

  it('registers new user', async () => {
    const response = await authApi.register({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    expect(response.user).toBeDefined();
    expect(response.accessToken).toBe('token1');
  });

  it('logs out user', async () => {
    await expect(authApi.logout()).resolves.not.toThrow();
  });

  it('refreshes token', async () => {
    const response = await authApi.refresh();

    expect(response.accessToken).toBe('token1');
  });

  it('updates password', async () => {
    await expect(
      authApi.updatePassword({
        currentPassword: 'old',
        newPassword: 'new',
      })
    ).resolves.not.toThrow();
  });

  it('sends forgot password request', async () => {
    const response = await authApi.forgotPassword({
      email: 'test@example.com',
    });

    expect(response.success).toBe(true);
  });
});
