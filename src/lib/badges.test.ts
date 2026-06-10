// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    pantryItem: { count: vi.fn() },
    recipe: { count: vi.fn(), findMany: vi.fn() },
    favorite: { count: vi.fn(), groupBy: vi.fn() },
    userBadge: { findMany: vi.fn(), createMany: vi.fn() },
  },
}))

import { db } from '@/lib/db'
import {
  checkAndAwardBadges,
  BADGE_THRESHOLDS,
  tierLabel,
  badgeLabel,
  badgeSubtitle,
  nextThreshold,
} from './badges'

const mockPantryCount = vi.mocked(db.pantryItem.count)
const mockRecipeCount = vi.mocked(db.recipe.count)
const mockFavCount = vi.mocked(db.favorite.count)
const mockRecipeFindMany = vi.mocked(db.recipe.findMany)
const mockFavGroupBy = vi.mocked(db.favorite.groupBy)
const mockBadgeFindMany = vi.mocked(db.userBadge.findMany)
const mockBadgeCreateMany = vi.mocked(db.userBadge.createMany)

beforeEach(() => {
  vi.clearAllMocks()
  mockBadgeCreateMany.mockResolvedValue({ count: 0 })
})

describe('BADGE_THRESHOLDS', () => {
  it('has six tiers in ascending order', () => {
    expect(BADGE_THRESHOLDS).toHaveLength(6)
    expect(BADGE_THRESHOLDS.map((t) => t.min)).toEqual([3, 10, 25, 50, 75, 100])
  })
})

describe('checkAndAwardBadges — PANTRY_PIONEER', () => {
  it('returns empty when count is below Iron threshold', async () => {
    mockPantryCount.mockResolvedValue(2)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([])
    expect(mockBadgeCreateMany).not.toHaveBeenCalled()
  })

  it('awards Iron when count exactly meets the threshold', async () => {
    mockPantryCount.mockResolvedValue(3)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([{ badgeType: 'PANTRY_PIONEER', tier: 'IRON' }])
    expect(mockBadgeCreateMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-1', badgeType: 'PANTRY_PIONEER', tier: 'IRON' }],
      skipDuplicates: true,
    })
  })

  it('awards multiple tiers when count skips ahead', async () => {
    mockPantryCount.mockResolvedValue(25)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result.map((r) => r.tier)).toEqual(['IRON', 'BRONZE', 'SILVER'])
  })

  it('skips already-earned tiers', async () => {
    mockPantryCount.mockResolvedValue(10)
    mockBadgeFindMany.mockResolvedValue([
      { tier: 'IRON' },
    ] as Awaited<ReturnType<typeof db.userBadge.findMany>>)

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([{ badgeType: 'PANTRY_PIONEER', tier: 'BRONZE' }])
    expect(mockBadgeCreateMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-1', badgeType: 'PANTRY_PIONEER', tier: 'BRONZE' }],
      skipDuplicates: true,
    })
    expect(mockBadgeFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', badgeType: 'PANTRY_PIONEER' },
      select: { tier: true },
    })
  })

  it('returns empty when all earned tiers are already stored', async () => {
    mockPantryCount.mockResolvedValue(10)
    mockBadgeFindMany.mockResolvedValue([
      { tier: 'IRON' },
      { tier: 'BRONZE' },
    ] as Awaited<ReturnType<typeof db.userBadge.findMany>>)

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([])
    expect(mockBadgeCreateMany).not.toHaveBeenCalled()
  })
})

describe('checkAndAwardBadges — RECIPE_AUTHOR', () => {
  it('queries published non-deleted recipes', async () => {
    mockRecipeCount.mockResolvedValue(0)
    mockBadgeFindMany.mockResolvedValue([])

    await checkAndAwardBadges('user-1', 'RECIPE_AUTHOR')

    expect(mockRecipeCount).toHaveBeenCalledWith({
      where: { authorId: 'user-1', status: 'published', deletedAt: null },
    })
  })
})

describe('checkAndAwardBadges — COMMUNITY_FAVORITE', () => {
  it("queries favorites on the user's non-deleted recipes", async () => {
    mockFavCount.mockResolvedValue(0)
    mockBadgeFindMany.mockResolvedValue([])

    await checkAndAwardBadges('user-1', 'COMMUNITY_FAVORITE')

    expect(mockFavCount).toHaveBeenCalledWith({
      where: { recipe: { authorId: 'user-1', deletedAt: null } },
    })
  })
})

describe('checkAndAwardBadges — HIT_MAKER', () => {
  it('returns 0 when user has no recipes', async () => {
    mockRecipeFindMany.mockResolvedValue([])
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'HIT_MAKER')

    expect(result).toEqual([])
    expect(mockFavGroupBy).not.toHaveBeenCalled()
  })

  it('returns empty when user has recipes but no favorites yet', async () => {
    mockRecipeFindMany.mockResolvedValue([
      { id: 'recipe-a' },
    ] as Awaited<ReturnType<typeof db.recipe.findMany>>)
    mockFavGroupBy.mockResolvedValue([])
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'HIT_MAKER')

    expect(result).toEqual([])
    expect(mockBadgeCreateMany).not.toHaveBeenCalled()
  })

  it("returns max favorites across the user's recipes", async () => {
    mockRecipeFindMany.mockResolvedValue([
      { id: 'recipe-a' },
      { id: 'recipe-b' },
    ] as Awaited<ReturnType<typeof db.recipe.findMany>>)
    mockFavGroupBy.mockResolvedValue([
      { recipeId: 'recipe-a', _count: { _all: 25 } },
      { recipeId: 'recipe-b', _count: { _all: 4 } },
    ] as Awaited<ReturnType<typeof db.favorite.groupBy>>)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'HIT_MAKER')

    expect(result.map((r) => r.tier)).toEqual(['IRON', 'BRONZE', 'SILVER'])
  })
})

describe('formatters', () => {
  it('tierLabel returns human-readable tier names', () => {
    expect(tierLabel('IRON')).toBe('Iron')
    expect(tierLabel('IRIDIUM')).toBe('Iridium')
  })

  it('badgeLabel returns human-readable badge names', () => {
    expect(badgeLabel('PANTRY_PIONEER')).toBe('Pantry Pioneer')
    expect(badgeLabel('HIT_MAKER')).toBe('Hit Maker')
  })

  it('badgeSubtitle returns copy mentioning the threshold count', () => {
    expect(badgeSubtitle({ badgeType: 'PANTRY_PIONEER', tier: 'IRON' })).toContain('3')
    expect(badgeSubtitle({ badgeType: 'RECIPE_AUTHOR', tier: 'BRONZE' })).toContain('10')
  })

  it('nextThreshold returns next tier above current count', () => {
    expect(nextThreshold(5)).toEqual({ tier: 'BRONZE', min: 10 })
    expect(nextThreshold(100)).toBeNull()
  })
})
