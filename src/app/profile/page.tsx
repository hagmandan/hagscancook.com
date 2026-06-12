/**
 * Profile page — /profile
 *
 * Authenticated Server Component. Renders a client-side profile form for
 * updating display name. Email and avatar (from Google SSO) are shown
 * read-only.
 */

import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProfileForm } from './ProfileForm'
import { BadgeGrid, type BadgeCounts } from '@/components/profile/BadgeGrid'
import styles from './profile.module.css'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await requireSession()
  const userId = session.userId

  const hitMakerGroups = await db.favorite.groupBy({
    by: ['recipeId'],
    where: {
      recipe: { authorId: userId, status: 'published', deletedAt: null },
    },
    _count: { _all: true },
  })

  const [badges, pantryCt, recipeCt, communityFavCt] = await Promise.all([
    db.userBadge.findMany({
      where: { userId },
      select: { badgeType: true, tier: true, earnedAt: true },
      orderBy: { earnedAt: 'asc' },
    }),
    db.pantryItem.count({ where: { userId } }),
    db.recipe.count({ where: { authorId: userId, status: 'published', deletedAt: null } }),
    db.favorite.count({ where: { recipe: { authorId: userId, deletedAt: null } } }),
  ])

  const hitMakerCt = hitMakerGroups.reduce((acc, g) => Math.max(acc, g._count._all), 0)

  const counts: BadgeCounts = {
    pantry: pantryCt,
    recipes: recipeCt,
    communityFav: communityFavCt,
    hitMaker: hitMakerCt,
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <div className={styles.card}>
        {/* Avatar */}
        <div className={styles.avatarSection}>
          {session.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.avatarUrl}
              alt={session.displayName}
              className={styles.avatar}
              width={72}
              height={72}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {session.displayName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className={styles.avatarName}>{session.displayName}</p>
            <p className={styles.avatarEmail}>{session.email}</p>
          </div>
        </div>

        <hr className={styles.divider} />

        <ProfileForm initialDisplayName={session.displayName} />
      </div>

      <BadgeGrid badges={badges} counts={counts} />
    </div>
  )
}
