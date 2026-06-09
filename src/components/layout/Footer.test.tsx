import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Footer } from './Footer'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./Footer.module.css', () => ({
  default: {
    footer: 'footer',
    inner: 'inner',
    copy: 'copy',
    links: 'links',
    link: 'link',
  },
}))

describe('Footer', () => {
  it('renders copyright and legal links', () => {
    render(<Footer />)

    expect(screen.getByText(`©${new Date().getFullYear()} HagsCanCook`)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
    // expect(screen.getByRole('link', { name: 'DMCA' })).toHaveAttribute('href', '/dmca')
  })
})
