/**
 * Admin — Image moderation queue — /admin/images
 *
 * Lists all recipes with coverImageStatus = 'pending_approval'.
 * Approve/Reject actions are handled by AdminImageActions (client component).
 */

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import styles from '../admin.module.css'
import { AdminImageActions } from './AdminImageActions'

export const metadata = { title: 'Admin — Image Queue' }

export default async function AdminImagesPage() {
  await requireAdmin()

  const recipes = await db.recipe.findMany({
    where: { coverImageStatus: 'pending_approval', deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImageUrl: true,
      author: { select: { displayName: true, email: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <>
      <h1 className={styles.pageTitle}>Image Queue ({recipes.length})</h1>
      {recipes.length === 0 ? (
        <p>No images pending review.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {recipes.map((recipe) => (
            <li key={recipe.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {recipe.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={recipe.coverImageUrl} alt={recipe.title} width={160} height={120} style={{ objectFit: 'cover', borderRadius: '4px' }} />
              ) : (
                <div style={{ width: 160, height: 120, background: '#eee', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <strong>{recipe.title}</strong>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  by {recipe.author.displayName ?? recipe.author.email}
                </span>
                <a
                  href={`/recipes/${recipe.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tableLink}
                  style={{ fontSize: '0.875rem' }}
                >
                  View recipe
                </a>
                <AdminImageActions recipeId={recipe.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
