import { describe, it, expect, vi } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import { ConfettiBurst } from '../ConfettiBurst'

vi.mock('@/effects/chat/core/reduced-motion', () => ({
  useReducedMotion: () => true,
  getReducedMotionDuration: (base: number) => Math.min(120, base),
}))

describe('ConfettiBurst', () => {
  it('fires onComplete in reduced-motion fallback', async () => {
    const onComplete = vi.fn()
    render(<ConfettiBurst enabled particleCount={10} onComplete={onComplete} />)
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 2000 })
    cleanup()
  })

  it('changes particle count on re-render', () => {
    const { rerender, container } = render(<ConfettiBurst enabled particleCount={4} />)
    const root = container.firstElementChild as HTMLElement
    expect(root?.childElementCount).toBe(4)

    rerender(<ConfettiBurst enabled particleCount={9} />)
    expect(root?.childElementCount).toBe(9)
    cleanup()
  })
})

