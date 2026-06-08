// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    recipe: {
      findUnique: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { generateUniqueSlug, toSlug } from './slugify'

const mockFindUnique = vi.mocked(db.recipe.findUnique)

describe('toSlug', () => {
  it('lowercases and collapses spaces, underscores, and hyphens', () => {
    expect(toSlug('  Lemon___Pasta -- Bake  ')).toBe('lemon-pasta-bake')
  })

  it('removes punctuation and normalizes accents', () => {
    expect(toSlug('Crème brûlée: mom’s best!')).toBe('creme-brulee-moms-best')
  })

  it('trims leading and trailing hyphens', () => {
    expect(toSlug('--- pasta night ---')).toBe('pasta-night')
  })

  it('caps slugs at 100 characters', () => {
    expect(toSlug('a'.repeat(120))).toHaveLength(100)
  })

  it('returns an empty string when no slug-safe title remains', () => {
    expect(toSlug('!!!')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  beforeEach(() => {
    mockFindUnique.mockReset()
  })

  it('returns the base slug when available', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(generateUniqueSlug('Lemon Pasta')).resolves.toBe('lemon-pasta')

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slug: 'lemon-pasta' },
      select: { id: true },
    })
  })

  it('appends the first available numeric suffix after collisions', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: 'recipe-1' })
      .mockResolvedValueOnce({ id: 'recipe-2' })
      .mockResolvedValueOnce(null)

    await expect(generateUniqueSlug('Lemon Pasta')).resolves.toBe('lemon-pasta-3')

    expect(mockFindUnique).toHaveBeenNthCalledWith(2, {
      where: { slug: 'lemon-pasta-2' },
      select: { id: true },
    })
    expect(mockFindUnique).toHaveBeenNthCalledWith(3, {
      where: { slug: 'lemon-pasta-3' },
      select: { id: true },
    })
  })

  it('treats the excluded recipe id as available', async () => {
    mockFindUnique.mockResolvedValue({ id: 'current-recipe' })

    await expect(generateUniqueSlug('Lemon Pasta', 'current-recipe')).resolves.toBe('lemon-pasta')
  })

  it('uses a recipe fallback when the title has no slug-safe characters', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(generateUniqueSlug('!!!')).resolves.toBe('recipe')
  })
})
