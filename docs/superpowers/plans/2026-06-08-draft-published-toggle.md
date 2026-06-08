# Draft / Published Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface recipe draft/published status as a first-class toggle on three surfaces — the My Recipes page, the recipe detail page (author only), and the edit form — while cleanly separating visibility control from content-saving.

**Architecture:** Add a single `toggleRecipeStatus` server action that flips status and revalidates paths. A shared `StatusToggle` client component wraps that action with loading/toast UX and is used by both the My Recipes row actions and a new `AuthorStatusBar` on the detail page. The edit form gets a renamed "Save" button (status-neutral) and a conditional "Save and Publish" button (shown only for drafts).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma 7, Vitest + RTL for component tests.

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/lib/actions/recipes.ts` — add `toggleRecipeStatus` export |
| Create | `src/components/recipe/StatusToggle.tsx` |
| Create | `src/components/recipe/StatusToggle.module.css` |
| Create | `src/components/recipe/StatusToggle.test.tsx` |
| Create | `src/components/recipe/AuthorStatusBar.tsx` |
| Create | `src/components/recipe/AuthorStatusBar.module.css` |
| Modify | `src/app/my-recipes/RecipeRowActions.tsx` — replace Publish link with StatusToggle |
| Modify | `src/components/recipe-form/FormHeader.tsx` — rename buttons, conditional Save and Publish |
| Modify | `src/components/recipe-form/RecipeForm.tsx` — add `initialStatus` prop, rename handlers |
| Modify | `src/app/recipes/[slug]/edit/page.tsx` — pass `initialStatus` to RecipeForm |
| Modify | `src/app/recipes/[slug]/page.tsx` — relax draft query for authors, add AuthorStatusBar |

---

### Task 1: Add `toggleRecipeStatus` server action

**Files:**
- Modify: `src/lib/actions/recipes.ts`

- [ ] **Step 1: Add the action at the bottom of `src/lib/actions/recipes.ts`** (after the `deleteRecipe` function, before the closing of the file)

```ts
// ---------------------------------------------------------------------------
// toggleRecipeStatus
// ---------------------------------------------------------------------------

/**
 * Flips a recipe's status between draft and published.
 * Only the recipe's author can call this.
 *
 * @param recipeId - The recipe's UUID
 */
export async function toggleRecipeStatus(
  recipeId: string
): Promise<{ status: 'draft' | 'published' } | { error: string }> {
  const session = await requireSession()

  const existing = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { authorId: true, slug: true, status: true },
  })

  if (!existing) return { error: 'Recipe not found' }
  if (existing.authorId !== session.userId) {
    return { error: 'Not authorised to update this recipe' }
  }

  const newStatus = existing.status === 'published' ? 'draft' : 'published'

  try {
    await db.recipe.update({
      where: { id: recipeId },
      data: { status: newStatus },
    })

    revalidatePath('/my-recipes')
    revalidatePath(`/recipes/${existing.slug}`)
    revalidatePath('/recipes')

    return { status: newStatus }
  } catch (err) {
    captureException(err, {
      feature: 'recipe-status',
      operation: 'toggle',
      recipeId,
      runtime: 'server',
    })
    return { error: 'Failed to update recipe status. Please try again.' }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/recipes.ts
git commit -m "feat: add toggleRecipeStatus server action"
```

---

### Task 2: Create `StatusToggle` component

**Files:**
- Create: `src/components/recipe/StatusToggle.tsx`
- Create: `src/components/recipe/StatusToggle.module.css`
- Create: `src/components/recipe/StatusToggle.test.tsx`

- [ ] **Step 1: Write the failing test** at `src/components/recipe/StatusToggle.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusToggle } from './StatusToggle'

// Mock the server action
vi.mock('@/lib/actions/recipes', () => ({
  toggleRecipeStatus: vi.fn(),
}))

// Mock useToast
vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock CSS modules
vi.mock('./StatusToggle.module.css', () => ({
  default: { toggle: 'toggle', draft: 'draft', published: 'published', loading: 'loading' },
}))

import { toggleRecipeStatus } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'

const mockToggle = vi.mocked(toggleRecipeStatus)

describe('StatusToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Publish" for a draft recipe', () => {
    render(<StatusToggle recipeId="abc" currentStatus="draft" />)
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
  })

  it('renders "Unpublish" for a published recipe', () => {
    render(<StatusToggle recipeId="abc" currentStatus="published" />)
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
  })

  it('calls toggleRecipeStatus with recipeId on click', async () => {
    mockToggle.mockResolvedValue({ status: 'published' })
    render(<StatusToggle recipeId="recipe-123" currentStatus="draft" />)
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(mockToggle).toHaveBeenCalledWith('recipe-123')
  })

  it('updates label to "Unpublish" after successful publish', async () => {
    mockToggle.mockResolvedValue({ status: 'published' })
    render(<StatusToggle recipeId="abc" currentStatus="draft" />)
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
    })
  })

  it('shows error toast on failure', async () => {
    const mockError = vi.fn()
    vi.mocked(useToast).mockReturnValue({ error: mockError, success: vi.fn() } as ReturnType<typeof useToast>)
    mockToggle.mockResolvedValue({ error: 'Failed to update recipe status. Please try again.' })
    render(<StatusToggle recipeId="abc" currentStatus="draft" />)
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith('Error', 'Failed to update recipe status. Please try again.')
    })
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
yarn test src/components/recipe/StatusToggle.test.tsx
```
Expected: FAIL — `Cannot find module './StatusToggle'`

- [ ] **Step 3: Create `src/components/recipe/StatusToggle.module.css`**

```css
.toggle {
  padding: 0.375rem 0.75rem;
  border-radius: 0.4375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.draft {
  border: 1px solid var(--color-brand);
  background-color: var(--color-brand);
  color: var(--color-brand-text);
}

.draft:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
  border-color: var(--color-brand-hover);
}

.published {
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-2);
}

.published:hover:not(:disabled) {
  background-color: var(--color-surface-raised);
  border-color: var(--color-text-4);
}
```

- [ ] **Step 4: Create `src/components/recipe/StatusToggle.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { toggleRecipeStatus } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import styles from './StatusToggle.module.css'

interface StatusToggleProps {
  recipeId: string
  currentStatus: 'draft' | 'published'
}

export function StatusToggle({ recipeId, currentStatus }: StatusToggleProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function handleToggle() {
    setLoading(true)
    const result = await toggleRecipeStatus(recipeId)
    setLoading(false)

    if ('error' in result) {
      toast.error('Error', result.error)
      return
    }

    setStatus(result.status)
    toast.success(
      result.status === 'published' ? 'Published' : 'Moved to drafts',
      result.status === 'published'
        ? 'Your recipe is now live.'
        : 'Your recipe is now hidden from others.'
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`${styles.toggle} ${status === 'published' ? styles.published : styles.draft}`}
    >
      {loading ? '…' : status === 'published' ? 'Unpublish' : 'Publish'}
    </button>
  )
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

```bash
yarn test src/components/recipe/StatusToggle.test.tsx
```
Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/recipe/StatusToggle.tsx src/components/recipe/StatusToggle.module.css src/components/recipe/StatusToggle.test.tsx
git commit -m "feat: add StatusToggle component"
```

---

### Task 3: Create `AuthorStatusBar` component

**Files:**
- Create: `src/components/recipe/AuthorStatusBar.tsx`
- Create: `src/components/recipe/AuthorStatusBar.module.css`

- [ ] **Step 1: Create `src/components/recipe/AuthorStatusBar.module.css`**

```css
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem var(--layout-px);
  background-color: var(--color-surface-raised);
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 0.875rem;
}

.label {
  color: var(--color-text-3);
  font-weight: 500;
}
```

- [ ] **Step 2: Create `src/components/recipe/AuthorStatusBar.tsx`**

```tsx
import { StatusToggle } from './StatusToggle'
import styles from './AuthorStatusBar.module.css'

interface AuthorStatusBarProps {
  recipeId: string
  currentStatus: 'draft' | 'published'
}

export function AuthorStatusBar({ recipeId, currentStatus }: AuthorStatusBarProps) {
  return (
    <div className={styles.bar}>
      <span className={styles.label}>
        {currentStatus === 'published' ? 'Published' : 'Draft — only you can see this'}
      </span>
      <StatusToggle recipeId={recipeId} currentStatus={currentStatus} />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe/AuthorStatusBar.tsx src/components/recipe/AuthorStatusBar.module.css
git commit -m "feat: add AuthorStatusBar component"
```

---

### Task 4: Update `RecipeRowActions` to use `StatusToggle`

**Files:**
- Modify: `src/app/my-recipes/RecipeRowActions.tsx`

- [ ] **Step 1: Replace the "Publish" link with `StatusToggle`**

Replace the entire file contents:

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { deleteRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import { StatusToggle } from '@/components/recipe/StatusToggle'
import styles from './my-recipes.module.css'

interface RecipeRowActionsProps {
  recipeId: string
  recipeSlug: string
  status: 'draft' | 'published'
}

export function RecipeRowActions({ recipeId, recipeSlug, status }: RecipeRowActionsProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteRecipe(recipeId)
    // If deleteRecipe succeeded it called redirect() — component unmounts
    // and we never reach here. If we do reach here, there was an error.
    if ('error' in result) {
      toast.error('Error', 'Could not delete recipe')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className={styles.confirmRow}>
        <span className={styles.confirmText}>Delete this recipe?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={styles.confirmYes}
          type="button"
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className={styles.confirmNo}
          type="button"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className={styles.actions}>
      <Link
        href={`/recipes/${recipeSlug}/edit`}
        className={styles.actionButton}
      >
        Edit
      </Link>
      <StatusToggle recipeId={recipeId} currentStatus={status} />
      <button
        onClick={() => setConfirming(true)}
        className={styles.deleteButton}
        type="button"
      >
        Delete
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/my-recipes/RecipeRowActions.tsx
git commit -m "feat: replace Publish link with StatusToggle in RecipeRowActions"
```

---

### Task 5: Update edit form — rename buttons, add conditional "Save and Publish"

**Files:**
- Modify: `src/components/recipe-form/FormHeader.tsx`
- Modify: `src/components/recipe-form/RecipeForm.tsx`
- Modify: `src/app/recipes/[slug]/edit/page.tsx`

- [ ] **Step 1: Update `FormHeader` props and button rendering**

Replace the entire file `src/components/recipe-form/FormHeader.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { type UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import styles from './FormHeader.module.css'

interface FormHeaderProps {
  form: UseFormReturn<RecipeFormValues>
  onSave: () => void
  onSaveAndPublish: () => void
  isSubmitting: boolean
  initialStatus: 'draft' | 'published'
}

export function FormHeader({
  form,
  onSave,
  onSaveAndPublish,
  isSubmitting,
  initialStatus,
}: FormHeaderProps) {
  const title = form.watch('title')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentMode = searchParams.get('mode') ?? 'chef'

  const chefHref = `${pathname}?mode=chef`
  const guidedHref = `${pathname}?mode=guided`

  return (
    <div className={styles.header}>
      <div className={styles.inner}>
        {/* Back */}
        <Link href="/my-recipes" className={styles.back}>
          ← My Recipes
        </Link>

        {/* Live title */}
        <span className={styles.title}>
          {title || <span className={styles.titlePlaceholder}>Untitled recipe</span>}
        </span>

        {/* Mode toggle */}
        <div className={styles.modeToggle} role="group" aria-label="Form mode">
          <Link
            href={chefHref}
            className={`${styles.modeButton} ${currentMode === 'chef' ? styles.modeActive : ''}`}
            aria-current={currentMode === 'chef' ? 'page' : undefined}
          >
            Chef mode
          </Link>
          <Link
            href={guidedHref}
            className={`${styles.modeButton} ${currentMode === 'guided' ? styles.modeActive : ''}`}
            aria-current={currentMode === 'guided' ? 'page' : undefined}
          >
            Guide me
          </Link>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className={`${styles.draftButton} ${isSubmitting ? styles.loading : ''}`}
          >
            Save
          </button>
          {initialStatus === 'draft' && (
            <button
              type="button"
              onClick={onSaveAndPublish}
              disabled={isSubmitting}
              className={`${styles.publishButton} ${isSubmitting ? styles.loading : ''}`}
            >
              Save and Publish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `RecipeForm` to accept `initialStatus` and use the renamed handlers**

Replace the entire file `src/components/recipe-form/RecipeForm.tsx`:

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecipeSchema, type RecipeFormValues } from '@/lib/schemas/recipe'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import { FormHeader } from './FormHeader'
import { ChefMode } from './ChefMode'
import { GuidedMode } from './GuidedMode'
import styles from './RecipeForm.module.css'

interface RecipeFormProps {
  /** Pre-populated when editing an existing recipe. */
  initialValues?: Partial<RecipeFormValues>
  /** Set when editing — the DB UUID of the recipe being edited. */
  recipeId?: string
  /** The recipe's current status. Defaults to 'draft' for new recipes. */
  initialStatus?: 'draft' | 'published'
  /** All available tags to render in the multi-select. */
  tags: { id: string; name: string }[]
  /** All ingredient types for the per-row type selector. */
  ingredientTypes: { id: string; name: string }[]
}

const DEFAULT_VALUES: RecipeFormValues = {
  title: '',
  description: '',
  coverImageUrl: '',
  prepTimeMins: '',
  cookTimeMins: '',
  servings: '',
  cuisine: '',
  difficulty: '',
  dietaryRestrictions: [],
  cookingMethods: [],
  tagIds: [],
  ingredients: [],
  steps: [],
}

export function RecipeForm({ initialValues, recipeId, initialStatus = 'draft', tags, ingredientTypes }: RecipeFormProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const mode = searchParams.get('mode') ?? 'chef'

  const form = useForm<RecipeFormValues>({
    // Cast suppresses the resolver mismatch between the Zod inferred type and
    // the looser RecipeFormValues type (e.g. dietaryRestrictions string[] vs
    // the specific enum union). The Zod schema still validates correctly at
    // runtime; the server actions re-validate anyway.
    resolver: zodResolver(RecipeSchema) as unknown as Resolver<RecipeFormValues>,
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  })

  const { handleSubmit, formState: { isSubmitting } } = form

  async function onSubmit(data: RecipeFormValues, publish: boolean) {
    const result = recipeId
      ? await updateRecipe(recipeId, data, publish)
      : await createRecipe(data, publish)

    if ('error' in result) {
      toast.error('Error', result.error)
      return
    }

    router.push(`/recipes/${result.slug}`)
  }

  function save() {
    handleSubmit((data) => onSubmit(data, false))()
  }

  function saveAndPublish() {
    handleSubmit((data) => onSubmit(data, true))()
  }

  return (
    <div className={styles.root}>
      <FormHeader
        form={form}
        onSave={save}
        onSaveAndPublish={saveAndPublish}
        isSubmitting={isSubmitting}
        initialStatus={initialStatus}
      />

      {mode === 'guided' ? (
        <GuidedMode form={form} tags={tags} ingredientTypes={ingredientTypes} recipeId={recipeId} />
      ) : (
        <ChefMode form={form} tags={tags} ingredientTypes={ingredientTypes} recipeId={recipeId} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update the edit page to pass `initialStatus`**

In `src/app/recipes/[slug]/edit/page.tsx`, change the `RecipeForm` render call from:

```tsx
  return (
    <RecipeForm
      initialValues={initialValues}
      recipeId={recipe.id}
      tags={tags}
      ingredientTypes={ingredientTypes}
    />
  )
```

to:

```tsx
  return (
    <RecipeForm
      initialValues={initialValues}
      recipeId={recipe.id}
      initialStatus={recipe.status as 'draft' | 'published'}
      tags={tags}
      ingredientTypes={ingredientTypes}
    />
  )
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
yarn test
```
Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/recipe-form/FormHeader.tsx src/components/recipe-form/RecipeForm.tsx src/app/recipes/[slug]/edit/page.tsx
git commit -m "feat: rename Save draft to Save, add conditional Save and Publish button"
```

---

### Task 6: Update recipe detail page — allow authors to view drafts, add `AuthorStatusBar`

**Files:**
- Modify: `src/app/recipes/[slug]/page.tsx`

- [ ] **Step 1: Update the `getRecipe` function to remove the status filter, and protect `generateMetadata`**

In `src/app/recipes/[slug]/page.tsx`, change the `getRecipe` function from:

```ts
async function getRecipe(slug: string) {
  return db.recipe.findFirst({
    where: { slug, status: 'published', deletedAt: null },
    include: {
      author: { select: { displayName: true, avatarUrl: true } },
      steps: { orderBy: { order: 'asc' } },
      recipeIngredients: {
        orderBy: { order: 'asc' },
        include: { ingredient: { select: { name: true } } },
      },
      tags: { include: { tag: true } },
    },
  })
}
```

to:

```ts
async function getRecipe(slug: string) {
  return db.recipe.findFirst({
    where: { slug, deletedAt: null },
    include: {
      author: { select: { displayName: true, avatarUrl: true } },
      steps: { orderBy: { order: 'asc' } },
      recipeIngredients: {
        orderBy: { order: 'asc' },
        include: { ingredient: { select: { name: true } } },
      },
      tags: { include: { tag: true } },
    },
  })
}
```

`generateMetadata` also calls `getRecipe` and currently only returns metadata for published recipes. Since `generateMetadata` has no access to the viewer's session, it must not expose draft recipe titles/descriptions to crawlers. Update `generateMetadata` to keep the `status: 'published'` guard explicitly:

```ts
export async function generateMetadata({ params }: RecipePageProps) {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  // Don't expose metadata for draft recipes — no session available here
  if (!recipe || recipe.status !== 'published') return {}
  // ... rest unchanged
```

- [ ] **Step 2: Add the draft ownership check in `RecipePage`**

In the `RecipePage` function, after the `if (!recipe) notFound()` line, add:

```ts
  // Draft recipes are only visible to their author
  if (recipe.status === 'draft' && session?.userId !== recipe.authorId) notFound()
```

So this section reads:

```ts
  if (!recipe) notFound()
  // Draft recipes are only visible to their author
  if (recipe.status === 'draft' && session?.userId !== recipe.authorId) notFound()
```

- [ ] **Step 3: Add the `AuthorStatusBar` import and render it in the page**

Add the import at the top of `src/app/recipes/[slug]/page.tsx` (alongside the other component imports):

```ts
import { AuthorStatusBar } from '@/components/recipe/AuthorStatusBar'
```

Then in the JSX, insert `AuthorStatusBar` immediately before the `<article>` tag. The relevant section currently reads:

```tsx
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <article className={styles.page}>
```

Change it to:

```tsx
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {session?.userId === recipe.authorId && (
        <AuthorStatusBar
          recipeId={recipe.id}
          currentStatus={recipe.status as 'draft' | 'published'}
        />
      )}
    <article className={styles.page}>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
yarn test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/recipes/[slug]/page.tsx
git commit -m "feat: allow authors to view draft recipes, add AuthorStatusBar"
```

---

### Task 7: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
yarn dev
```

- [ ] **Step 2: Verify My Recipes page**

1. Navigate to `/my-recipes`
2. Confirm draft recipes show a "Publish" button (not a link to the edit form)
3. Confirm published recipes show an "Unpublish" button
4. Click "Publish" on a draft — confirm the row stays in place (no navigation), the button changes to "Unpublish", and a success toast appears
5. Click "Unpublish" — confirm button reverts to "Publish" and toast appears
6. Reload the page — confirm the toggled status persisted

- [ ] **Step 3: Verify recipe detail page for authors**

1. Visit a published recipe you own
2. Confirm the `AuthorStatusBar` appears at the top with "Published" label and an "Unpublish" button
3. Click "Unpublish" — confirm the label changes to "Draft — only you can see this" and the button changes to "Publish"
4. In a separate incognito window, visit the same URL — confirm you get a 404
5. Click "Publish" to restore

- [ ] **Step 4: Verify edit form**

1. Navigate to `/recipes/new`
2. Confirm the header shows "Save" and "Save and Publish" buttons (not "Save draft" / "Publish")
3. Fill in a minimal recipe and click "Save" — confirm it saves as a draft
4. Navigate to the edit page of a draft recipe — confirm both buttons are visible
5. Navigate to the edit page of a published recipe — confirm only "Save" is visible (no "Save and Publish")
6. On a draft edit page, click "Save and Publish" — confirm it redirects to the detail page and the recipe is now published

- [ ] **Step 5: Final test run**

```bash
yarn test
```
Expected: all tests pass.
