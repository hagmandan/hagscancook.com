import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CharCounter } from './CharCounter'

vi.mock('./CharCounter.module.css', () => ({
  default: {
    counter: 'counter',
    near: 'near',
    over: 'over',
  },
}))

describe('CharCounter', () => {
  it('renders zero for undefined values', () => {
    render(<CharCounter value={undefined} max={100} />)

    expect(screen.getByText('0 / 100')).toHaveClass('counter')
  })

  it('renders the current character count', () => {
    render(<CharCounter value="hello" max={100} />)

    expect(screen.getByText('5 / 100')).toHaveClass('counter')
    expect(screen.getByText('5 / 100')).not.toHaveClass('near')
    expect(screen.getByText('5 / 100')).not.toHaveClass('over')
  })

  it('marks values at 80 percent as near the limit', () => {
    render(<CharCounter value={'a'.repeat(80)} max={100} />)

    expect(screen.getByText('80 / 100')).toHaveClass('near')
    expect(screen.getByText('80 / 100')).not.toHaveClass('over')
  })

  it('marks values at or over the limit as over', () => {
    render(<CharCounter value={'a'.repeat(100)} max={100} />)

    expect(screen.getByText('100 / 100')).toHaveClass('over')
  })

  it('announces changes politely', () => {
    render(<CharCounter value="hello" max={100} />)

    const counter = screen.getByText('5 / 100')
    expect(counter).toHaveAttribute('aria-live', 'polite')
    expect(counter).toHaveAttribute('aria-atomic', 'true')
  })
})
