import type { BadgeType, BadgeTier } from '@prisma/client'
import { db } from '@/lib/db'

export type NewBadge = { badgeType: BadgeType; tier: BadgeTier }

export const BADGE_THRESHOLDS: { tier: BadgeTier; min: number }[] = [
  { tier: 'IRON', min: 3 },
  { tier: 'BRONZE', min: 10 },
  { tier: 'SILVER', min: 25 },
  { tier: 'GOLD', min: 50 },
  { tier: 'PLATINUM', min: 75 },
  { tier: 'IRIDIUM', min: 100 },
]

async function getCount(userId: string, badgeType: BadgeType): Promise<number> {
  switch (badgeType) {
    case 'PANTRY_PIONEER':
      // Count all items, including out-of-stock — the badge tracks items ever added,
      // not current stock level.
      return db.pantryItem.count({ where: { userId } })
    case 'RECIPE_AUTHOR':
      return db.recipe.count({
        where: { authorId: userId, status: 'published', deletedAt: null },
      })
    case 'COMMUNITY_FAVORITE':
      return db.favorite.count({
        where: { recipe: { authorId: userId, deletedAt: null } },
      })
    case 'HIT_MAKER': {
      const recipeIds = await db.recipe
        .findMany({ where: { authorId: userId, status: 'published', deletedAt: null }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id))
      if (recipeIds.length === 0) return 0
      const groups = await db.favorite.groupBy({
        by: ['recipeId'],
        where: { recipeId: { in: recipeIds } },
        _count: { _all: true },
      })
      return groups.reduce((acc, g) => Math.max(acc, g._count._all), 0)
    }
  }
}

export async function checkAndAwardBadges(
  userId: string,
  badgeType: BadgeType,
): Promise<NewBadge[]> {
  const count = await getCount(userId, badgeType)

  const earnedTiers = BADGE_THRESHOLDS.filter(({ min }) => count >= min).map(({ tier }) => tier)
  if (earnedTiers.length === 0) return []

  const alreadyEarned = await db.userBadge.findMany({
    where: { userId, badgeType },
    select: { tier: true },
  })
  const alreadyEarnedSet = new Set(alreadyEarned.map((b) => b.tier))

  const newTiers = earnedTiers.filter((tier) => !alreadyEarnedSet.has(tier))
  if (newTiers.length === 0) return []

  await db.userBadge.createMany({
    data: newTiers.map((tier) => ({ userId, badgeType, tier })),
    skipDuplicates: true,
  })

  return newTiers.map((tier) => ({ badgeType, tier }))
}

export function tierLabel(tier: BadgeTier): string {
  const labels: Record<BadgeTier, string> = {
    IRON: 'Iron',
    BRONZE: 'Bronze',
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum',
    IRIDIUM: 'Iridium',
  }
  return labels[tier]
}

export function badgeLabel(badgeType: BadgeType): string {
  const labels: Record<BadgeType, string> = {
    PANTRY_PIONEER: 'Pantry Pioneer',
    RECIPE_AUTHOR: 'Recipe Author',
    COMMUNITY_FAVORITE: 'Community Favorite',
    HIT_MAKER: 'Hit Maker',
  }
  return labels[badgeType]
}

export function badgeSubtitle(badge: NewBadge): string {
  const count = BADGE_THRESHOLDS.find((t) => t.tier === badge.tier)?.min ?? 0
  const subtitles: Record<BadgeType, string> = {
    PANTRY_PIONEER: `You've stocked ${count} pantry items!`,
    RECIPE_AUTHOR: `You've published ${count} recipe${count === 1 ? '' : 's'}!`,
    COMMUNITY_FAVORITE: `Your recipes have been saved ${count} time${count === 1 ? '' : 's'}!`,
    HIT_MAKER: `One of your recipes has been saved ${count} time${count === 1 ? '' : 's'}!`,
  }
  return subtitles[badge.badgeType]
}

export function nextThreshold(currentCount: number): { tier: BadgeTier; min: number } | null {
  return BADGE_THRESHOLDS.find(({ min }) => min > currentCount) ?? null
}
