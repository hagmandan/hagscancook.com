# Mobile Nav Drawer Design

## Context

On mobile the header is overcrowded: the logo, three nav links, theme toggle, and user menu all compete for ~430px of width. The fix is a hamburger menu that replaces the nav links on mobile with a slide-out drawer.

## Behaviour

- **≥ 640px (desktop):** no change — existing nav links and UserMenu display name are visible.
- **< 640px (mobile):**
  - Nav links (Recipes, My Recipes, My Pantry) are hidden.
  - UserMenu display name is hidden; only the avatar remains.
  - A hamburger button `☰` appears at the far right of the header.
  - Tapping the hamburger slides a drawer in from the right.
  - Tapping the semi-transparent backdrop or any nav link closes the drawer.

## Drawer Contents (authenticated)

1. User avatar + display name (top of drawer)
2. Recipes
3. My Recipes
4. My Pantry
5. Divider
6. Sign out

## Drawer Contents (guest)

1. Recipes
2. Sign in
3. Sign up

## Architecture

`Header.tsx` stays a Server Component. All interactive mobile behaviour lives in a new **`MobileMenu.tsx`** Client Component that is imported into the header alongside `UserMenu`.

### New files

- `src/components/layout/MobileMenu.tsx` — hamburger button + backdrop + drawer panel; uses `useAuth()` for user info and logout; uses `usePathname()` to close the drawer on route change.
- `src/components/layout/MobileMenu.module.css` — drawer, backdrop, hamburger, and animation styles.

### Modified files

- `src/components/layout/Header.tsx` — add `<MobileMenu />` inside `.inner`.
- `src/components/layout/Header.module.css` — hide `.nav` on `< 640px`; hide `MobileMenu` on `≥ 640px`.
- `src/components/layout/UserMenu.module.css` — hide `.displayName` on `< 640px`.

## CSS / Animation

- Drawer: `position: fixed; top: 0; right: 0; height: 100dvh; width: min(280px, 75vw)`.
- Hidden state: `transform: translateX(100%)`. Open state: `transform: translateX(0)`.
- Transition: `transform 0.25s ease`.
- Backdrop: `position: fixed; inset: 0; background: rgba(0,0,0,0.4)`.
- `z-index` above header (`z-index: 60`).
- No JS animation library needed — pure CSS transition driven by an `open` boolean state.

## Accessibility

- Hamburger button has `aria-label="Open menu"` / `"Close menu"` toggled on state.
- Drawer has `role="dialog"` and `aria-modal="true"`.
- Focus is trapped inside the drawer while open (or at minimum, Escape key closes it).
- `<body>` scroll is locked (`overflow: hidden`) while the drawer is open.
