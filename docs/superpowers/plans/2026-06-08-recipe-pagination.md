# Recipe Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cursor-based "Load More" pagination to `/recipes` and offset-based numbered-page pagination (published section only) to `/my-recipes`.

**Architecture:** `/recipes` uses a `RecipesFeed` Client Component that manages accumulated state and calls a `loadMoreRecipes` Server Action keyed on the last recipe's `id`; the first 20 are server-rendered. `/my-recipes` splits into two DB queries — all drafts (unbounded) and a paginated published section driven by `?page=N` — with a `PaginationBar` UI component that renders pure anchor-tag Prev/Next links, no JS needed.

**Tech Stack:** Next.js 15 App Router, React 19, Prisma 7, Neon PostgreSQL, Vitest, Playwright

---

## File Map

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add composite index on Recipe |
| `src/lib/utils/pagination.ts` | New — `parsePage()` pure utility |
| `src/lib/utils/pagination.test.ts` | New — unit tests for `parsePage` |
| `src/lib/actions/recipes.ts` | Add `loadMoreRecipes`, `RecipeSummary`, `RecipeFilters`, `FEED_PAGE_SIZE` |
| `src/lib/actions/recipes.test.ts` | New — unit tests for `loadMoreRecipes` |
| `src/app/recipes/page.tsx` | Update `getRecipes` (N+1 cursor), pass data to `RecipesFeed` |
| `src/app/recipes/RecipesFeed.tsx` | New Client Component — recipe grid + Load More state |
| `src/app/recipes/recipes.module.css` | Add `.loadMore`, `.loadMoreButton`, `.loadMoreError` |
| `src/components/ui/PaginationBar.tsx` | New — Prev/Next link component |
| `src/components/ui/PaginationBar.module.css` | New — styles for PaginationBar |
| `src/app/my-recipes/page.tsx` | Split query, add `?page` param, render PaginationBar |
| `src/app/my-recipes/my-recipes.module.css` | Add `.pagination` wrapper |
| `prisma/dev-seed.ts` | Add 25 published seed recipes for E2E pagination testing |
| `e2e/pagination.spec.ts` | New — Playwright tests for load more and prev/next |

---

## Task 1: DB Index Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the composite index to the Recipe model**

In `prisma/schema.prisma`, find the Recipe model's existing `@@index([authorId])` line and add the new index directly after it:

```prisma
  @@index([authorId])
  @@index([status, deletedAt, createdAt, id])
  @@map("recipes")
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_recipe_feed_index
```

Expected output ends with: `✓ Generated Prisma Client`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add composite index for recipe feed cursor pagination"
```

---

## Task 2: parsePage Utility + Tests

**Files:**
- Create: `src/lib/utils/pagination.ts`
- Create: `src/lib/utils/pagination.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/utils/pagination.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parsePage } from './pagination'

describe('parsePage', () => {
  it('returns 1 for undefined', () => {
    expect(parsePage(undefined)).toBe(1)
  })

  it('returns 1 for a non-numeric string', () => {
    expect(parsePage('abc')).toBe(1)
  })

  it('returns 1 for zero', () => {
    expect(parsePage('0')).toBe(1)
  })

  it('returns 1 for negative numbers', () => {
    expect(parsePage('-3')).toBe(1)
  })

  it('parses valid page numbers', () => {
    expect(parsePage('1')).toBe(1)
    expect(parsePage('5')).toBe(5)
    expect(parsePage('100')).toBe(100)
  })
})
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
yarn test src/lib/utils/pagination.test.ts
```

Expected: `Error: Failed to resolve import "./pagination"`

- [ ] **Step 3: Implement parsePage**

Create `src/lib/utils/pagination.ts`:

```typescript
export function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10)
  return Number.isNaN(n) || n < 1 ? 1 : n
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
yarn test src/lib/utils/pagination.test.ts
```

Expected: `5 tests | 5 passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/pagination.ts src/lib/utils/pagination.test.ts
git commit -m "feat: add parsePage utility for URL page param parsing"
```

---

## Task 3: loadMoreRecipes Server Action + Tests

**Files:**
- Modify: `src/lib/actions/recipes.ts`
- Create: `src/lib/actions/recipes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/actions/recipes.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    recipe: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn().mockResolvedValue({ userId: 'user-1', role: 'user' }),
}))

vi.mock('@/lib/monitoring/errors', () => ({
  captureException: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { loadMoreRecipes } from './recipes'
import { db } from '@/lib/db'

const mockFindMany = vi.mocked(db.recipe.findMany)

function makeRecipe(id: string) {
  return {
    id,
    slug: `recipe-${id}`,
    title: `Recipe ${id}`,
    description: 'A recipe',
    coverImageUrl: null,
    prepTimeMins: null,
    cookTimeMins: null,
    servings: null,
    cuisine: null,
    author: { displayName: 'Chef' },
  }
}

describe('loadMoreRecipes', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  it('returns recipes and null nextCursor when fewer than 20 results come back', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => makeRecipe(String(i)))
    mockFindMany.mockResolvedValue(rows)

    const result = await loadMoreRecipes('cursor-id', {})

    expect(result.recipes).toHaveLength(5)
    expect(result.nextCursor).toBeNull()
  })

  it('slices to 20 and sets nextCursor when 21 rows come back', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => makeRecipe(String(i)))
    mockFindMany.mockResolvedValue(rows)

    const result = await loadMoreRecipes('cursor-id', {})

    expect(result.recipes).toHaveLength(20)
    expect(result.nextCursor).toBe('19')
  })

  it('queries with cursor and skip:1', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc-cursor', {})

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'abc-cursor' },
        skip: 1,
        take: 21,
      })
    )
  })

  it('passes cuisine filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { cuisine: 'Italian' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cuisine: 'Italian' }),
      })
    )
  })

  it('passes dietary filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { dietary: 'Vegan' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dietaryRestrictions: { has: 'Vegan' },
        }),
      })
    )
  })
})
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
yarn test src/lib/actions/recipes.test.ts
```

Expected: `Error: loadMoreRecipes is not a function` (or similar — the export doesn't exist yet)

- [ ] **Step 3: Add exports and loadMoreRecipes to recipes.ts**

In `src/lib/actions/recipes.ts`, add the following imports at the top of the file (after the existing imports):

```typescript
import type { Prisma } from '@prisma/client'
```

Then add this block at the end of the file:

```typescript
// ---------------------------------------------------------------------------
// loadMoreRecipes
// ---------------------------------------------------------------------------

export const FEED_PAGE_SIZE = 20

export type RecipeFilters = {
  cuisine?: string
  dietary?: string
  tag?: string
}

export type RecipeSummary = {
  id: string
  slug: string
  title: string
  description: string
  coverImageUrl: string | null
  prepTimeMins: number | null
  cookTimeMins: number | null
  servings: number | null
  cuisine: string | null
  author: { displayName: string }
}

export type RecipePage = {
  recipes: RecipeSummary[]
  nextCursor: string | null
}

export async function loadMoreRecipes(
  cursor: string,
  filters: RecipeFilters
): Promise<RecipePage> {
  await requireSession()

  const where: Prisma.RecipeWhereInput = {
    status: 'published',
    deletedAt: null,
    ...(filters.cuisine ? { cuisine: filters.cuisine } : {}),
    ...(filters.dietary ? { dietaryRestrictions: { has: filters.dietary } } : {}),
    ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
  }

  const rows = await db.recipe.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: FEED_PAGE_SIZE + 1,
    cursor: { id: cursor },
    skip: 1,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImageUrl: true,
      prepTimeMins: true,
      cookTimeMins: true,
      servings: true,
      cuisine: true,
      author: { select: { displayName: true } },
    },
  })

  const hasMore = rows.length > FEED_PAGE_SIZE
  const recipes = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows
  const nextCursor = hasMore ? recipes[recipes.length - 1].id : null

  return { recipes, nextCursor }
}
```

- [ ] **Step 4: Run the tests — expect them all to pass**

```bash
yarn test src/lib/actions/recipes.test.ts
```

Expected: `5 tests | 5 passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/recipes.ts src/lib/actions/recipes.test.ts
git commit -m "feat: add loadMoreRecipes Server Action with cursor pagination"
```

---

## Task 4: Update getRecipes in /recipes page

**Files:**
- Modify: `src/app/recipes/page.tsx`

- [ ] **Step 1: Update imports and getRecipes function**

Replace the content of `src/app/recipes/page.tsx` with the following (the filter form, metadata, and page JSX remain the same — only `getRecipes` and the result rendering change):

```typescript
/**
 * Full recipe feed — /recipes
 *
 * Authenticated Server Component. Requires sign-in (proxy.ts redirects guests
 * to /login before this page renders). Shows all published recipes with basic
 * filtering by cuisine, dietary restriction, and tag.
 *
 * Filter state is held in URL search params so filters are shareable and
 * work without client-side JS.
 */

import Link from 'next/link'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { RecipesFeed } from './RecipesFeed'
import { FEED_PAGE_SIZE, type RecipeFilters, type RecipeSummary } from '@/lib/actions/recipes'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'
import styles from './recipes.module.css'
import type { Prisma } from '@prisma/client'

interface RecipesPageProps {
  searchParams: Promise<{
    cuisine?: string
    dietary?: string
    tag?: string
  }>
}

async function getRecipes(filters: RecipeFilters): Promise<{
  recipes: RecipeSummary[]
  nextCursor: string | null
}> {
  const where: Prisma.RecipeWhereInput = {
    status: 'published',
    deletedAt: null,
  }

  if (filters.cuisine) {
    where.cuisine = filters.cuisine
  }

  if (filters.dietary) {
    where.dietaryRestrictions = { has: filters.dietary }
  }

  if (filters.tag) {
    where.tags = { some: { tag: { slug: filters.tag } } }
  }

  const rows = await db.recipe.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: FEED_PAGE_SIZE + 1,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImageUrl: true,
      prepTimeMins: true,
      cookTimeMins: true,
      servings: true,
      cuisine: true,
      author: { select: { displayName: true } },
    },
  })

  const hasMore = rows.length > FEED_PAGE_SIZE
  const recipes = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows
  const nextCursor = hasMore ? recipes[recipes.length - 1].id : null

  return { recipes, nextCursor }
}

async function getTags() {
  return db.tag.findMany({ orderBy: { name: 'asc' } })
}

export const metadata = {
  title: 'Recipes',
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const filters = await searchParams
  const [, result, tags] = await Promise.all([
    requireSession(),
    getRecipes(filters),
    getTags(),
  ])

  const { recipes, nextCursor } = result
  const hasFilters = !!(filters.cuisine || filters.dietary || filters.tag)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Recipes</h1>
        <Link href="/recipes/new" className={styles.newButton}>
          + New recipe
        </Link>
      </div>

      {/* Filters */}
      <form className={styles.filters} method="get">
        <select
          name="cuisine"
          defaultValue={filters.cuisine ?? ''}
          className={styles.filterSelect}
          aria-label="Filter by cuisine"
        >
          <option value="">All cuisines</option>
          {CUISINES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          name="dietary"
          defaultValue={filters.dietary ?? ''}
          className={styles.filterSelect}
          aria-label="Filter by dietary restriction"
        >
          <option value="">Any diet</option>
          {DIETARY_RESTRICTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          name="tag"
          defaultValue={filters.tag ?? ''}
          className={styles.filterSelect}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>

        <button type="submit" className={styles.filterButton}>
          Filter
        </button>

        {hasFilters && (
          <Link href="/recipes" className={styles.clearButton}>
            Clear
          </Link>
        )}
      </form>

      {/* Results */}
      {recipes.length === 0 ? (
        <div className={styles.empty}>
          <p>No recipes found{hasFilters ? ' matching those filters' : ''}.</p>
          {hasFilters && (
            <Link href="/recipes" className={styles.clearLink}>
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <RecipesFeed
          initialRecipes={recipes}
          initialCursor={nextCursor}
          filters={filters}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/recipes/page.tsx
git commit -m "feat: update getRecipes to use cursor N+1 trick, wire RecipesFeed"
```

---

## Task 5: RecipesFeed Client Component

**Files:**
- Create: `src/app/recipes/RecipesFeed.tsx`
- Modify: `src/app/recipes/recipes.module.css`

- [ ] **Step 1: Create RecipesFeed.tsx**

Create `src/app/recipes/RecipesFeed.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import {
  loadMoreRecipes,
  type RecipeFilters,
  type RecipeSummary,
} from '@/lib/actions/recipes'
import styles from './recipes.module.css'

interface RecipesFeedProps {
  initialRecipes: RecipeSummary[]
  initialCursor: string | null
  filters: RecipeFilters
}

export function RecipesFeed({
  initialRecipes,
  initialCursor,
  filters,
}: RecipesFeedProps) {
  const [recipes, setRecipes] = useState(initialRecipes)
  const [cursor, setCursor] = useState(initialCursor)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    if (!cursor) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await loadMoreRecipes(cursor, filters)
        setRecipes((prev) => [...prev, ...result.recipes])
        setCursor(result.nextCursor)
      } catch {
        setError("Couldn't load more — try again")
      }
    })
  }

  return (
    <>
      <ul className={styles.grid} role="list">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard recipe={recipe} />
          </li>
        ))}
      </ul>
      {cursor !== null && (
        <div className={styles.loadMore}>
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className={styles.loadMoreButton}
          >
            {isPending ? 'Loading...' : 'Load more recipes'}
          </button>
          {error && <p className={styles.loadMoreError}>{error}</p>}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Add Load More styles to recipes.module.css**

Append to `src/app/recipes/recipes.module.css`:

```css
/* Load More */
.loadMore {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2.5rem;
}

.loadMoreButton {
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-2);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.loadMoreButton:hover:not(:disabled) {
  background-color: var(--color-surface-raised);
  border-color: var(--color-text-4);
}

.loadMoreButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loadMoreError {
  font-size: 0.875rem;
  color: var(--color-error);
  margin: 0;
}
```

- [ ] **Step 3: Verify build**

```bash
yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/recipes/RecipesFeed.tsx src/app/recipes/recipes.module.css
git commit -m "feat: add RecipesFeed client component with load more"
```

---

## Task 6: PaginationBar Component

**Files:**
- Create: `src/components/ui/PaginationBar.tsx`
- Create: `src/components/ui/PaginationBar.module.css`

- [ ] **Step 1: Create PaginationBar.tsx**

Create `src/components/ui/PaginationBar.tsx`:

```typescript
import Link from 'next/link'
import styles from './PaginationBar.module.css'

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  basePath: string
  extraParams?: Record<string, string>
}

export function PaginationBar({
  currentPage,
  totalPages,
  basePath,
  extraParams = {},
}: PaginationBarProps) {
  if (totalPages <= 1) return null

  function buildHref(page: number) {
    const params = new URLSearchParams({ ...extraParams, page: String(page) })
    return `${basePath}?${params}`
  }

  return (
    <nav className={styles.bar} aria-label="Pagination">
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className={styles.link}>
          ← Previous
        </Link>
      ) : (
        <span className={styles.disabled}>← Previous</span>
      )}
      <span className={styles.label}>
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className={styles.link}>
          Next →
        </Link>
      ) : (
        <span className={styles.disabled}>Next →</span>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Create PaginationBar.module.css**

Create `src/components/ui/PaginationBar.module.css`:

```css
.bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-subtle);
}

.link {
  padding: 0.4375rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-2);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.link:hover {
  background-color: var(--color-surface-raised);
  border-color: var(--color-text-4);
}

.disabled {
  padding: 0.4375rem 0.875rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-4);
  opacity: 0.5;
  cursor: not-allowed;
}

.label {
  font-size: 0.875rem;
  color: var(--color-text-4);
  white-space: nowrap;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/PaginationBar.tsx src/components/ui/PaginationBar.module.css
git commit -m "feat: add PaginationBar component with Prev/Next links"
```

---

## Task 7: Update /my-recipes Page

**Files:**
- Modify: `src/app/my-recipes/page.tsx`
- Modify: `src/app/my-recipes/my-recipes.module.css`

- [ ] **Step 1: Rewrite my-recipes/page.tsx**

Replace the full contents of `src/app/my-recipes/page.tsx`:

```typescript
/**
 * My Recipes dashboard — /my-recipes
 *
 * Authenticated Server Component. Shows the current user's drafts (all of
 * them) and published recipes (paginated, 50 per page) with edit, publish,
 * and delete controls.
 */

import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { parsePage } from '@/lib/utils/pagination'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { RecipeRowActions } from './RecipeRowActions'
import styles from './my-recipes.module.css'

const PUBLISHED_PAGE_SIZE = 50

interface MyRecipesPageProps {
  searchParams: Promise<{ page?: string }>
}

async function getDrafts(userId: string) {
  return db.recipe.findMany({
    where: { authorId: userId, deletedAt: null, status: 'draft' },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      cuisine: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { favorites: true } },
    },
  })
}

async function getPublishedPage(userId: string, page: number) {
  return db.recipe.findMany({
    where: { authorId: userId, deletedAt: null, status: 'published' },
    orderBy: { updatedAt: 'desc' },
    take: PUBLISHED_PAGE_SIZE,
    skip: (page - 1) * PUBLISHED_PAGE_SIZE,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      cuisine: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { favorites: true } },
    },
  })
}

export const metadata = { title: 'My Recipes' }

export default async function MyRecipesPage({ searchParams }: MyRecipesPageProps) {
  const session = await requireSession()
  const { page: rawPageParam } = await searchParams
  const rawPage = parsePage(rawPageParam)

  // Fetch drafts and published count in parallel — published page fetch waits
  // for the count so we can clamp rawPage before querying.
  const [drafts, publishedCount] = await Promise.all([
    getDrafts(session.userId),
    db.recipe.count({
      where: { authorId: session.userId, deletedAt: null, status: 'published' },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(publishedCount / PUBLISHED_PAGE_SIZE))
  const page = Math.min(rawPage, totalPages)
  const published = await getPublishedPage(session.userId, page)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Recipes</h1>
        <Link href="/recipes/new" className={styles.newButton}>
          + New recipe
        </Link>
      </div>

      {drafts.length === 0 && publishedCount === 0 && (
        <div className={styles.empty}>
          <p>You haven&apos;t added any recipes yet.</p>
          <Link href="/recipes/new" className={styles.emptyLink}>
            Create your first recipe
          </Link>
        </div>
      )}

      {publishedCount > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Published ({publishedCount})</h2>
          <ul className={styles.list} role="list">
            {published.map((recipe) => (
              <li key={recipe.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <Link href={`/recipes/${recipe.slug}`} className={styles.recipeTitle}>
                    {recipe.title}
                  </Link>
                  <div className={styles.rowMeta}>
                    {recipe.cuisine && <span className={styles.tag}>{recipe.cuisine}</span>}
                    <span className={styles.metaItem}>
                      {recipe._count.favorites} saved
                    </span>
                    <span className={styles.metaItem}>
                      Updated {formatDate(recipe.updatedAt)}
                    </span>
                  </div>
                </div>
                <RecipeRowActions
                  recipeId={recipe.id}
                  recipeSlug={recipe.slug}
                  status="published"
                />
              </li>
            ))}
          </ul>
          <div className={styles.pagination}>
            <PaginationBar
              currentPage={page}
              totalPages={totalPages}
              basePath="/my-recipes"
            />
          </div>
        </section>
      )}

      {drafts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Drafts ({drafts.length})</h2>
          <ul className={styles.list} role="list">
            {drafts.map((recipe) => (
              <li key={recipe.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.recipeTitle}>{recipe.title}</span>
                  <div className={styles.rowMeta}>
                    <span className={styles.draftBadge}>Draft</span>
                    <span className={styles.metaItem}>
                      Updated {formatDate(recipe.updatedAt)}
                    </span>
                  </div>
                </div>
                <RecipeRowActions
                  recipeId={recipe.id}
                  recipeSlug={recipe.slug}
                  status="draft"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
```

- [ ] **Step 2: Add pagination wrapper style to my-recipes.module.css**

Append to `src/app/my-recipes/my-recipes.module.css`:

```css
.pagination {
  margin-top: 0.5rem;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/my-recipes/page.tsx src/app/my-recipes/my-recipes.module.css
git commit -m "feat: add offset pagination to /my-recipes published section"
```

---

## Task 8: E2E Seed Data + Tests

**Files:**
- Modify: `prisma/dev-seed.ts`
- Create: `e2e/pagination.spec.ts`

- [ ] **Step 1: Add 25 published seed recipes to dev-seed.ts**

In `prisma/dev-seed.ts`, find the section near the bottom where `upsertE2ERecipe()` is called (around line 268). Add a new helper function before that call and invoke it. Add the following function and call it after `upsertE2ERecipe()`:

```typescript
async function upsertPaginationRecipes() {
  const e2eUser = await prisma.user.findUnique({
    where: { email: 'e2e@example.com' },
    select: { id: true },
  })
  if (!e2eUser) return

  for (let i = 1; i <= 25; i++) {
    await prisma.recipe.upsert({
      where: { slug: `e2e-pagination-recipe-${i}` },
      update: {},
      create: {
        slug: `e2e-pagination-recipe-${i}`,
        title: `Pagination Test Recipe ${i}`,
        description: `A simple recipe for pagination testing (${i}).`,
        status: 'published',
        authorId: e2eUser.id,
      },
    })
  }
  console.log('  ✓ 25 pagination test recipes seeded')
}
```

Then add a call to this function in the main seed block alongside the other upserts:

```typescript
await upsertPaginationRecipes()
```

Note: you'll need to find the e2e user's email. Check the seed file around line 80-95 where the e2e user is created — use whatever email address is defined there.

- [ ] **Step 2: Re-run the seed to verify it works**

```bash
yarn seed:dev
```

Expected output includes: `✓ 25 pagination test recipes seeded`

- [ ] **Step 3: Write the E2E tests**

Create `e2e/pagination.spec.ts`:

```typescript
import { expect, test } from '@playwright/test'

const authCookie = {
  name: '__session',
  value: 'e2e-session',
  url: 'http://localhost:3000',
  httpOnly: true,
  sameSite: 'Lax' as const,
}

test.describe('Recipe feed pagination', () => {
  test('shows Load More button when more than 20 recipes exist', async ({
    context,
    page,
  }) => {
    await context.addCookies([authCookie])
    await page.goto('/recipes')

    const cards = page.getByRole('list').getByRole('listitem')
    await expect(cards).toHaveCount(20)

    await expect(
      page.getByRole('button', { name: 'Load more recipes' })
    ).toBeVisible()
  })

  test('Load More appends additional recipe cards', async ({
    context,
    page,
  }) => {
    await context.addCookies([authCookie])
    await page.goto('/recipes')

    await page.getByRole('button', { name: 'Load more recipes' }).click()

    // After loading more, there should be more than 20 cards
    const cards = page.getByRole('list').getByRole('listitem')
    await expect(cards).toHaveCount(25)
  })

  test('Load More button disappears when all recipes are loaded', async ({
    context,
    page,
  }) => {
    await context.addCookies([authCookie])
    await page.goto('/recipes')

    await page.getByRole('button', { name: 'Load more recipes' }).click()

    // All 25 + 1 original e2e recipe = 26 total (fewer than 40), so no more pages
    await expect(
      page.getByRole('button', { name: 'Load more recipes' })
    ).not.toBeVisible()
  })
})
```

- [ ] **Step 4: Run the E2E tests**

```bash
yarn test:e2e e2e/pagination.spec.ts
```

Expected: `3 tests passed`

If the total recipe count in the seed differs from expectations (26), adjust the `toHaveCount` values accordingly.

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
yarn test && yarn test:e2e
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add prisma/dev-seed.ts e2e/pagination.spec.ts
git commit -m "test: add pagination seed data and E2E tests for load more"
```

---

## Self-Review Checklist

- [x] **DB index** — Task 1 adds `@@index([status, deletedAt, createdAt, id])`
- [x] **loadMoreRecipes** — Task 3, tested in Task 3
- [x] **N+1 trick on initial fetch** — Task 4, `getRecipes` uses `take: FEED_PAGE_SIZE + 1`
- [x] **RecipesFeed client component** — Task 5
- [x] **Filter passthrough to Server Action** — Task 3 (action), Task 5 (component passes `filters` prop)
- [x] **parsePage clamping** — Task 2 (utility + tests), Task 7 (used in page)
- [x] **getDrafts (unbounded)** — Task 7
- [x] **getPublishedPage (offset)** — Task 7
- [x] **PaginationBar** — Task 6, rendered in Task 7
- [x] **Zero-published edge case** — Task 7: `publishedCount === 0` check before rendering section + PaginationBar
- [x] **Out-of-range page clamping** — Task 7: `page = Math.min(rawPage, totalPages)`
- [x] **Load more error handling** — Task 5: try/catch in `handleLoadMore`, renders `.loadMoreError`
- [x] **E2E tests** — Task 8
- [x] **FEED_PAGE_SIZE shared constant** — exported from `recipes.ts`, imported in `page.tsx`
