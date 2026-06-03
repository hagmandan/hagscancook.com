/**
 * Admin layout — wraps all /admin/* pages.
 *
 * Verifies admin role once here (child pages also call requireAdmin for
 * defense in depth). Renders shared admin navigation.
 */

import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import styles from './admin.module.css'

export const metadata = { title: 'Admin' }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarLabel}>Admin</p>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>Recipes</Link>
          <Link href="/admin/users" className={styles.navLink}>Users</Link>
          <Link href="/admin/tags" className={styles.navLink}>Tags</Link>
          <Link href="/admin/ingredients" className={styles.navLink}>Ingredients</Link>
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
