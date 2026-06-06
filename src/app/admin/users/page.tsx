/**
 * Admin — User management — /admin/users
 *
 * Lists all users with their current role and a role-change dropdown.
 */

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminRoleSelect } from './AdminRoleSelect'
import styles from '../admin.module.css'

async function getAllUsers() {
  return db.user.findMany({
    orderBy: { createdAt: 'asc' },
    take: 500,
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { recipes: true } },
    },
  })
}

export const metadata = { title: 'Admin — Users' }

export default async function AdminUsersPage() {
  const session = await requireAdmin()
  const users = await getAllUsers()

  return (
    <>
      <h1 className={styles.pageTitle}>Users ({users.length})</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Recipes</th>
            <th>Joined</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ fontWeight: 600 }}>{user.displayName}</td>
              <td style={{ color: '#6b7280' }}>{user.email}</td>
              <td>{user._count.recipes}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <AdminRoleSelect
                  userId={user.id}
                  currentRole={user.role}
                  // Prevent admins from demoting themselves
                  disabled={user.id === session.userId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
