import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusToggle } from './StatusToggle'

// Mock the server action
vi.mock('@/lib/actions/recipes', () => ({
  toggleRecipeStatus: vi.fn(),
}))

// Mock useToast
vi.mock('@/lib/toast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
  })),
}))

// Mock CSS modules
vi.mock('./StatusToggle.module.css', () => ({
  default: { toggle: 'toggle', draft: 'draft', published: 'published' },
}))

import { toggleRecipeStatus } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'

const mockToggle = vi.mocked(toggleRecipeStatus)

async function clickAndFlushTransition(button: HTMLElement) {
  await act(async () => {
    await userEvent.click(button)
  })

  await act(async () => {
    await Promise.resolve()
  })
}

describe('StatusToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Publish" for a draft recipe', () => {
    render(<StatusToggle recipeId="abc" currentStatus="draft" />)
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
  })

  it('renders "Unpublish" for a published recipe', () => {
    render(<StatusToggle recipeId="abc" currentStatus="published" />)
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
  })

  it('calls toggleRecipeStatus with recipeId on click', async () => {
    mockToggle.mockResolvedValue({ status: 'published' })
    render(<StatusToggle recipeId="recipe-123" currentStatus="draft" />)
    await clickAndFlushTransition(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith('recipe-123')
    })
  })

  it('updates label to "Unpublish" after successful publish', async () => {
    mockToggle.mockResolvedValue({ status: 'published' })
    render(<StatusToggle recipeId="abc" currentStatus="draft" />)
    await clickAndFlushTransition(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
    })
  })

  it('shows error toast on failure', async () => {
    const mockError = vi.fn()
    vi.mocked(useToast).mockReturnValue({ error: mockError, success: vi.fn() } as ReturnType<typeof useToast>)
    mockToggle.mockResolvedValue({ error: 'Failed to update recipe status. Please try again.' })
    render(<StatusToggle recipeId="abc" currentStatus="draft" />)
    await clickAndFlushTransition(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith('Error', 'Failed to update recipe status. Please try again.')
    })
  })
})
