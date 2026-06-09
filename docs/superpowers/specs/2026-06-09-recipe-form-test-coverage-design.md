# Recipe Form Test Coverage Design

**Date:** 2026-06-09
**Status:** Approved

## Overview

Add comprehensive integration tests for the recipe form components (`RecipeForm`, `ChefMode`, `GuidedMode`), which currently sit at 0% coverage. Follow up with shared test infrastructure (phase C) that eliminates duplication across the new and existing test files.

## Approach

Integration-style: render `RecipeForm` as a whole in each test file, mocking only external dependencies (server actions, Next.js router, hooks with external I/O). `ChefMode` and `GuidedMode` are exercised as real children — not mocked or tested in isolation.

Two phases:
1. **Phase A** — Three test files covering `RecipeForm`, `ChefMode`, and `GuidedMode`
2. **Phase C** — Shared test utilities extracted from the patterns that emerge in phase A

## Mocking Strategy

Every recipe-form test file uses the same set of mocks:

| Dependency | Mock |
|---|---|
| `next/navigation` | `useSearchParams` returns a `Map`; `useRouter` returns `{ push: vi.fn() }` |
| `@/lib/actions/recipes` | `createRecipe` / `updateRecipe` resolve to `{ slug: 'test-slug' }` by default |
| `@/lib/toast` | `useToast` returns `{ error: vi.fn(), success: vi.fn() }` |
| `@/lib/hooks/useTitleAvailability` | Returns `{ taken: false }` by default; overridden per test |
| `./useCoverUpload` | Returns `{ isUploading: false, uploadError: null, fileInputRef: { current: null }, handleCoverUpload: vi.fn() }` |
| `react-select` / `react-select/creatable` | Renders as plain `<select>` elements (same mock as `MultiSelect.test.tsx`) |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Same stubs as `IngredientsField.test.tsx` |
| CSS modules | Inline identity mocks per file |

## Phase A — Test Files

### `RecipeForm.test.tsx`

Tests the orchestration layer: mode switching, form state persistence, and submit wiring.

| Test | Assertion |
|---|---|
| Default render | Chef mode renders (title input visible) |
| `?mode=guided` param | Guided mode renders (tab list visible) |
| Mode switch preserves state | Type title in chef mode, switch to guided, value retained |
| Save as draft — create | `createRecipe(data, false)` called; router pushes to slug |
| Save and publish — create | `createRecipe(data, true)` called |
| Save — edit flow | `updateRecipe(recipeId, data, false)` called when `recipeId` prop set |
| Server action error | `toast.error` called; no navigation |
| Submit in-flight | Save button disabled while request is pending |

### `ChefMode.test.tsx`

Renders `RecipeForm` with `?mode=chef`. Covers the single-column + sidebar layout.

| Area | Tests |
|---|---|
| Title | Renders; typing updates char counter; validation error on empty submit |
| Description | Renders; typing updates char counter |
| Timing | Prep, cook, servings inputs render with correct labels |
| Cuisine | Select renders all options; selecting updates form |
| Difficulty | Easy/Medium/Advanced options; selecting updates form |
| Dietary | MultiSelect renders; selecting options calls setValue |
| Cook style | CreatableMultiSelect renders; custom value + Enter adds it |
| Tags | Renders when `tags` prop non-empty; absent when empty |
| Sidebar toggle | Clicking "Details" toggles `aria-expanded`; content visible |
| Cover consent | Upload button disabled until consent checkbox checked |
| Cover banners | `pending_approval` shows review message; `rejected` shows rejection message |
| Title taken | `useTitleAvailability` returning `{ taken: true }` shows duplicate warning |
| Ingredients section | IngredientsField renders (section heading visible) |
| Steps section | StepsField renders (section heading visible) |

### `GuidedMode.test.tsx`

Renders `RecipeForm` with `?mode=guided`. Covers the tabbed wizard and live preview.

| Area | Tests |
|---|---|
| Initial state | "About" tab active; progress bar at 20% |
| Tab navigation | Clicking each tab activates it; progress bar advances |
| Next/Back buttons | Next advances; Back returns; Back hidden on first tab, Next hidden on last |
| About — title | Input renders; char counter; validation error |
| About — description | Textarea renders; char counter |
| About — cover consent | Upload button disabled until consent checked |
| About — cover banners | `pending_approval` / `rejected` banners render |
| About — title taken | Duplicate warning shows |
| Details tab | Timing inputs; cuisine + difficulty selects; dietary + cook style multi-selects; tags |
| Ingredients tab | Navigating to "Ingredients" renders IngredientsField |
| Steps tab | Navigating to "Steps" renders StepsField |
| Preview — empty | Shows "Untitled recipe" when title blank |
| Preview — populated | Reflects title, description, and timing values entered on earlier tabs |

## Phase C — Shared Test Utilities

After phase A, extract the duplicated patterns:

**`src/test-utils/mocks/react-select.tsx`**
Shared `react-select` and `react-select/creatable` mocks. Updates `MultiSelect.test.tsx` and all recipe-form tests to import from here.

**`src/test-utils/mocks/dnd-kit.ts`**
Shared `@dnd-kit/*` stubs. Updates `IngredientsField.test.tsx` and recipe-form tests.

**`src/test-utils/fixtures.ts`**
Shared `validRecipeForm`, `defaultTags`, `defaultIngredientTypes` test data. Consolidates the fixture defined in `recipes.test.ts`.

**`src/test-utils/render-recipe-form.tsx`**
`renderRecipeForm({ mode?, initialValues?, recipeId?, tags?, ingredientTypes?, coverImageStatus? })` — sets up router mock, wraps providers, renders `RecipeForm`. Eliminates render boilerplate from all three test files.

Existing `MultiSelect.test.tsx` and `IngredientsField.test.tsx` are updated to import from the shared modules.

## Out of Scope

- `lib/auth.ts`, `lib/db.ts`, `lib/firebase-client.ts` — infrastructure singletons; not tested here
- `components/layout/Providers.tsx` — context provider tree; not tested here
- `deleteRecipe` action gaps — separate task
- E2E coverage of the recipe form — Playwright tests already cover the happy path
