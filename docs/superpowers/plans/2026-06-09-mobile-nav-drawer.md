# Mobile Nav Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hamburger-triggered slide-out drawer on mobile (< 640px) that replaces the header nav links and hides the user's display name.

**Architecture:** A new `MobileMenu` Client Component owns all drawer state and is dropped into the existing Server Component `Header`. Desktop layout is unchanged. Three CSS-only tweaks hide the desktop nav and username on mobile.

**Tech Stack:** Next.js 15 App Router, React 19, CSS Modules, Vitest + React Testing Library, Playwright E2E.

---

## File Map

| Action | File |
|--------|------|
| Create | `src/components/layout/MobileMenu.tsx` |
| Create | `src/components/layout/MobileMenu.module.css` |
| Create | `src/components/layout/MobileMenu.test.tsx` |
| Modify | `src/components/layout/Header.tsx` |
| Modify | `src/components/layout/Header.module.css` |
| Modify | `src/components/layout/UserMenu.module.css` |

---

### Task 1: MobileMenu component (TDD)

**Files:**
- Create: `src/components/layout/MobileMenu.test.tsx`
- Create: `src/components/layout/MobileMenu.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/layout/MobileMenu.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('./Providers', () => ({ useAuth: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { MobileMenu } from './MobileMenu'
import { useAuth } from './Providers'

const mockLogout = vi.fn()
const authedUser = { displayName: 'Dan', email: 'dan@test.com', photoURL: null }

describe('MobileMenu', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: authedUser as never,
      loading: false,
      logout: mockLogout,
    })
  })

  it('renders a hamburger button', () => {
    render(<MobileMenu />)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('drawer is absent initially', () => {
    render(<MobileMenu />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens drawer when hamburger is clicked', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows Recipes, My Recipes, My Pantry and Sign out when authenticated', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('link', { name: 'Recipes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Recipes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Pantry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows Sign in and Sign up for guests, no auth-only links', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: mockLogout })
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Recipes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Pantry' })).not.toBeInTheDocument()
  })

  it('closes drawer when backdrop is clicked', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fireEvent.click(document.querySelector('[data-testid="mobile-backdrop"]')!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes drawer on Escape key', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('updates aria-label and aria-expanded when open', () => {
    render(<MobileMenu />)
    const btn = screen.getByRole('button', { name: /open menu/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
yarn test src/components/layout/MobileMenu.test.tsx
```

Expected: all tests fail with "Cannot find module './MobileMenu'".

- [ ] **Step 3: Implement MobileMenu component**

Create `src/components/layout/MobileMenu.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './Providers'
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
        <span />
        <span />
        <span />
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
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User avatar'}
                    className={styles.drawerAvatar}
                    width={36}
                    height={36}
                  />
                ) : (
                  <span className={styles.drawerAvatarFallback}>
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </span>
                )}
                <span className={styles.drawerName}>{user.displayName}</span>
              </div>
            )}

            <nav>
              <Link href="/recipes" className={styles.drawerLink}>Recipes</Link>
              {!loading && user && (
                <>
                  <Link href="/my-recipes" className={styles.drawerLink}>My Recipes</Link>
                  <Link href="/pantry" className={styles.drawerLink}>My Pantry</Link>
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
yarn test src/components/layout/MobileMenu.test.tsx
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/MobileMenu.tsx src/components/layout/MobileMenu.test.tsx
git commit -m "feat: add MobileMenu component with slide-out drawer"
```

---

### Task 2: MobileMenu styles

**Files:**
- Create: `src/components/layout/MobileMenu.module.css`

- [ ] **Step 1: Create the stylesheet**

Create `src/components/layout/MobileMenu.module.css`:

```css
/* Hamburger button — only shown on mobile */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 6px;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem;
  flex-shrink: 0;
  transition: background-color 0.15s ease;
}

.hamburger:hover {
  background-color: var(--color-surface-raised);
}

.hamburger span {
  display: block;
  width: 20px;
  height: 2px;
  background-color: var(--color-text-2);
  border-radius: 2px;
}

@media (max-width: 639px) {
  .hamburger {
    display: flex;
  }
}

/* Backdrop */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 55;
}

/* Drawer panel */
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100dvh;
  width: min(280px, 75vw);
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  z-index: 60;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 0;
  overflow-y: auto;
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

/* User section at top of drawer */
.drawerUser {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border-subtle);
  margin-bottom: 0.5rem;
}

.drawerAvatar {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

.drawerAvatarFallback {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background-color: var(--color-brand);
  color: var(--color-brand-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.drawerName {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Nav links and action buttons share the same look */
.drawerLink {
  display: block;
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-2);
  text-decoration: none;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.drawerLink:hover {
  background-color: var(--color-surface-raised);
  color: var(--color-text);
}

.drawerDivider {
  height: 1px;
  background-color: var(--color-border-subtle);
  margin: 0.5rem 0;
}
```

- [ ] **Step 2: Verify tests still pass (CSS Modules are mocked in jsdom — this is a no-op check)**

```bash
yarn test src/components/layout/MobileMenu.test.tsx
```

Expected: 8 passed.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/MobileMenu.module.css
git commit -m "feat: add MobileMenu styles with slide-in animation"
```

---

### Task 3: Wire MobileMenu into Header + hide desktop nav on mobile

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Header.module.css`

- [ ] **Step 1: Add MobileMenu to Header**

Replace the contents of `src/components/layout/Header.tsx` with:

```tsx
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
```

- [ ] **Step 2: Hide the desktop nav on mobile in Header.module.css**

The existing mobile block already shrinks the logo and inner height. Extend it to also hide `.nav`:

Find this block in `src/components/layout/Header.module.css`:

```css
@media (max-width: 639px) {
  .inner {
    gap: 0.5rem;
    height: 3rem;
  }

  .logo {
    width: 120px;
    height: 34px;
  }
}
```

Replace with:

```css
@media (max-width: 639px) {
  .inner {
    gap: 0.5rem;
    height: 3rem;
  }

  .logo {
    width: 120px;
    height: 34px;
  }

  .nav {
    display: none;
  }
}
```

- [ ] **Step 3: Build to confirm no TypeScript errors**

```bash
yarn build 2>&1 | tail -5
```

Expected: build completes with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Header.module.css
git commit -m "feat: wire MobileMenu into header, hide desktop nav on mobile"
```

---

### Task 4: Hide UserMenu display name on mobile

**Files:**
- Modify: `src/components/layout/UserMenu.module.css`

- [ ] **Step 1: Add mobile rule to UserMenu.module.css**

Append to the end of `src/components/layout/UserMenu.module.css`:

```css
@media (max-width: 639px) {
  .displayName {
    display: none;
  }
}
```

- [ ] **Step 2: Verify build is still clean**

```bash
yarn build 2>&1 | tail -5
```

Expected: success with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/UserMenu.module.css
git commit -m "feat: hide display name in UserMenu on mobile"
```

---

## Verification

1. **Unit tests:** `yarn test src/components/layout/MobileMenu.test.tsx` — 8 tests pass
2. **Build:** `yarn build` — no TypeScript errors
3. **Manual (mobile viewport in browser):**
   - At < 640px: nav links gone, username gone, hamburger visible
   - Tap hamburger → drawer slides in from right
   - Authenticated: shows avatar + name, Recipes, My Recipes, My Pantry, Sign out
   - Guest: shows Recipes, Sign in, Sign up
   - Tap backdrop → drawer closes
   - Press Escape → drawer closes
   - Tap a nav link → drawer closes and navigates
   - At ≥ 640px: hamburger hidden, all desktop links visible, username visible
