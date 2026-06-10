'use client'

/**
 * Auth-aware user menu shown in the site header.
 *
 * - Unauthenticated: "Sign in" and "Sign up" links
 * - Authenticated: avatar/display name + dropdown with My Recipes, Favorites,
 *   Profile, and Sign out
 *
 * Reads auth state from `AuthContext` via `useAuth()`.
 */

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from './Providers'
import { UserAvatar } from '@/components/ui/UserAvatar'
import styles from './UserMenu.module.css'

export function UserMenu() {
  const { user, loading, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  if (loading) {
    // Prevent layout shift while auth state resolves
    return <div className={styles.skeleton} aria-hidden />
  }

  if (!user) {
    return (
      <div className={styles.guestActions}>
        <Link href="/login" className={styles.signIn}>
          Sign in
        </Link>
        <Link href="/signup" className={styles.signUp}>
          Sign up
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.userMenu}>
      <details ref={dropdownRef} className={styles.dropdown} open={isOpen}>
        <summary
          className={styles.trigger}
          aria-label="User menu"
          onClick={(event) => {
            event.preventDefault()
            setIsOpen((open) => !open)
          }}
        >
          <UserAvatar
            photoURL={user.photoURL}
            displayName={user.displayName}
            email={user.email}
            size={32}
            className={styles.avatar}
            fallbackClassName={styles.avatarFallback}
          />
          <span className={styles.displayName}>{user.displayName}</span>
        </summary>

        <ul className={styles.menu} role="menu">
          <li role="none">
            <Link href="/favorites" className={styles.menuItem} role="menuitem" onClick={() => setIsOpen(false)}>
              Favorites
            </Link>
          </li>
          <li role="none">
            <Link href="/profile" className={styles.menuItem} role="menuitem" onClick={() => setIsOpen(false)}>
              Profile
            </Link>
          </li>
          <li role="separator" className={styles.divider} />
          <li role="none">
            <button
              onClick={() => {
                setIsOpen(false)
                void logout()
              }}
              className={styles.menuItem}
              role="menuitem"
              type="button"
            >
              Sign out
            </button>
          </li>
        </ul>
      </details>
    </div>
  )
}
