import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthNavLinks } from './AuthNavLinks'
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

describe('AuthNavLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })

    const { container } = render(<AuthNavLinks className="nav-link" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for guests', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })

    const { container } = render(<AuthNavLinks className="nav-link" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders My Pantry and My Recipes links for authenticated users', () => {
    mockUseAuth.mockReturnValue({ user: { displayName: 'Hags' }, loading: false })

    render(<AuthNavLinks className="nav-link" />)

    const pantryLink = screen.getByRole('link', { name: 'My Pantry' })
    expect(pantryLink).toHaveAttribute('href', '/pantry')
    expect(pantryLink).toHaveClass('nav-link')

    const recipesLink = screen.getByRole('link', { name: 'My Recipes' })
    expect(recipesLink).toHaveAttribute('href', '/my-recipes')
    expect(recipesLink).toHaveClass('nav-link')
  })
})
