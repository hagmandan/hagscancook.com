/**
 * Full recipe feed — /recipes
 *
 * Authenticated Server Component. Requires sign-in (proxy.ts redirects guests
 * to /login before this page renders). Shows all published recipes with basic
 * filtering by cuisine, dietary restriction, and tag.
 *
 * Filter state is held in URL search params so filters are shareable and
 * work without client-side JS.
 */

import Link from 'next/link'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'
import styles from './recipes.module.css'
import type { Prisma } from '@prisma/client'

interface RecipesPageProps {
  searchParams: Promise<{
    cuisine?: string
    dietary?: string
    tag?: string
  }>
}

async function getRecipes(filters: {
  cuisine?: string
  dietary?: string
  tag?: string
}) {
  const where: Prisma.RecipeWhereInput = {
    status: 'published',
    deletedAt: null,
  }

  if (filters.cuisine) {
    where.cuisine = filters.cuisine
  }

  if (filters.dietary) {
    where.dietaryRestrictions = { has: filters.dietary }
  }

  if (filters.tag) {
    where.tags = { some: { tag: { slug: filters.tag } } }
  }

  return db.recipe.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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

async function getTags() {
  return db.tag.findMany({ orderBy: { name: 'asc' } })
}

export const metadata = {
  title: 'Recipes',
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const filters = await searchParams
  const [, recipes, tags] = await Promise.all([
    requireSession(),
    getRecipes(filters),
    getTags(),
  ])

  const hasFilters = !!(filters.cuisine || filters.dietary || filters.tag)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Recipes</h1>
        <Link href="/recipes/new" className={styles.newButton}>
          + New recipe
        </Link>
      </div>

      {/* Filters */}
      <form className={styles.filters} method="get">
        <select
          name="cuisine"
          defaultValue={filters.cuisine ?? ''}
          className={styles.filterSelect}
          aria-label="Filter by cuisine"
        >
          <option value="">All cuisines</option>
          {CUISINES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          name="dietary"
          defaultValue={filters.dietary ?? ''}
          className={styles.filterSelect}
          aria-label="Filter by dietary restriction"
        >
          <option value="">Any diet</option>
          {DIETARY_RESTRICTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          name="tag"
          defaultValue={filters.tag ?? ''}
          className={styles.filterSelect}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>

        <button type="submit" className={styles.filterButton}>
          Filter
        </button>

        {hasFilters && (
          <Link href="/recipes" className={styles.clearButton}>
            Clear
          </Link>
        )}
      </form>

      {/* Results */}
      {recipes.length === 0 ? (
        <div className={styles.empty}>
          <p>No recipes found{hasFilters ? ' matching those filters' : ''}.</p>
          {hasFilters && (
            <Link href="/recipes" className={styles.clearLink}>
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className={styles.count}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
          <ul className={styles.grid} role="list">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
