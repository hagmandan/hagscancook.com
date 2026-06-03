/**
 * Admin — Tag management — /admin/tags
 *
 * Lists all tags with recipe counts. Allows adding new tags and deleting
 * unused ones.
 */

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminTagActions } from './AdminTagActions'
import { AdminAddForm } from './AdminAddForm'
import styles from '../admin.module.css'

async function getTags() {
  return db.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { recipes: true } } },
  })
}

export default async function AdminTagsPage() {
  await requireAdmin()
  const tags = await getTags()

  return (
    <>
      <h1 className={styles.pageTitle}>Tags ({tags.length})</h1>

      <AdminAddForm placeholder="Tag name (e.g. Air Fryer)" actionName="createTag" />

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Recipes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag.id}>
              <td style={{ fontWeight: 600 }}>{tag.name}</td>
              <td style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{tag.slug}</td>
              <td>{tag._count.recipes}</td>
              <td>
                <AdminTagActions tagId={tag.id} recipeCount={tag._count.recipes} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
