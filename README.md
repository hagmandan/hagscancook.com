# HagsCanCook

A community recipe site for home cooks. Browse, create, and share recipes worth cooking.

Built with Next.js 16 App Router, Prisma + Neon PostgreSQL, and Firebase Auth. Deployed on Firebase App Hosting (Cloud Run).

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router · React 19 · TypeScript |
| Styling | Tailwind CSS v4 · CSS Modules |
| Database | Prisma 7 + Neon (serverless PostgreSQL) |
| Auth | Firebase Auth (Google SSO + email/password) |
| Error monitoring | Sentry |
| Hosting | Firebase App Hosting (Cloud Run) |
| Testing | Vitest (unit/component) · Playwright (E2E) |

---

## Getting started

### Prerequisites

- Node.js 20+
- Yarn
- A [Neon](https://neon.tech) database (or local PostgreSQL)
- A [Firebase project](https://console.firebase.google.com) with Authentication enabled

### 1. Clone and install

```bash
git clone <repo-url>
cd hagscancook.com
yarn install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```
# Neon PostgreSQL
DATABASE_URL=postgresql://...         # pooled connection (runtime)
DIRECT_URL=postgresql://...           # direct connection (migrations only)

# Firebase Admin — server-side session verification
# Generate: base64 -i serviceAccountKey.json | tr -d '\n'
FIREBASE_SERVICE_ACCOUNT_KEY=<base64-encoded JSON>

# Firebase Client — browser-side config (safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# App
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Sentry variables (`SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`) are optional for local development.

### 3. Set up the database

```bash
npx prisma migrate dev   # apply migrations and generate the Prisma client
yarn seed:dev            # seed dev fixtures (recipes, users, tags)
```

### 4. Start the dev server

```bash
yarn dev                 # seeds dev DB then starts Next.js with Turbopack
```

Open [http://localhost:3000](http://localhost:3000).

---

## Commands

```bash
yarn dev              # seed dev DB + start Next.js dev server (Turbopack)
yarn build            # production build
yarn lint             # ESLint
yarn test             # Vitest (unit/component, jsdom)
yarn test:coverage    # Vitest with coverage report
yarn test:e2e         # Playwright E2E (spins up its own dev server)
yarn test:e2e:ui      # Playwright with interactive UI

# Run a single test file
yarn test src/path/to/file.test.ts

# Database
npx prisma migrate dev    # apply schema changes + regenerate client
npx prisma generate       # regenerate client without migrating
yarn seed:dev             # idempotent dev/E2E fixture seed
```

---

## Project structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── (legal)/            # Privacy, terms, DMCA (static pages)
│   ├── admin/              # Admin dashboard (role-gated)
│   ├── api/                # API routes (auth callback, title check)
│   ├── favorites/          # Favorites feed
│   ├── my-recipes/         # Author's recipe management
│   ├── pantry/             # Pantry / ingredient tracker
│   ├── profile/            # User profile settings
│   └── recipes/            # Public recipe feed + detail pages
├── components/
│   ├── layout/             # Header, footer, nav
│   ├── recipe/             # Recipe cards, detail view
│   ├── recipe-form/        # Create/edit form (Chef + Guided modes)
│   └── ui/                 # Shared components (ConfirmButton, UserAvatar, etc.)
├── lib/
│   ├── actions/            # Server Actions (recipes, favorites, admin, profile)
│   ├── auth.ts             # Firebase Admin session helpers
│   ├── badges.ts           # Badge award logic
│   ├── constants/          # Shared constants (pagination, cuisines, etc.)
│   ├── db.ts               # Prisma client singleton
│   ├── hooks/              # Client-side hooks
│   ├── ingredients.ts      # Canonical ingredient resolution
│   ├── monitoring/         # Sentry wrapper (PII-safe captureException)
│   ├── schemas/            # Zod schemas shared between client and server
│   └── utils/              # Helpers (slugify, revalidation, etc.)
└── proxy.ts                # Edge middleware — optimistic auth redirect
```

---

## Architecture

### Auth — three layers

1. **`src/proxy.ts`** (Edge Runtime) — optimistic redirect if the `__session` cookie is absent. Cannot verify JWTs; blocks unauthenticated traffic cheaply.
2. **Server Components** — call `getSession()` to fully verify the Firebase session cookie and load the user's role from the database.
3. **Server Actions** — call `requireSession()` or `requireAdmin()` before any mutation. Server Actions are reachable via direct POST and must not trust the proxy alone.

E2E tests bypass Firebase by setting `E2E_TEST_AUTH=1` and a magic cookie value; `getSession()` detects this and returns the seeded `e2e-user`.

### Server Actions

All mutations live in `src/lib/actions/`. Each action re-verifies auth, validates input with Zod via `parseOrError()`, calls `revalidatePath()` on success, and returns `{ data } | { error: string }` — never throws to the client.

### Soft-delete

Recipes are never hard-deleted. `Recipe.deletedAt` is the signal. Every query against the `Recipe` table must include `where: { deletedAt: null }` unless intentionally fetching deleted records.

### Ingredient canonicalization

Use `resolveIngredient(name, typeId?)` from `src/lib/ingredients.ts` to reference or create ingredients. It normalizes to lowercase and deduplicates case-insensitively. Do not write raw `db.ingredient.upsert` calls at the feature level.

### Error monitoring

Always import `captureException` from `@/lib/monitoring/errors` — never directly from `@sentry/nextjs`. The wrapper enforces a PII allowlist: only opaque UUIDs, counts, and feature/operation labels may be attached.

### Recipe form

`RecipeForm` (`src/components/recipe-form/RecipeForm.tsx`) owns a single `useForm()` instance wrapped in `<FormProvider>`. Two render modes share the same form state:

- **Chef mode** — free-form, power-user layout
- **Guided mode** — step-by-step wizard

Mode is controlled by the `?mode=` URL query param. Switching modes never resets the form.

### ISR / caching

- Sitemap: 24-hour revalidation (`export const revalidate = 86400`)
- Legal pages: permanently static (`export const revalidate = false`)
- Recipe detail: `getRecipe = cache(...)` deduplicates the DB call between `generateMetadata` and the page component within a single request

---

## Data model

11-table PostgreSQL schema:

| Table | Purpose |
|-------|---------|
| `User` | Accounts (Firebase UID, role, display name, avatar) |
| `Recipe` | Recipes with soft-delete (`deletedAt`) |
| `Step` | Ordered recipe steps |
| `Ingredient` | Canonical ingredient registry (deduplicated by name) |
| `IngredientType` | Categories for ingredients (Produce, Dairy, etc.) |
| `RecipeIngredient` | Join: recipe ↔ ingredient with quantity, unit, prep note |
| `Tag` | User-defined recipe tags |
| `RecipeTag` | Join: recipe ↔ tag |
| `Favorite` | User favorites (recipe ↔ user) |
| `PantryItem` | Per-user pantry entries |
| `UserBadge` | Awarded badges with timestamp |

---

## Testing

```bash
yarn test             # all unit + component tests
yarn test:e2e         # E2E against a local dev server (E2E_TEST_AUTH=1)
```

Unit/component tests use Vitest + jsdom. E2E tests use Playwright and bypass Firebase Auth via a seeded test user — no real credentials required.

Coverage:

```bash
yarn test:coverage
```

---

## Deployment

Production secrets (database credentials, Firebase service account, Sentry token) are stored in **Google Cloud Secret Manager** and referenced in `apphosting.yaml`. For local development, copy values to `.env`.

To deploy:

```bash
firebase deploy
```

The app runs on Firebase App Hosting (Cloud Run) with the configuration in `apphosting.yaml`:
- Node.js 20 runtime
- 1 CPU / 1 GiB memory
- 0–5 instances (scales to zero)

---

## Design

Brand guide, color tokens, typography, and component specs are documented in [`docs/brand-guide.md`](docs/brand-guide.md).
