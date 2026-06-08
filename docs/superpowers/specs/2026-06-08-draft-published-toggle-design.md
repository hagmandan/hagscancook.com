# Draft / Published Toggle — Design Spec

**Date:** 2026-06-08
**Status:** Approved

## Overview

Recipes already have a `status` field (`draft` | `published`) in the database. Currently, status is only settable through the edit form's "Save draft" / "Publish" two-button pattern. This feature surfaces status control as a first-class toggle in three places, cleanly separating visibility from content-saving.

---

## Behavior

### Visibility rule (unchanged)
- `published` recipes are visible to all users on the public feed and recipe detail pages.
- `draft` recipes are only accessible to their author (via My Recipes and a direct URL while authenticated). As soon as a recipe is set to `draft`, it disappears from public feeds.

---

## Surface 1: Edit Form (`FormHeader`)

**Current:** Two buttons — "Save draft" (saves + ensures `draft`) and "Publish" (saves + sets `published`).

**New:**
- **"Save"** — saves all form content without touching status. Replaces "Save draft". Behavior is identical to the old "Save draft" except it is truly status-neutral on edits (for new recipes it still defaults to `draft` via the schema default).
- **"Save and Publish"** — saves all form content AND sets `status: published`. Conditionally rendered: shown only when the current recipe is a draft (i.e., `initialStatus === 'draft'`). Once published, this button disappears — "Save" is the only action needed.

No toggle in the form header itself. The form is for editing content; the other two surfaces handle quick status flipping.

---

## Surface 2: My Recipes Page (`RecipeRowActions`)

**Current:** Draft rows have an "Edit" link + a "Publish" link (navigates to edit form with `?publish=1`). Published rows have only "Edit" and "Delete".

**New:** Both draft and published rows get an inline `StatusToggle` component — a single button that reads "Publish" (for drafts) or "Unpublish" (for published). Clicking it calls `toggleRecipeStatus` server action directly, no navigation. The page revalidates and the row updates in place.

The "Publish" link that navigated to the edit form is removed.

---

## Surface 3: Recipe Detail Page (`/recipes/[slug]`)

An author-only `AuthorStatusBar` component is rendered at the top of the recipe detail page when `session.userId === recipe.authorId`. It shows the current status and a `StatusToggle` button.

The detail page currently 404s for drafts (`where: { status: 'published' }`). This query is relaxed so authors can view their own drafts at the direct URL. Non-authors still get a 404 for draft recipes.

---

## New Server Action: `toggleRecipeStatus`

```ts
// src/lib/actions/recipes.ts
async function toggleRecipeStatus(recipeId: string): Promise<{ status: RecipeStatus } | { error: string }>
```

- Calls `requireSession()`.
- Verifies `authorId === session.userId` (owners only; admins can use the admin panel).
- Flips `draft → published` or `published → draft`.
- Calls `revalidatePath` on `/my-recipes`, `/recipes/[slug]`, and `/recipes`.
- Returns the new status on success, `{ error }` on failure.

---

## New Shared Component: `StatusToggle`

```ts
// src/components/recipe/StatusToggle.tsx
interface StatusToggleProps {
  recipeId: string
  currentStatus: 'draft' | 'published'
}
```

- Client Component.
- Calls `toggleRecipeStatus` and shows a loading state while pending.
- Shows a toast on success ("Recipe published" / "Recipe moved to drafts") and on error.
- Used by both `RecipeRowActions` (My Recipes) and `AuthorStatusBar` (detail page).

---

## New Component: `AuthorStatusBar`

```ts
// src/components/recipe/AuthorStatusBar.tsx
interface AuthorStatusBarProps {
  recipeId: string
  currentStatus: 'draft' | 'published'
}
```

- Thin wrapper around `StatusToggle` with a label ("Viewing as author").
- Server Component that renders `StatusToggle` as a client island.
- Positioned at the top of the recipe detail page, visually distinct (e.g., a subtle banner).

---

## Data / Query Changes

| Location | Change |
|---|---|
| `src/app/recipes/[slug]/page.tsx` | Relax `where` clause: if the viewer is the author, allow `draft` status. Otherwise keep `status: 'published'` filter. |
| `src/lib/actions/recipes.ts` | Add `toggleRecipeStatus`. Rename `publish` param semantics in `createRecipe` / `updateRecipe` to reflect "Save and Publish" — no logic change needed, just naming in callers. |

---

## Out of Scope

- Admin ability to publish/unpublish other users' recipes (handled in admin panel separately).
- Scheduled publishing.
- A "publish" step in the Guided mode wizard (future).
