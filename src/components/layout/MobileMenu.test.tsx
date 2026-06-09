import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('./Providers', () => ({ useAuth: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { MobileMenu } from './MobileMenu'
import { useAuth } from './Providers'

const mockLogout = vi.fn()
const authedUser = { displayName: 'Dan', email: 'dan@test.com', photoURL: null }

describe('MobileMenu', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: authedUser as never,
      loading: false,
      logout: mockLogout,
    })
  })

  it('renders a hamburger button', () => {
    render(<MobileMenu />)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('drawer is absent initially', () => {
    render(<MobileMenu />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens drawer when hamburger is clicked', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows Recipes, My Recipes, My Pantry and Sign out when authenticated', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('link', { name: 'Recipes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Recipes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Pantry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows Sign in and Sign up for guests, no auth-only links', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: mockLogout })
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Recipes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Pantry' })).not.toBeInTheDocument()
  })

  it('closes drawer when backdrop is clicked', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fireEvent.click(document.querySelector('[data-testid="mobile-backdrop"]')!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes drawer on Escape key', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('updates aria-label and aria-expanded when open', () => {
    render(<MobileMenu />)
    const btn = screen.getByRole('button', { name: /open menu/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
  })
})
