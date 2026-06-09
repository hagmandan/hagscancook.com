/**
 * Site header.
 *
 * Rendered as a Server Component in `layout.tsx`. The user menu (sign in /
 * sign out / avatar) is a Client Component island (`<UserMenu>`) that reads
 * from `AuthContext` via the `useAuth()` hook. MobileMenu is a Client
 * Component that owns the hamburger + slide-out drawer on narrow viewports.
 */

import Link from 'next/link'
import styles from './Header.module.css'
import { UserMenu } from './UserMenu'
import { AuthNavLinks } from './AuthNavLinks'
import { ThemeToggle } from './ThemeToggle'
import { MobileMenu } from './MobileMenu'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          HagsCanCook
        </Link>

        <nav className={styles.nav}>
          <div className={styles.navLeft}>
            <Link href="/recipes" className={styles.navLink}>
              Recipes
            </Link>
          </div>
          <div className={styles.navRight}>
            <AuthNavLinks className={styles.navLink} />
          </div>
        </nav>

        <ThemeToggle />
        <UserMenu />
        <MobileMenu />
      </div>
    </header>
  )
}
