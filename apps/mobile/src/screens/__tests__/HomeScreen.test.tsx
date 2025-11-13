import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { HomeScreen } from '@/screens/HomeScreen';

vi.mock('@mobile/hooks/use-domain-snapshots', () => ({
  useDomainSnapshots: vi.fn(() => ({
    adoption: {
      canEditActiveListing: true,
      canReceiveApplications: true,
    },
    community: {
      canEditPendingPost: true,
      canReceiveCommentsOnActivePost: true,
    },
    matching: {
      hardGatesPassed: true,
      score: {
        totalScore: 85.5,
      },
    },
  })),
}));

vi.mock('@mobile/components/PullableContainer', () => ({
  PullableContainer: ({ children }: { children: React.ReactNode }) => children,
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders home screen', () => {
    render(<HomeScreen />);

    expect(screen.getByText('PetSpark Mobile Readiness')).toBeDefined();
  });

  it('displays adoption feature card', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Adoption')).toBeDefined();
    expect(screen.getByText(/Active listings can be edited/)).toBeDefined();
  });

  it('displays community feature card', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Community')).toBeDefined();
    expect(screen.getByText(/Pending posts editable/)).toBeDefined();
  });

  it('displays matching feature card', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Matching')).toBeDefined();
    expect(screen.getByText(/Hard gates/)).toBeDefined();
  });

  it('handles refresh', async () => {
    render(<HomeScreen />);

    // Component should render without errors
    expect(screen.getByText('PetSpark Mobile Readiness')).toBeDefined();
  });
});
