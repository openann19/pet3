import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import SignUpScreen from '@/screens/SignUpScreen';

const mockNavigation = {
  navigate: vi.fn(),
  goBack: vi.fn(),
  reset: vi.fn(),
  replace: vi.fn(),
} as any;

const mockRoute = {
  key: 'SignUp',
  name: 'SignUp' as const,
  params: undefined,
} as any;

describe('SignUpScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign up screen', () => {
    render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen).toBeDefined();
  });
});
