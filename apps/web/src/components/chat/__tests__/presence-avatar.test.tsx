import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PresenceAvatar } from '../PresenceAvatar'

describe('PresenceAvatar', () => {
  it('renders without aurora ring when offline', () => {
    const { container } = render(<PresenceAvatar status="offline" fallback="A" />)
    // Ring should not be rendered when offline
    const ring = container.querySelector('[class*="ring"], [class*="gradient"]')
    expect(ring).toBeNull()
  })

  it('renders aurora ring when online', () => {
    const { container } = render(<PresenceAvatar status="online" fallback="A" />)
    // Ring should be visible when online
    const ring = container.querySelector('[class*="ring"], [class*="gradient"]')
    expect(ring).not.toBeNull()
  })
})

