import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { PaginationBar } from './PaginationBar'

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

vi.mock('./PaginationBar.module.css', () => ({
  default: {
    bar: 'bar',
    link: 'link',
    disabled: 'disabled',
    label: 'label',
  },
}))

describe('PaginationBar', () => {
  it('does not render when there is only one page', () => {
    const { container } = render(
      <PaginationBar currentPage={1} totalPages={1} basePath="/recipes" />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('disables previous link on the first page', () => {
    render(<PaginationBar currentPage={1} totalPages={3} basePath="/recipes" />)

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByText('← Previous')).not.toHaveAttribute('href')
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Next →' })).toHaveAttribute(
      'href',
      '/recipes?page=2'
    )
  })

  it('links to previous and next pages with extra params preserved', () => {
    render(
      <PaginationBar
        currentPage={2}
        totalPages={4}
        basePath="/recipes"
        extraParams={{ q: 'pasta', tag: 'weeknight' }}
      />
    )

    expect(screen.getByRole('link', { name: '← Previous' })).toHaveAttribute(
      'href',
      '/recipes?q=pasta&tag=weeknight&page=1'
    )
    expect(screen.getByRole('link', { name: 'Next →' })).toHaveAttribute(
      'href',
      '/recipes?q=pasta&tag=weeknight&page=3'
    )
  })

  it('disables next link on the last page', () => {
    render(<PaginationBar currentPage={3} totalPages={3} basePath="/recipes" />)

    expect(screen.getByRole('link', { name: '← Previous' })).toHaveAttribute(
      'href',
      '/recipes?page=2'
    )
    expect(screen.getByText('Next →')).not.toHaveAttribute('href')
  })
})
