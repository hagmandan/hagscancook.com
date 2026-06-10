import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoriteButton } from './FavoriteButton'

vi.mock('@/lib/actions/favorites', () => ({
  toggleFavorite: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({
  useToast: vi.fn(() => ({
    error: vi.fn(),
    success: vi.fn(),
  })),
}))

vi.mock('./FavoriteButton.module.css', () => ({
  default: { button: 'button', favorited: 'favorited', icon: 'icon' },
}))

vi.mock('@/lib/badges', () => ({
  tierLabel: vi.fn((tier: string) => tier),
  badgeLabel: vi.fn((type: string) => type),
  badgeSubtitle: vi.fn(() => ''),
}))

import { toggleFavorite } from '@/lib/actions/favorites'
import { useToast } from '@/lib/toast'

const mockToggleFavorite = vi.mocked(toggleFavorite)

async function clickAndFlushTransition(button: HTMLElement) {
  await act(async () => {
    await userEvent.click(button)
  })

  await act(async () => {
    await Promise.resolve()
  })
}

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the unfavorited state', () => {
    render(<FavoriteButton recipeId="recipe-1" recipeSlug="lemon-pasta" initialFavorited={false} />)

    const button = screen.getByRole('button', { name: 'Save to favorites' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('renders the favorited state', () => {
    render(<FavoriteButton recipeId="recipe-1" recipeSlug="lemon-pasta" initialFavorited />)

    const button = screen.getByRole('button', { name: 'Remove from favorites' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('calls toggleFavorite with recipe id and slug', async () => {
    mockToggleFavorite.mockResolvedValue({ favorited: true, newBadges: [] })
    render(<FavoriteButton recipeId="recipe-1" recipeSlug="lemon-pasta" initialFavorited={false} />)

    await clickAndFlushTransition(screen.getByRole('button', { name: 'Save to favorites' }))

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith('recipe-1', 'lemon-pasta')
    })
  })

  it('optimistically updates and then reflects the server result', async () => {
    mockToggleFavorite.mockResolvedValue({ favorited: true, newBadges: [] })
    render(<FavoriteButton recipeId="recipe-1" recipeSlug="lemon-pasta" initialFavorited={false} />)

    await clickAndFlushTransition(screen.getByRole('button', { name: 'Save to favorites' }))

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Remove from favorites' })
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('rolls back optimistic state and shows a toast on failure', async () => {
    const mockError = vi.fn()
    vi.mocked(useToast).mockReturnValue({ error: mockError } as ReturnType<typeof useToast>)
    mockToggleFavorite.mockResolvedValue({ error: 'Failed to update favorite. Please try again.' })
    render(<FavoriteButton recipeId="recipe-1" recipeSlug="lemon-pasta" initialFavorited={false} />)

    await clickAndFlushTransition(screen.getByRole('button', { name: 'Save to favorites' }))

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Save to favorites' })
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
    expect(mockError).toHaveBeenCalledWith('Error', 'Could not update favorite')
  })
})
