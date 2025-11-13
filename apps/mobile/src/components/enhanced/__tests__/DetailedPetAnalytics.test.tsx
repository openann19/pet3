import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { DetailedPetAnalytics } from '@/components/enhanced/DetailedPetAnalytics';

describe('DetailedPetAnalytics', () => {
  const mockPet = {
    name: 'Fluffy',
    breed: 'Golden Retriever',
    age: 2,
    gender: 'male',
    personality: ['friendly', 'playful'],
    interests: ['fetch', 'swimming'],
  };

  const mockTrustProfile = {
    overallRating: 4.5,
    playdateCount: 10,
    responseRate: 0.9,
    responseTime: '2 hours',
    totalReviews: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pet analytics', () => {
    render(
      <DetailedPetAnalytics
        pet={mockPet}
        trustProfile={mockTrustProfile}
      />
    );

    expect(screen.getByText('Fluffy')).toBeDefined();
  });

  it('displays compatibility score when provided', () => {
    render(
      <DetailedPetAnalytics
        pet={mockPet}
        compatibilityScore={85}
      />
    );

    expect(screen.getByText(/85|compatibility/i)).toBeDefined();
  });

  it('displays match reasons when provided', () => {
    render(
      <DetailedPetAnalytics
        pet={mockPet}
        matchReasons={['Both love fetch', 'Similar energy levels']}
      />
    );

    expect(screen.getByText(/match|reasons/i)).toBeDefined();
  });

  it('displays trust profile stats', () => {
    render(
      <DetailedPetAnalytics
        pet={mockPet}
        trustProfile={mockTrustProfile}
      />
    );

    expect(screen.getByText(/rating|playdates|response/i)).toBeDefined();
  });
});

