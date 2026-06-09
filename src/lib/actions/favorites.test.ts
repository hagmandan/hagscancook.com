import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    favorite: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}))

vi.mock('@/lib/monitoring/errors', () => ({
  captureException: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { captureException } from '@/lib/monitoring/errors'
import { toggleFavorite } from './favorites'

const mockRequireSession = vi.mocked(requireSession)
const mockFindUnique = vi.mocked(db.favorite.findUnique)
const mockCreate = vi.mocked(db.favorite.create)
const mockDelete = vi.mocked(db.favorite.delete)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockCaptureException = vi.mocked(captureException)

describe('toggleFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
    mockCreate.mockResolvedValue({})
    mockDelete.mockResolvedValue({})
  })

  it('creates a favorite when one does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await toggleFavorite('recipe-1', 'lemon-pasta')

    expect(result).toEqual({ favorited: true })
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId_recipeId: { userId: 'user-1', recipeId: 'recipe-1' } },
      select: { userId: true },
    })
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 'user-1', recipeId: 'recipe-1' },
    })
    expect(mockDelete).not.toHaveBeenCalled()
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/favorites')
  })

  it('deletes an existing favorite', async () => {
    mockFindUnique.mockResolvedValue({ userId: 'user-1' })

    const result = await toggleFavorite('recipe-1', 'lemon-pasta')

    expect(result).toEqual({ favorited: false })
    expect(mockDelete).toHaveBeenCalledWith({
      where: { userId_recipeId: { userId: 'user-1', recipeId: 'recipe-1' } },
    })
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/favorites')
  })

  it('returns an error and captures exceptions from database failures', async () => {
    const error = new Error('database unavailable')
    mockFindUnique.mockRejectedValue(error)

    const result = await toggleFavorite('recipe-1', 'lemon-pasta')

    expect(result).toEqual({ error: 'Failed to update favorite. Please try again.' })
    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      feature: 'favorites',
      operation: 'toggle',
      runtime: 'server',
    })
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
