import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react-native';
import { EnhancedPetDetailView } from '@/components/enhanced/EnhancedPetDetailView';

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

const mockPet = {
  id: 'pet1',
  name: 'Fluffy',
  breed: 'Golden Retriever',
  age: 2,
  photo: '/photo1.jpg',
  photos: ['/photo1.jpg', '/photo2.jpg'],
};

describe('EnhancedPetDetailView', () => {
  const mockOnClose = vi.fn();
  const mockOnLike = vi.fn();
  const mockOnPass = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pet detail view', () => {
    render(
      <EnhancedPetDetailView
        pet={mockPet}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Fluffy')).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EnhancedPetDetailView
        pet={mockPet}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onLike when like button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EnhancedPetDetailView
        pet={mockPet}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    await user.click(likeButton);

    await waitFor(() => {
      expect(mockOnLike).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onPass when pass button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EnhancedPetDetailView
        pet={mockPet}
        onClose={mockOnClose}
        onPass={mockOnPass}
      />
    );

    const passButton = screen.getByRole('button', { name: /pass/i });
    await user.click(passButton);

    await waitFor(() => {
      expect(mockOnPass).toHaveBeenCalledTimes(1);
    });
  });

  it('displays compatibility score when provided', () => {
    render(
      <EnhancedPetDetailView
        pet={mockPet}
        onClose={mockOnClose}
        compatibilityScore={85}
      />
    );

    expect(screen.getByText(/85|compatibility/i)).toBeDefined();
  });
});

