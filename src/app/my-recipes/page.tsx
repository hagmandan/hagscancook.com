/**
 * My Recipes dashboard — /my-recipes
 *
 * Authenticated Server Component. Shows the current user's drafts and
 * published recipes with edit, publish, and delete controls.
 */

import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { RecipeRowActions } from './RecipeRowActions'
import styles from './my-recipes.module.css'

async function getMyRecipes(userId: string) {
  return db.recipe.findMany({
    where: { authorId: userId, deletedAt: null },
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

export const metadata = { title: 'My Recipes' }

export default async function MyRecipesPage() {
  const session = await requireSession()
  const recipes = await getMyRecipes(session.userId)

  const drafts = recipes.filter((r) => r.status === 'draft')
  const published = recipes.filter((r) => r.status === 'published')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Recipes</h1>
        <Link href="/recipes/new" className={styles.newButton}>
          + New recipe
        </Link>
      </div>

      {recipes.length === 0 && (
        <div className={styles.empty}>
          <p>You haven&apos;t added any recipes yet.</p>
          <Link href="/recipes/new" className={styles.emptyLink}>
            Create your first recipe
          </Link>
        </div>
      )}

      {published.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Published ({published.length})</h2>
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
