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
import { RecipesFeed } from './RecipesFeed'
import type { RecipeFilters, RecipeSummary } from '@/lib/actions/recipes'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'
import { FEED_PAGE_SIZE } from '@/lib/constants/pagination'
import styles from './recipes.module.css'
import type { Prisma } from '@prisma/client'

interface RecipesPageProps {
  searchParams: Promise<{
    cuisine?: string
    dietary?: string
    tag?: string
  }>
}

async function getRecipes(filters: RecipeFilters): Promise<{
  recipes: RecipeSummary[]
  nextCursor: string | null
}> {
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

  const rows = await db.recipe.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: FEED_PAGE_SIZE + 1,
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

  const hasMore = rows.length > FEED_PAGE_SIZE
  const recipes = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows
  const nextCursor = hasMore ? recipes[recipes.length - 1].id : null

  return { recipes, nextCursor }
}

async function getTags() {
  return db.tag.findMany({ orderBy: { name: 'asc' } })
}

export const metadata = {
  title: 'Recipes',
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const filters = await searchParams
  const [, result, tags] = await Promise.all([
    requireSession(),
    getRecipes(filters),
    getTags(),
  ])

  const { recipes, nextCursor } = result
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
        <RecipesFeed
          initialRecipes={recipes}
          initialCursor={nextCursor}
          filters={filters}
        />
      )}
    </div>
  )
}
