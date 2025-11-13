import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumTabs } from '@/components/enhanced/navigation/PremiumTabs';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

describe('PremiumTabs', () => {
  const mockTabs = [
    { value: 'tab1', label: 'Tab 1' },
    { value: 'tab2', label: 'Tab 2' },
    { value: 'tab3', label: 'Tab 3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tabs', () => {
    render(
      <PremiumTabs tabs={mockTabs} />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('calls onValueChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const mockOnValueChange = vi.fn();

    render(
      <PremiumTabs
        tabs={mockTabs}
        onValueChange={mockOnValueChange}
      />
    );

    const tab2 = screen.getByText('Tab 2');
    await user.click(tab2);

    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalledWith('tab2');
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumTabs tabs={mockTabs} variant="default" />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();

    rerender(
      <PremiumTabs tabs={mockTabs} variant="pills" />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();

    rerender(
      <PremiumTabs tabs={mockTabs} variant="underline" />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumTabs tabs={mockTabs} size="sm" />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();

    rerender(
      <PremiumTabs tabs={mockTabs} size="md" />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();

    rerender(
      <PremiumTabs tabs={mockTabs} size="lg" />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumTabs tabs={mockTabs} className="custom-tabs" />
    );

    const tabs = container.firstChild as HTMLElement;
    expect(tabs).toHaveClass('custom-tabs');
  });
});

