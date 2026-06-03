/**
 * Homepage — /
 *
 * Public Server Component. Renders a teaser grid of the 6 most recently
 * published recipes and a sign-up CTA for guests.
 *
 * Guests see this limited grid to encourage free sign-up. Authenticated
 * users are not redirected — they see the same page with a link to the
 * full feed instead.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import type { RecipeCardData } from '@/components/recipe/RecipeCard'

export const metadata: Metadata = {
  title: 'hags can cook',
  description: 'A community recipe site for home cooks. Browse recipes, save favorites, and share what you love to make.',
  openGraph: {
    title: 'hags can cook',
    description: 'A community recipe site for home cooks. Browse recipes, save favorites, and share what you love to make.',
    url: '/',
    type: 'website',
  },
  twitter: {
    title: 'hags can cook',
    description: 'A community recipe site for home cooks.',
  },
  alternates: {
    canonical: '/',
  },
}
import { getSession } from '@/lib/auth'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import styles from './page.module.css'

async function getRecentRecipes() {
  return db.recipe.findMany({
    where: { status: 'published', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImageUrl: true,
      prepTimeMins: true,
      cookTimeMins: true,
      servings: true,
      cuisine: true,
      author: { select: { displayName: true } },
    },
  })
}

export default async function HomePage() {
  const [recipes, session] = await Promise.all([
    getRecentRecipes(),
    getSession(),
  ])

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Recipes worth cooking
        </h1>
        <p className={styles.heroSubtitle}>
          A community of home cooks sharing what they love to make.
        </p>
        {!session ? (
          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Sign up free
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              Sign in
            </Link>
          </div>
        ) : (
          <Link href="/recipes" className={styles.ctaPrimary}>
            Browse all recipes
          </Link>
        )}
      </section>

      {/* Recipe grid */}
      <section className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <h2 className={styles.gridTitle}>Recently added</h2>
          {session && (
            <Link href="/recipes" className={styles.viewAll}>
              View all
            </Link>
          )}
        </div>

        {recipes.length === 0 ? (
          <p className={styles.empty}>No recipes yet — be the first to add one!</p>
        ) : (
          <ul className={styles.grid} role="list">
            {recipes.map((recipe: RecipeCardData) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        )}

        {/* Guest CTA below grid */}
        {!session && (
          <div className={styles.guestCta}>
            <p>
              Sign up free to browse the full recipe collection and start saving
              your favorites.
            </p>
            <Link href="/signup" className={styles.ctaPrimary}>
              Get started
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
