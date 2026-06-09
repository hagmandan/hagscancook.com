import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PantryNavLink } from './PantryNavLink'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

const mockUseAuth = vi.fn()

vi.mock('./Providers', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('PantryNavLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })

    const { container } = render(<PantryNavLink className="nav-link" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for guests', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })

    const { container } = render(<PantryNavLink className="nav-link" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the pantry link for authenticated users', () => {
    mockUseAuth.mockReturnValue({ user: { displayName: 'Hags' }, loading: false })

    render(<PantryNavLink className="nav-link" />)

    const link = screen.getByRole('link', { name: 'Pantry' })
    expect(link).toHaveAttribute('href', '/pantry')
    expect(link).toHaveClass('nav-link')
  })
})
