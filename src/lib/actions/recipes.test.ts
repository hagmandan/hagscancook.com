import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    recipe: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn().mockResolvedValue({ userId: 'user-1', role: 'user' }),
}))

vi.mock('@/lib/monitoring/errors', () => ({
  captureException: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { loadMoreRecipes } from './recipes'
import { db } from '@/lib/db'

const mockFindMany = vi.mocked(db.recipe.findMany)

function makeRecipe(id: string) {
  return {
    id,
    slug: `recipe-${id}`,
    title: `Recipe ${id}`,
    description: 'A recipe',
    coverImageUrl: null,
    prepTimeMins: null,
    cookTimeMins: null,
    servings: null,
    cuisine: null,
    author: { displayName: 'Chef' },
  }
}

describe('loadMoreRecipes', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  it('returns recipes and null nextCursor when fewer than 20 results come back', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => makeRecipe(String(i)))
    mockFindMany.mockResolvedValue(rows)

    const result = await loadMoreRecipes('cursor-id', {})

    expect(result.recipes).toHaveLength(5)
    expect(result.nextCursor).toBeNull()
  })

  it('slices to 20 and sets nextCursor when 21 rows come back', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => makeRecipe(String(i)))
    mockFindMany.mockResolvedValue(rows)

    const result = await loadMoreRecipes('cursor-id', {})

    expect(result.recipes).toHaveLength(20)
    expect(result.nextCursor).toBe('19')
  })

  it('queries with cursor and skip:1', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc-cursor', {})

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'abc-cursor' },
        skip: 1,
        take: 21,
      })
    )
  })

  it('passes cuisine filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { cuisine: 'Italian' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cuisine: 'Italian' }),
      })
    )
  })

  it('passes dietary filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { dietary: 'Vegan' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dietaryRestrictions: { has: 'Vegan' },
        }),
      })
    )
  })

  it('passes tag filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { tag: 'quick-meals' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tags: { some: { tag: { slug: 'quick-meals' } } },
        }),
      })
    )
  })
})
