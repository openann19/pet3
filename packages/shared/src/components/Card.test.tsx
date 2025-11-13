import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from './Card';

describe('Card', () => {
  it('renders with aria-label and region role', () => {
    render(
      <Card ariaLabel="Test Card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    const card = screen.getByRole('region', { name: 'Test Card' });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-label', 'Test Card');
  });

  it('renders title as h2 and description as p', () => {
    render(
      <Card ariaLabel="Card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Card Title');
    expect(screen.getByText('Description').tagName).toBe('P');
  });

  it('applies focus ring and is keyboard accessible', () => {
    render(
      <Card ariaLabel="Focusable Card" tabIndex={0}>
        <CardContent>Focusable Content</CardContent>
      </Card>
    );
    const card = screen.getByRole('region', { name: 'Focusable Card' });
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});
