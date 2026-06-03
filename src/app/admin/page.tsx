/**
 * Admin — Recipe moderation — /admin
 *
 * Lists all non-deleted recipes (both published and draft) with quick
 * actions to unpublish or soft-delete.
 */

import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminRecipeActions } from './AdminRecipeActions'
import styles from './admin.module.css'

async function getAllRecipes() {
  return db.recipe.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      cuisine: true,
      createdAt: true,
      author: { select: { displayName: true, email: true } },
      _count: { select: { favorites: true } },
    },
  })
}

export default async function AdminRecipesPage() {
  await requireAdmin()
  const recipes = await getAllRecipes()

  return (
    <>
      <h1 className={styles.pageTitle}>Recipes ({recipes.length})</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Saves</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/recipes/${r.slug}`} className={styles.tableLink}>
                  {r.title}
                </Link>
              </td>
              <td>
                <span title={r.author.email}>{r.author.displayName}</span>
              </td>
              <td>
                <span className={`${styles.badge} ${r.status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                  {r.status}
                </span>
              </td>
              <td>{r._count.favorites}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td>
                <AdminRecipeActions
                  recipeId={r.id}
                  recipeSlug={r.slug}
                  status={r.status}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
