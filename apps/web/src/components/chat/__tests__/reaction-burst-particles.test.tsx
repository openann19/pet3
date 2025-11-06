import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import { ReactionBurstParticles } from '../ReactionBurstParticles'

// Force reduced motion path (fast onComplete)
vi.mock('@/effects/chat/core/reduced-motion', () => ({
  useReducedMotion: () => true,
  getReducedMotionDuration: (base: number) => Math.min(120, base),
}))

describe('ReactionBurstParticles', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('calls onComplete under reduced-motion', async () => {
    const onComplete = vi.fn()
    render(<ReactionBurstParticles enabled count={6} onComplete={onComplete} />)
    
    // In reduced motion, onComplete should be called quickly
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 500 })
  })

  it('re-renders with different seed without crashing', () => {
    const { rerender, container } = render(<ReactionBurstParticles enabled count={5} seed="a" />)
    const first = container.firstElementChild as HTMLElement
    expect(first?.childElementCount).toBe(5)

    rerender(<ReactionBurstParticles enabled count={7} seed="b" />)
    const second = container.firstElementChild as HTMLElement
    expect(second?.childElementCount).toBe(7)
    cleanup()
  })
})

