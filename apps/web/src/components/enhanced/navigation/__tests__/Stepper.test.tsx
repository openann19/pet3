import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from '@/components/enhanced/navigation/Stepper';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    selection: vi.fn(),
  },
}));

describe('Stepper', () => {
  const mockSteps = [
    { id: '1', label: 'Step 1' },
    { id: '2', label: 'Step 2' },
    { id: '3', label: 'Step 3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stepper with steps', () => {
    render(
      <Stepper steps={mockSteps} currentStep={0} />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('calls onStepClick when step is clicked', async () => {
    const user = userEvent.setup();
    const mockOnStepClick = vi.fn();

    render(
      <Stepper
        steps={mockSteps}
        currentStep={1}
        onStepClick={mockOnStepClick}
      />
    );

    const step1 = screen.getByText('Step 1');
    await user.click(step1);

    await waitFor(() => {
      expect(mockOnStepClick).toHaveBeenCalledWith(0);
    });
  });

  it('renders with horizontal orientation', () => {
    render(
      <Stepper steps={mockSteps} currentStep={0} orientation="horizontal" />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders with vertical orientation', () => {
    render(
      <Stepper steps={mockSteps} currentStep={0} orientation="vertical" />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Stepper steps={mockSteps} currentStep={0} className="custom-stepper" />
    );

    const stepper = container.firstChild as HTMLElement;
    expect(stepper).toHaveClass('custom-stepper');
  });
});

