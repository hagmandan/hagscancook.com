// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    recipe: {
      findMany: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { generateUniqueSlug, toSlug } from './slugify'

const mockFindMany = vi.mocked(db.recipe.findMany)

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
    mockFindMany.mockReset()
  })

  it('returns the base slug when available', async () => {
    mockFindMany.mockResolvedValue([])

    await expect(generateUniqueSlug('Lemon Pasta')).resolves.toBe('lemon-pasta')

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { slug: { startsWith: 'lemon-pasta' }, deletedAt: null },
      select: { id: true, slug: true },
    })
  })

  it('appends the first available numeric suffix after collisions', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'recipe-1', slug: 'lemon-pasta' },
      { id: 'recipe-2', slug: 'lemon-pasta-2' },
    ] as Awaited<ReturnType<typeof db.recipe.findMany>>)

    await expect(generateUniqueSlug('Lemon Pasta')).resolves.toBe('lemon-pasta-3')

    expect(mockFindMany).toHaveBeenCalledTimes(1)
  })

  it('treats the excluded recipe id as available', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'current-recipe', slug: 'lemon-pasta' },
    ] as Awaited<ReturnType<typeof db.recipe.findMany>>)

    await expect(generateUniqueSlug('Lemon Pasta', 'current-recipe')).resolves.toBe('lemon-pasta')
  })

  it('uses a recipe fallback when the title has no slug-safe characters', async () => {
    mockFindMany.mockResolvedValue([])

    await expect(generateUniqueSlug('!!!')).resolves.toBe('recipe')
  })

  it('uses a timestamp fallback when numeric suffixes are exhausted', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1234567890)
    // Fill taken set with base + all 2..999 suffixes
    const rows = [{ id: 'r0', slug: 'lemon-pasta' }]
    for (let i = 2; i < 1000; i++) {
      rows.push({ id: `r${i}`, slug: `lemon-pasta-${i}` })
    }
    mockFindMany.mockResolvedValue(rows as Awaited<ReturnType<typeof db.recipe.findMany>>)

    await expect(generateUniqueSlug('Lemon Pasta')).resolves.toBe('lemon-pasta-1234567890')

    expect(mockFindMany).toHaveBeenCalledTimes(1)
    nowSpy.mockRestore()
  })
})
