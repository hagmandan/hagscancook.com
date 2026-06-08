/**
 * My Recipes dashboard — /my-recipes
 *
 * Authenticated Server Component. Shows the current user's drafts (all of
 * them) and published recipes (paginated, 50 per page) with edit, publish,
 * and delete controls.
 */

import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { parsePage } from '@/lib/utils/pagination'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { RecipeRowActions } from './RecipeRowActions'
import styles from './my-recipes.module.css'

const PUBLISHED_PAGE_SIZE = 50

interface MyRecipesPageProps {
  searchParams: Promise<{ page?: string }>
}

async function getDrafts(userId: string) {
  return db.recipe.findMany({
    where: { authorId: userId, deletedAt: null, status: 'draft' },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      cuisine: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { favorites: true } },
    },
  })
}

async function getPublishedPage(userId: string, page: number) {
  return db.recipe.findMany({
    where: { authorId: userId, deletedAt: null, status: 'published' },
    orderBy: { updatedAt: 'desc' },
    take: PUBLISHED_PAGE_SIZE,
    skip: (page - 1) * PUBLISHED_PAGE_SIZE,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      cuisine: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { favorites: true } },
    },
  })
}

export const metadata = { title: 'My Recipes' }

export default async function MyRecipesPage({ searchParams }: MyRecipesPageProps) {
  const session = await requireSession()
  const { page: rawPageParam } = await searchParams
  const rawPage = parsePage(rawPageParam)

  // Fetch drafts and published count in parallel — published page fetch waits
  // for the count so we can clamp rawPage before querying.
  const [drafts, publishedCount] = await Promise.all([
    getDrafts(session.userId),
    db.recipe.count({
      where: { authorId: session.userId, deletedAt: null, status: 'published' },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(publishedCount / PUBLISHED_PAGE_SIZE))
  const page = Math.min(rawPage, totalPages)
  const published = await getPublishedPage(session.userId, page)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Recipes</h1>
        <Link href="/recipes/new" className={styles.newButton}>
          + New recipe
        </Link>
      </div>

      {drafts.length === 0 && publishedCount === 0 && (
        <div className={styles.empty}>
          <p>You haven&apos;t added any recipes yet.</p>
          <Link href="/recipes/new" className={styles.emptyLink}>
            Create your first recipe
          </Link>
        </div>
      )}

      {publishedCount > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Published ({publishedCount})</h2>
          <ul className={styles.list} role="list">
            {published.map((recipe) => (
              <li key={recipe.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <Link href={`/recipes/${recipe.slug}`} className={styles.recipeTitle}>
                    {recipe.title}
                  </Link>
                  <div className={styles.rowMeta}>
                    {recipe.cuisine && <span className={styles.tag}>{recipe.cuisine}</span>}
                    <span className={styles.metaItem}>
                      {recipe._count.favorites} saved
                    </span>
                    <span className={styles.metaItem}>
                      Updated {formatDate(recipe.updatedAt)}
                    </span>
                  </div>
                </div>
                <RecipeRowActions
                  recipeId={recipe.id}
                  recipeSlug={recipe.slug}
                  status="published"
                />
              </li>
            ))}
          </ul>
          <div className={styles.pagination}>
            <PaginationBar
              currentPage={page}
              totalPages={totalPages}
              basePath="/my-recipes"
            />
          </div>
        </section>
      )}

      {drafts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Drafts ({drafts.length})</h2>
          <ul className={styles.list} role="list">
            {drafts.map((recipe) => (
              <li key={recipe.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.recipeTitle}>{recipe.title}</span>
                  <div className={styles.rowMeta}>
                    <span className={styles.draftBadge}>Draft</span>
                    <span className={styles.metaItem}>
                      Updated {formatDate(recipe.updatedAt)}
                    </span>
                  </div>
                </div>
                <RecipeRowActions
                  recipeId={recipe.id}
                  recipeSlug={recipe.slug}
                  status="draft"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
