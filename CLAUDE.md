# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # seed dev DB then start Next.js dev server (Turbopack)
yarn build        # production build
yarn lint         # ESLint
yarn test         # Vitest (unit/component, jsdom)
yarn test:coverage  # Vitest with coverage report
yarn test:e2e     # Playwright end-to-end (spins up its own dev server with E2E_TEST_AUTH=1)
yarn test:e2e:ui  # Playwright with interactive UI

# Run a single Vitest test file
yarn test src/path/to/file.test.ts

# Database
npx prisma migrate dev    # apply schema changes + regenerate client
npx prisma generate       # regenerate client without migrating
yarn seed:dev             # idempotent dev/E2E fixture seed (also runs on yarn dev)
```

## Architecture

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 + Neon serverless PostgreSQL · Firebase Auth · Sentry · deployed on Firebase App Hosting (Cloud Run).

### Auth — three-layer model

1. **`src/proxy.ts`** (Edge Runtime, formerly middleware) — optimistic redirect if the `__session` cookie is absent. Cannot verify JWTs (no Node.js APIs on Edge).
2. **Server Components** — call `getSession()` (`src/lib/auth.ts`) to fully verify the Firebase session cookie and fetch the user role from DB.
3. **Server Actions** — call `requireSession()` or `requireAdmin()` to re-verify before any mutation. Server Actions are reachable via direct POST and must not trust the proxy alone.

E2E tests bypass Firebase by setting `E2E_TEST_AUTH=1` and a magic cookie value; `getSession()` detects this and returns the seeded `e2e-user` from the DB.

### Database

`src/lib/db.ts` exports a singleton Prisma client using `@prisma/adapter-neon` (HTTP-based, works in serverless). The `globalThis` guard prevents connection pool exhaustion during Next.js hot-reloads.

- `DATABASE_URL` — pooled Neon connection string (runtime queries)
- `DIRECT_URL` — direct Neon connection (migrations only, see `prisma.config.ts`)

### Server Actions pattern

All mutations live in `src/lib/actions/`. Each action:
- Calls `requireSession()` first (re-verifies auth)
- Validates input with Zod using `parseOrError()` from `src/lib/schemas/validation.ts` — do not repeat the `safeParse` boilerplate inline
- Calls `revalidateRecipeFeeds(slug?)` from `src/lib/utils/revalidation.ts` after any recipe mutation — do not call `revalidatePath` for `'/'`, `'/recipes'`, `'/my-recipes'` individually
- Returns `{ data } | { error: string }` on success/failure — never throws to the client

`parseOrError(schema, input, fallbackMessage?)` runs `safeParse` and returns `{ data: T }` on success or `{ error: string }` with the first issue message on failure.

### Recipe form

`RecipeForm` (`src/components/recipe-form/RecipeForm.tsx`) owns a single `useForm()` instance wrapped in `<FormProvider>` and shared between two render modes:
- **Chef mode** — free-form, power-user layout
- **Guided mode** — step-by-step wizard

Mode is controlled by the `?mode=` URL query param. Switching modes never resets the form — RHF v7 keeps unmounted field values by default (`shouldUnregister: false`). The same `RecipeForm` component handles both create (`/recipes/new`) and edit (`/recipes/[slug]/edit`).

Child components (`ChefMode`, `GuidedMode`, `IngredientsField`, `StepsField`) access the form via `useFormContext<RecipeFormValues>()` — do not prop-drill the `form` object. Drag-and-drop list fields use `<SortableList fields onMove>` from `src/components/recipe-form/SortableList.tsx` rather than duplicating dnd-kit setup.

### Robots / crawl policy

`src/app/robots.ts` uses an **allowlist** approach: `Disallow: /` by default, with explicit `Allow` rules for each public route. Any new page that should be publicly indexed must be added to the allowlist — auth-only and admin routes are blocked automatically.

Currently allowed: `/` (home), `/recipes/` (index + detail pages), `/privacy`, `/terms`, `/dmca`, `/_next/static/`, `/_next/image/`, `/sitemap.xml`, and static assets.

Known aggressive scrapers and AI training bots (GPTBot, CCBot, Bytespider, etc.) get a separate `Disallow: /` block. Note that security scanners ignore robots.txt entirely — CDN-level bot blocking (Cloud Armor) is needed for real protection.

### Styling

CSS Modules (`*.module.css`) per component alongside global styles in `src/app/globals.css`. No CSS-in-JS.

### Secrets

Production secrets (DB credentials, Firebase service account, Sentry token) are stored in **Cloud Secret Manager** and referenced in `apphosting.yaml`. For local dev, copy them to `.env` (already gitignored). `FIREBASE_SERVICE_ACCOUNT_KEY` is a base64-encoded service account JSON.

### TypeScript path alias

`@/` maps to `src/` — all imports use this alias.

### Error monitoring — PII policy

`src/lib/monitoring/errors.ts` wraps Sentry's `captureException`. Always import from there, never directly from `@sentry/nextjs`. The wrapper enforces a strict allowlist: only opaque UUIDs, counts, and feature/operation labels may be attached. Never pass recipe content, ingredient names, user emails, display names, or raw search queries to error context.

### Soft-delete pattern

Recipes are never hard-deleted. `Recipe.deletedAt` is the soft-delete signal. All queries against the `Recipe` table must include `where: { deletedAt: null }` unless intentionally fetching deleted records (e.g., admin audit views).

### Canonical ingredient resolution

Use `resolveIngredient(name, typeId?)` from `src/lib/ingredients.ts` whenever a feature needs to reference or create an ingredient. It normalises to lowercase, deduplicates case-insensitively, and defaults new ingredients to the "Produce" type. Do not write raw `db.ingredient.upsert` calls at the feature level.

### Key directories

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — shared UI components (layout, recipe-form, recipe, ui)
- `src/lib/actions/` — Server Actions (recipes, favorites, profile, admin)
- `src/lib/auth.ts` — Firebase Admin session helpers
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/schemas/` — Zod schemas shared between client and server
- `prisma/` — schema, migrations, seed scripts
- `e2e/` — Playwright tests
