import type { BadgeType, BadgeTier } from '@prisma/client'
import { BADGE_THRESHOLDS, tierLabel, nextThreshold } from '@/lib/badges'
import styles from './BadgeGrid.module.css'

type EarnedBadge = { badgeType: BadgeType; tier: BadgeTier; earnedAt: Date }

export type BadgeCounts = {
  pantry: number
  recipes: number
  communityFav: number
  hitMaker: number
}

interface BadgeGridProps {
  badges: EarnedBadge[]
  counts: BadgeCounts
}

const BADGE_DEFS: {
  type: BadgeType
  label: string
  countKey: keyof BadgeCounts
  unlockHint: string
}[] = [
  {
    type: 'PANTRY_PIONEER',
    label: 'Pantry Pioneer',
    countKey: 'pantry',
    unlockHint: 'Stock 3 pantry items to unlock',
  },
  {
    type: 'RECIPE_AUTHOR',
    label: 'Recipe Author',
    countKey: 'recipes',
    unlockHint: 'Publish 3 recipes to unlock',
  },
  {
    type: 'COMMUNITY_FAVORITE',
    label: 'Community Favorite',
    countKey: 'communityFav',
    unlockHint: 'Receive 3 saves on your recipes to unlock',
  },
  {
    type: 'HIT_MAKER',
    label: 'Hit Maker',
    countKey: 'hitMaker',
    unlockHint: 'Get 3 saves on a single recipe to unlock',
  },
]

export function BadgeGrid({ badges, counts }: BadgeGridProps) {
  // Build a map of badgeType → highest earned tier + earnedAt
  const badgeMap = new Map<BadgeType, EarnedBadge>()
  for (const b of badges) {
    const existing = badgeMap.get(b.badgeType)
    const existingIdx = existing
      ? BADGE_THRESHOLDS.findIndex((t) => t.tier === existing.tier)
      : -1
    const newIdx = BADGE_THRESHOLDS.findIndex((t) => t.tier === b.tier)
    if (newIdx > existingIdx) badgeMap.set(b.badgeType, b)
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Badges</h2>
      <div className={styles.grid}>
        {BADGE_DEFS.map(({ type, label, countKey, unlockHint }) => {
          const earned = badgeMap.get(type)
          const count = counts[countKey]
          const next = nextThreshold(count)

          return (
            <div
              key={type}
              className={`${styles.card} ${earned ? styles.earned : styles.locked}`}
            >
              <p className={styles.badgeName}>{label}</p>
              {earned ? (
                <>
                  <p className={styles.tier}>{tierLabel(earned.tier)}</p>
                  <p className={styles.earnedAt}>
                    Earned{' '}
                    {earned.earnedAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {next && (
                    <p className={styles.progress}>
                      {next.min - count} more to {tierLabel(next.tier)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className={styles.tier}>Not yet earned</p>
                  <p className={styles.unlockHint}>{unlockHint}</p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
