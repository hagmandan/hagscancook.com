import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecipeCard, type RecipeCardData } from './RecipeCard'
import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

vi.mock('./RecipeCard.module.css', () => ({
  default: {
    card: 'card',
    imageWrapper: 'imageWrapper',
    image: 'image',
    imagePlaceholder: 'imagePlaceholder',
    body: 'body',
    cuisine: 'cuisine',
    title: 'title',
    description: 'description',
    meta: 'meta',
    metaItem: 'metaItem',
    author: 'author',
  },
}))

const recipe: RecipeCardData = {
  id: 'recipe-1',
  slug: 'lemon-pasta',
  title: 'Lemon Pasta',
  description: 'A bright weeknight pasta.',
  coverImageUrl: 'https://cdn.example.com/lemon-pasta.jpg',
  prepTimeMins: 15,
  cookTimeMins: 20,
  servings: 4,
  cuisine: 'Italian',
  author: { displayName: 'Hags' },
}

describe('RecipeCard', () => {
  it('links to the recipe detail page and renders core content', () => {
    render(<RecipeCard recipe={recipe} />)

    expect(screen.getByRole('link', { name: /Lemon Pasta/ })).toHaveAttribute('href', '/recipes/lemon-pasta')
    expect(screen.getByRole('img', { name: 'Lemon Pasta' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/lemon-pasta.jpg',
    )
    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('A bright weeknight pasta.')).toBeInTheDocument()
    expect(screen.getByText('35 min')).toBeInTheDocument()
    expect(screen.getByText('Serves 4')).toBeInTheDocument()
    expect(screen.getByText('by Hags')).toBeInTheDocument()
  })

  it('renders a placeholder and omits optional metadata when absent', () => {
    const { container } = render(
      <RecipeCard
        recipe={{
          ...recipe,
          coverImageUrl: null,
          prepTimeMins: null,
          cookTimeMins: null,
          servings: null,
          cuisine: null,
        }}
      />,
    )

    expect(container.querySelector('.imagePlaceholder')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('Italian')).not.toBeInTheDocument()
    expect(screen.queryByText(/min$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Serves/)).not.toBeInTheDocument()
  })
})
