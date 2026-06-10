'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './Providers'
import { UserAvatar } from '@/components/ui/UserAvatar'
import styles from './MobileMenu.module.css'

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className={styles.hamburger}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {!loading && user ? (
          <UserAvatar
            photoURL={user.photoURL}
            displayName={user.displayName}
            size={28}
            alt={user.displayName ?? 'Menu'}
            className={styles.hamburgerAvatar}
            fallbackClassName={styles.hamburgerFallback}
          />
        ) : (
          <>
            <span />
            <span />
            <span />
          </>
        )}
      </button>

      {open && (
        <>
          <div
            className={styles.backdrop}
            data-testid="mobile-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {!loading && user && (
              <div className={styles.drawerUser}>
                <UserAvatar
                  photoURL={user.photoURL}
                  displayName={user.displayName}
                  email={user.email}
                  size={36}
                  className={styles.drawerAvatar}
                  fallbackClassName={styles.drawerAvatarFallback}
                />
                <span className={styles.drawerName}>{user.displayName}</span>
              </div>
            )}

            <nav>
              <Link href="/recipes" className={styles.drawerLink}>Recipes</Link>
              {!loading && user && (
                <>
                  <Link href="/my-recipes" className={styles.drawerLink}>My Recipes</Link>
                  <Link href="/pantry" className={styles.drawerLink}>My Pantry</Link>
                  <Link href="/favorites" className={styles.drawerLink}>Favorites</Link>
                  <Link href="/profile" className={styles.drawerLink}>Profile</Link>
                </>
              )}
            </nav>

            <div className={styles.drawerDivider} />

            {!loading && user ? (
              <button
                type="button"
                className={styles.drawerLink}
                onClick={() => { setOpen(false); void logout() }}
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" className={styles.drawerLink}>Sign in</Link>
                <Link href="/signup" className={styles.drawerLink}>Sign up</Link>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}
