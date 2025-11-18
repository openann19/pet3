import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthScreen } from '@/components/AuthScreenSimple';

describe('AuthScreenSimple', () => {
  const mockOnSignIn = vi.fn();
  const mockOnSignUp = vi.fn();

  const defaultProps = {
    onSignIn: mockOnSignIn,
    onSignUp: mockOnSignUp,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign in form by default', () => {
    render(<AuthScreen {...defaultProps} />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to Sign Up' })).toBeInTheDocument();
  });

  it('switches to sign up mode', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const switchButton = screen.getByRole('button', { name: 'Switch to Sign Up' });
    await user.click(switchButton);

    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to Sign In' })).toBeInTheDocument();
  });

  it('updates email and password fields', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls onSignIn when sign in button is clicked with valid data', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(signInButton);

    expect(mockOnSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockOnSignUp).not.toHaveBeenCalled();
  });

  it('calls onSignUp when sign up button is clicked with valid data', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const switchButton = screen.getByRole('button', { name: 'Switch to Sign Up' });
    const signUpButton = screen.getByRole('button', { name: 'Sign Up' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(switchButton);
    await user.click(signUpButton);

    expect(mockOnSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  it('disables submit button when fields are empty', () => {
    render(<AuthScreen {...defaultProps} />);

    const signInButton = screen.getByRole('button', { name: 'Sign In' });
    expect(signInButton).toBeDisabled();
  });

  it('disables submit button when email is empty', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(passwordInput, 'password123');

    expect(signInButton).toBeDisabled();
  });

  it('disables submit button when password is empty', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const signInButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');

    expect(signInButton).toBeDisabled();
  });

  it('enables submit button when both fields have values', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(signInButton).toBeEnabled();
  });

  it('does not call onSignIn when button is disabled', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    const signInButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(signInButton);

    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  it('handles switching back and forth between modes', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    // Start in sign in mode
    expect(screen.getByText('Sign In')).toBeInTheDocument();

    // Switch to sign up
    await user.click(screen.getByRole('button', { name: 'Switch to Sign Up' }));
    expect(screen.getByText('Sign Up')).toBeInTheDocument();

    // Switch back to sign in
    await user.click(screen.getByRole('button', { name: 'Switch to Sign In' }));
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
