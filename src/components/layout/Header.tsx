/**
 * Site header.
 *
 * Rendered as a Server Component in `layout.tsx`. The user menu (sign in /
 * sign out / avatar) is a Client Component island (`<UserMenu>`) that reads
 * from `AuthContext` via the `useAuth()` hook.
 */

import Link from 'next/link'
import styles from './Header.module.css'
import { UserMenu } from './UserMenu'
import { PantryNavLink } from './PantryNavLink'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          hags can cook
        </Link>

        <nav className={styles.nav}>
          <Link href="/recipes" className={styles.navLink}>
            Recipes
          </Link>
          <PantryNavLink className={styles.navLink} />
        </nav>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
