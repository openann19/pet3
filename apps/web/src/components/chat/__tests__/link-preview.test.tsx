import { describe, it, expect } from 'vitest'
import { render, screen, rerender } from '@testing-library/react'
import { LinkPreview } from '../LinkPreview'

describe('LinkPreview', () => {
  it('shows skeleton when loading and content when loaded', () => {
    const { rerender } = render(
      <LinkPreview url="https://example.com" isLoading image="https://x/y.jpg" />
    )
    // aria-busy true when loading
    const loadingElement = screen.getByRole('region', { hidden: true }) || screen.getByRole('generic')
    expect(loadingElement).toHaveAttribute('aria-busy', 'true')

    rerender(
      <LinkPreview
        url="https://example.com/path"
        title="Example"
        description="Desc"
        image="https://x/y.jpg"
        isLoading={false}
      />
    )
    // link visible
    const link = screen.getByRole('link', { name: /example|example\.com/i })
    expect(link).toBeInTheDocument()
  })
})

