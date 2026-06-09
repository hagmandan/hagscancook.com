import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./PantryNavLink', () => ({
  PantryNavLink: ({ className }: { className?: string }) => (
    <a href="/pantry" className={className}>
      Pantry
    </a>
  ),
}))

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}))

vi.mock('./UserMenu', () => ({
  UserMenu: () => <div>User menu</div>,
}))

vi.mock('./Header.module.css', () => ({
  default: {
    header: 'header',
    inner: 'inner',
    logo: 'logo',
    nav: 'nav',
    navLink: 'navLink',
  },
}))

describe('Header', () => {
  it('renders primary navigation and header controls', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: 'HagsCanCook' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Recipes' })).toHaveAttribute('href', '/recipes')
    expect(screen.getByRole('link', { name: 'Pantry' })).toHaveAttribute('href', '/pantry')
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getByText('User menu')).toBeInTheDocument()
  })
})
