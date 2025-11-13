import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct variant and accessibility', () => {
    render(<Button variant="primary" ariaLabel="Primary Action">Click Me</Button>);
    const btn = screen.getByRole('button', { name: 'Primary Action' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-primary');
    expect(btn).toHaveAttribute('aria-label', 'Primary Action');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('opacity-50');
  });
});
