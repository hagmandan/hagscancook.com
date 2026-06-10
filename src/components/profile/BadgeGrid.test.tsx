import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { BadgeType, BadgeTier } from '@prisma/client'
import { BadgeGrid, type BadgeCounts } from './BadgeGrid'

// badges.ts imports db at module level — mock to prevent DB init in tests
vi.mock('@/lib/db', () => ({
  db: {},
}))

vi.mock('./BadgeGrid.module.css', () => ({
  default: {
    section: 'section',
    heading: 'heading',
    grid: 'grid',
    card: 'card',
    earned: 'earned',
    locked: 'locked',
    badgeName: 'badgeName',
    tier: 'tier',
    earnedAt: 'earnedAt',
    progress: 'progress',
    unlockHint: 'unlockHint',
  },
}))

const zeroCounts: BadgeCounts = { pantry: 0, recipes: 0, communityFav: 0, hitMaker: 0 }

function badge(badgeType: BadgeType, tier: BadgeTier, earnedAt = new Date(2024, 0, 15)) {
  return { badgeType, tier, earnedAt }
}

describe('BadgeGrid', () => {
  it('renders all four badge cards as locked when no badges are earned', () => {
    render(<BadgeGrid badges={[]} counts={zeroCounts} />)

    expect(screen.getByText('Pantry Pioneer')).toBeInTheDocument()
    expect(screen.getByText('Recipe Author')).toBeInTheDocument()
    expect(screen.getByText('Community Favorite')).toBeInTheDocument()
    expect(screen.getByText('Hit Maker')).toBeInTheDocument()

    expect(screen.getAllByText('Not yet earned')).toHaveLength(4)
  })

  it('shows unlock hint for locked badges', () => {
    render(<BadgeGrid badges={[]} counts={zeroCounts} />)

    expect(screen.getByText('Stock 3 pantry items to unlock')).toBeInTheDocument()
    expect(screen.getByText('Publish 3 recipes to unlock')).toBeInTheDocument()
  })

  it('shows tier label and earned date for an earned badge', () => {
    render(
      <BadgeGrid
        badges={[badge('PANTRY_PIONEER', 'IRON')]}
        counts={{ ...zeroCounts, pantry: 5 }}
      />
    )

    expect(screen.getByText('Iron')).toBeInTheDocument()
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
  })

  it('shows progress hint when a next threshold exists', () => {
    // 5 pantry items → IRON earned, next is BRONZE at 10 → "5 more to Bronze"
    render(
      <BadgeGrid
        badges={[badge('PANTRY_PIONEER', 'IRON')]}
        counts={{ ...zeroCounts, pantry: 5 }}
      />
    )

    expect(screen.getByText('5 more to Bronze')).toBeInTheDocument()
  })

  it('does not show progress hint at max tier (IRIDIUM)', () => {
    render(
      <BadgeGrid
        badges={[badge('RECIPE_AUTHOR', 'IRIDIUM')]}
        counts={{ ...zeroCounts, recipes: 100 }}
      />
    )

    expect(screen.queryByText(/more to/)).not.toBeInTheDocument()
  })

  it('shows the highest tier when multiple tiers are earned for the same badge', () => {
    render(
      <BadgeGrid
        badges={[
          badge('PANTRY_PIONEER', 'IRON', new Date(2024, 0, 1)),
          badge('PANTRY_PIONEER', 'BRONZE', new Date(2024, 5, 1)),
        ]}
        counts={{ ...zeroCounts, pantry: 12 }}
      />
    )

    expect(screen.getByText('Bronze')).toBeInTheDocument()
    expect(screen.queryByText('Iron')).not.toBeInTheDocument()
    // Only one earned date shown
    expect(screen.getAllByText(/Jun 1, 2024/)).toHaveLength(1)
  })
})
