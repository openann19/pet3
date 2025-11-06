import { describe, it, expect, vi } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import { ReactionBurstParticles } from '../ReactionBurstParticles'

// Force reduced motion path (fast onComplete)
vi.mock('@/effects/chat/core/reduced-motion', () => ({
  useReducedMotion: () => true,
  getReducedMotionDuration: (base: number) => Math.min(120, base),
}))

describe('ReactionBurstParticles', () => {
  it('calls onComplete under reduced-motion', async () => {
    const onComplete = vi.fn()
    render(<ReactionBurstParticles enabled count={6} onComplete={onComplete} />)
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 2000 })
    cleanup()
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

