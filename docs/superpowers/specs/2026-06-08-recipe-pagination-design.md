# Recipe Pagination Design

**Date:** 2026-06-08
**Status:** Approved

## Summary

Add pagination to the two recipe listing pages:

- `/recipes` — cursor-based "Load More" (discovery feed, unbounded, grows over time)
- `/my-recipes` — offset-based numbered pages, published section only (task-driven, bounded per author)

Page sizes: 20 per load on `/recipes`, 50 per page on `/my-recipes`.

---

## Architecture

### `/recipes` — Cursor-based Load More

**Data fetching:**

`getRecipes(filters, cursor?)` returns `{ recipes, nextCursor }`.

- Fetches `take: 21` rows from the DB. If 21 are returned, slices to 20 and sets `nextCursor` to the last item's `id`. If fewer than 21 are returned, `nextCursor` is `null` (end of feed).
- No separate `COUNT` query — the N+1 trick is sufficient and avoids expensive counts on a growing table.
- Cursor is the `id` (UUID) of the last recipe in the current result set. Prisma's native `cursor: { id }` + `skip: 1` handles keyset navigation.
- Sort order: `[{ createdAt: 'desc' }, { id: 'desc' }]` — composite ensures stable ordering when `createdAt` timestamps collide.
- Filters (`cuisine`, `dietary`, `tag`) are passed through to both the initial fetch and the Server Action.

**Filter + cursor interaction:**

The existing filter form does a full `GET` request, which resets all URL params. Changing a filter naturally resets to page 1 — no special handling required.

**Components:**

- `src/app/recipes/page.tsx` — Server Component. Fetches first 20 recipes, passes them + `nextCursor` + active filters down to `RecipesFeed`.
- `src/app/recipes/RecipesFeed.tsx` — New thin Client Component. Holds accumulated recipes and current cursor in React state. Renders the recipe grid and "Load more" button. Calls the Server Action on click.
- `src/lib/actions/recipes.ts` — New `loadMoreRecipes(cursor: string, filters: RecipeFilters)` Server Action. Re-verifies session, queries next batch, returns `{ recipes, nextCursor }`.

**Initial render is fully server-rendered** — no client JS waterfalls on first paint. `RecipesFeed` is the minimal Client Component boundary needed for append behavior.

---

### `/my-recipes` — Offset-based Numbered Pages (Published Only)

**Data fetching:**

Split into two separate queries:

- `getDrafts(userId)` — fetches all drafts, no pagination. Authors typically have few drafts and expect to see them all.
- `getPublishedPage(userId, page)` — fetches `take: 50, skip: (page - 1) * 50` published recipes, plus a `COUNT` of total published for the pagination bar.

**`?page` URL param:**

- Read from `searchParams` in the Server Component.
- Non-numeric or missing → treated as page 1.
- Out-of-range (< 1 or > maxPage) → clamped server-side before querying.

**Components:**

- `src/app/my-recipes/page.tsx` — updated to read `?page`, call both query helpers, pass total page count to `PaginationBar`.
- `src/components/ui/PaginationBar.tsx` — New shared UI component. Renders Prev/Next links (and optionally "Page X of Y" label). Pure server-rendered anchor tags — no JS required.

---

## Database

**New index (Prisma migration):**

```prisma
@@index([status, deletedAt, createdAt, id])
```

Added to the `Recipe` model. Enables index-only scans for the `/recipes` feed query at any cursor depth. Without this, Postgres falls back to a sequential scan as the table grows.

The existing `@@index([authorId])` on `Recipe` already covers the `/my-recipes` query efficiently.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/app/recipes/page.tsx` | Update `getRecipes()` to accept `cursor?`, return `{ recipes, nextCursor }` |
| `src/app/recipes/RecipesFeed.tsx` | New Client Component — recipe grid + load more state |
| `src/lib/actions/recipes.ts` | New `loadMoreRecipes(cursor, filters)` Server Action |
| `src/app/my-recipes/page.tsx` | Split query into `getDrafts` + `getPublishedPage`, read `?page` param |
| `src/components/ui/PaginationBar.tsx` | New shared Prev/Next component |
| `prisma/schema.prisma` | Add composite index on `Recipe` |
| `prisma/migrations/` | Migration file for new index |

---

## Error Handling

**`/recipes` load more failure:**
- Server Action error → display inline error near the button ("Couldn't load more — try again").
- Existing results stay visible. User can retry without losing position.

**`/my-recipes` out-of-range page:**
- Clamped to `[1, maxPage]` before the DB query.
- No redirect needed — the correct page renders transparently.
- If the author has 0 published recipes, `maxPage` is 0 — `PaginationBar` does not render and the existing empty state is shown.

---

## Testing

**Vitest unit tests:**
- `loadMoreRecipes` — mock Prisma, assert cursor math and filter passthrough, assert N+1 `hasMore` detection.
- `getPublishedPage` — assert `skip`/`take` math and page clamping logic.

**Playwright E2E:**
- `/recipes`: click "Load more" → new recipe cards append below existing ones.
- `/my-recipes`: click Next → page 2 renders; click Prev → page 1 renders.

---

## Out of Scope

- Infinite scroll (auto-load on scroll) — deferred; "Load more" button is sufficient and simpler.
- Search/full-text filtering — separate feature.
- Sorting controls — separate feature.
- `/favorites` pagination — not addressed in this spec; same patterns apply when needed.
