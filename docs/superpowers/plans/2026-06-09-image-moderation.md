# Image Moderation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-enable user-uploaded recipe cover images behind a pre-moderation gate — images are hidden from the public until an admin approves them, with in-app status shown on the edit page.

**Architecture:** Add a `CoverImageStatus` enum to the `Recipe` model (`pending_approval | approved | rejected`). The server actions set status on save; the recipe detail page guards rendering on `approved`; a new `/admin/images` queue page handles approve/reject. Terms of Service gains an image-specific section and the upload form gains a consent checkbox.

**Tech Stack:** Prisma 7 (enum migration), Next.js 15 App Router (server actions, server components), React 19 (`useState`, `useTransition`), Firebase Storage (upload, unchanged), Vitest (unit tests).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `CoverImageStatus` enum + field on `Recipe` |
| `src/app/(legal)/terms/page.tsx` | Modify | Add §4 Image Uploads section |
| `src/lib/actions/admin.ts` | Modify | Add `approveRecipeImage`, `rejectRecipeImage` |
| `src/lib/actions/admin.test.ts` | Modify | Tests for approve/reject actions |
| `src/lib/actions/recipes.ts` | Modify | Set `coverImageStatus` on create/update |
| `src/lib/actions/recipes.test.ts` | Modify | Tests for image status behavior |
| `src/app/recipes/[slug]/page.tsx` | Modify | Guard image render + OG tags on `approved` |
| `src/app/recipes/[slug]/edit/page.tsx` | Modify | Pass `coverImageStatus` prop to `RecipeForm` |
| `src/components/recipe-form/RecipeForm.tsx` | Modify | Accept + thread `coverImageStatus` prop |
| `src/components/recipe-form/ChefMode.tsx` | Modify | Restore upload UI + consent checkbox + status badge |
| `src/components/recipe-form/ChefMode.module.css` | Modify | Add consent + status badge styles |
| `src/components/recipe-form/GuidedMode.tsx` | Modify | Restore upload UI + consent checkbox + status badge |
| `src/components/recipe-form/GuidedMode.module.css` | Modify | Restore aboutGrid desktop layout; add badge styles |
| `src/app/admin/images/page.tsx` | Create | Admin image queue (pending images list) |
| `src/app/admin/images/AdminImageActions.tsx` | Create | Approve/reject client component |
| `src/app/admin/layout.tsx` | Modify | Add "Images" nav link |

---

## Task 1: Schema — add CoverImageStatus enum

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the enum and field to schema**

In `prisma/schema.prisma`, add the enum after the `RecipeStatus` enum (around line 29):

```prisma
/** Moderation state of a recipe's cover image. */
enum CoverImageStatus {
  pending_approval
  approved
  rejected
}
```

Then on the `Recipe` model, add the field after `coverImageUrl` (line 71):

```prisma
coverImageStatus CoverImageStatus? @map("cover_image_status")
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_cover_image_status
```

Expected output: `Your database is now in sync with your schema.` A new migration file appears under `prisma/migrations/`.

- [ ] **Step 3: Verify the client is regenerated**

```bash
npx prisma generate
```

Expected: no errors. TypeScript now knows about `CoverImageStatus` from `@prisma/client`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add CoverImageStatus enum to Recipe schema"
```

---

## Task 2: Terms of Service — add image upload section

**Files:**
- Modify: `src/app/(legal)/terms/page.tsx`

- [ ] **Step 1: Insert the new section**

In `src/app/(legal)/terms/page.tsx`, find the block starting with `<h2>4. Acceptable Use</h2>` and insert the new section immediately before it. Renumber all following sections by incrementing their numbers (+1 each):

```tsx
      <h2>4. Image Uploads</h2>
      <p>
        When you upload a cover image for a recipe, you represent that:
      </p>
      <ul>
        <li>The image is your own original content or content you have the right to use.</li>
        <li>The image is food or cooking-related and appropriate for all audiences.</li>
        <li>The image does not contain adult content, hate imagery, violence, or copyrighted
          material you do not own.</li>
      </ul>
      <p>
        All uploaded images are reviewed by our team before they appear publicly. We reserve
        the right to reject or remove any image at our sole discretion. Rejected images are
        not deleted from our storage; you may upload a replacement image at any time.
      </p>
```

After inserting, the old §4 "Acceptable Use" becomes §5, §5 "Copyright & DMCA" becomes §6, and so on through §10 "Contact" which becomes §11. Update every `<h2>N.` heading accordingly.

- [ ] **Step 2: Verify the page renders**

```bash
yarn dev
```

Open `http://localhost:3000/terms` and confirm the new section appears between "User-Generated Content" and "Acceptable Use", with correct sequential numbering.

- [ ] **Step 3: Commit**

```bash
git add src/app/(legal)/terms/page.tsx
git commit -m "feat: add image upload content guidelines to Terms of Service"
```

---

## Task 3: Admin image actions (TDD)

**Files:**
- Modify: `src/lib/actions/admin.test.ts`
- Modify: `src/lib/actions/admin.ts`

- [ ] **Step 1: Write failing tests**

At the bottom of the `describe('admin recipe moderation actions', ...)` block in `src/lib/actions/admin.test.ts`, add:

```ts
  it('returns not found when approving a missing recipe', async () => {
    mockRecipeFindUnique.mockResolvedValue(null)

    const result = await approveRecipeImage('recipe-1')

    expect(result).toEqual({ error: 'Recipe not found' })
    expect(mockRecipeUpdate).not.toHaveBeenCalled()
  })

  it('approves a recipe image and revalidates recipe page and queue', async () => {
    const result = await approveRecipeImage('recipe-1')

    expect(result).toEqual({ ok: true })
    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { coverImageStatus: 'approved' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/images')
  })

  it('returns not found when rejecting a missing recipe', async () => {
    mockRecipeFindUnique.mockResolvedValue(null)

    const result = await rejectRecipeImage('recipe-1')

    expect(result).toEqual({ error: 'Recipe not found' })
    expect(mockRecipeUpdate).not.toHaveBeenCalled()
  })

  it('rejects a recipe image and revalidates the queue', async () => {
    const result = await rejectRecipeImage('recipe-1')

    expect(result).toEqual({ ok: true })
    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { coverImageStatus: 'rejected' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/images')
  })
```

Also update the import at the top of the file to include the two new actions:

```ts
import {
  adminDeleteRecipe,
  approveRecipeImage,
  createIngredient,
  createIngredientType,
  createTag,
  deleteTag,
  rejectRecipeImage,
  setUserRole,
  unpublishRecipe,
  updateIngredientType,
} from './admin'
```

- [ ] **Step 2: Run to verify they fail**

```bash
yarn test src/lib/actions/admin.test.ts
```

Expected: 4 new tests fail with `approveRecipeImage is not a function` / `rejectRecipeImage is not a function`.

- [ ] **Step 3: Implement the actions**

In `src/lib/actions/admin.ts`, after the `adminDeleteRecipe` function and before the "User role management" section, add:

```ts
// ---------------------------------------------------------------------------
// Image moderation
// ---------------------------------------------------------------------------

/**
 * Approves a recipe's pending cover image, making it publicly visible.
 */
export async function approveRecipeImage(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { coverImageStatus: 'approved' },
  })
  revalidatePath(`/recipes/${recipe.slug}`)
  revalidatePath('/admin/images')
  return { ok: true }
}

/**
 * Rejects a recipe's pending cover image. The file is kept in Firebase Storage;
 * admin removes manually if needed. The user sees an in-app rejection notice.
 */
export async function rejectRecipeImage(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { coverImageStatus: 'rejected' },
  })
  revalidatePath('/admin/images')
  return { ok: true }
}
```

- [ ] **Step 4: Run to verify they pass**

```bash
yarn test src/lib/actions/admin.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/admin.ts src/lib/actions/admin.test.ts
git commit -m "feat: add admin approve/reject image actions"
```

---

## Task 4: Recipe actions — set coverImageStatus on save (TDD)

**Files:**
- Modify: `src/lib/actions/recipes.test.ts`
- Modify: `src/lib/actions/recipes.ts`

- [ ] **Step 1: Write failing tests**

At the end of the `describe('createRecipe', ...)` block in `src/lib/actions/recipes.test.ts`, add:

```ts
  it('sets coverImageStatus to pending_approval when a cover image is provided', async () => {
    await createRecipe({
      ...validRecipeForm,
      coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/123.jpg',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/123.jpg',
          coverImageStatus: 'pending_approval',
        }),
      })
    )
  })

  it('sets coverImageStatus to null when no cover image provided', async () => {
    await createRecipe(validRecipeForm) // coverImageUrl: ''

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coverImageUrl: null,
          coverImageStatus: null,
        }),
      })
    )
  })
```

At the end of the `describe('updateRecipe', ...)` block, update the existing `findUnique` mock in all `updateRecipe` tests to include `coverImageUrl: null`, then add:

```ts
  it('sets coverImageStatus to pending_approval when a new image URL is saved', async () => {
    mockFindUnique.mockResolvedValue({
      authorId: 'user-1',
      slug: 'lemon-pasta',
      title: 'Lemon Pasta',
      coverImageUrl: null,
    })
    mockRecipeUpdate.mockReturnValue({ query: 'update-recipe' } as never)

    await updateRecipe('recipe-1', {
      ...validRecipeForm,
      coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/456.jpg',
    })

    expect(mockRecipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coverImageStatus: 'pending_approval' }),
      })
    )
  })

  it('preserves image status when the URL is unchanged on save', async () => {
    const existingUrl = 'https://storage.googleapis.com/bucket/covers/uid/456.jpg'
    mockFindUnique.mockResolvedValue({
      authorId: 'user-1',
      slug: 'lemon-pasta',
      title: 'Lemon Pasta',
      coverImageUrl: existingUrl,
    })
    mockRecipeUpdate.mockReturnValue({ query: 'update-recipe' } as never)

    await updateRecipe('recipe-1', { ...validRecipeForm, coverImageUrl: existingUrl })

    // coverImageStatus must NOT be in the update payload — status is preserved
    expect(mockRecipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ coverImageStatus: expect.anything() }),
      })
    )
  })

  it('clears image status when image is removed', async () => {
    mockFindUnique.mockResolvedValue({
      authorId: 'user-1',
      slug: 'lemon-pasta',
      title: 'Lemon Pasta',
      coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/456.jpg',
    })
    mockRecipeUpdate.mockReturnValue({ query: 'update-recipe' } as never)

    await updateRecipe('recipe-1', { ...validRecipeForm, coverImageUrl: '' })

    expect(mockRecipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coverImageStatus: null }),
      })
    )
  })
```

Also update the two existing `updateRecipe` `findUnique` mocks to include `coverImageUrl`:

```ts
// In 'blocks edits by non-authors':
mockFindUnique.mockResolvedValue({ authorId: 'other-user', slug: 'old-slug', title: 'Old Title', coverImageUrl: null })

// In 'updates a recipe and regenerates the slug when title changes':
mockFindUnique.mockResolvedValue({ authorId: 'user-1', slug: 'old-slug', title: 'Old Title', coverImageUrl: null })
```

- [ ] **Step 2: Run to verify they fail**

```bash
yarn test src/lib/actions/recipes.test.ts
```

Expected: the 5 new tests fail (3 image status tests + the 2 existing tests may fail due to TypeScript if `coverImageUrl` is not selected yet).

- [ ] **Step 3: Update createRecipe**

In `src/lib/actions/recipes.ts`, inside `createRecipe`, update the `db.recipe.create` call to include `coverImageStatus`:

```ts
const recipe = await db.recipe.create({
  data: {
    slug,
    title: data.title,
    description: data.description,
    coverImageUrl: data.coverImageUrl || null,
    coverImageStatus: data.coverImageUrl ? 'pending_approval' : null,
    // ... rest unchanged
  },
  select: { slug: true },
})
```

- [ ] **Step 4: Update updateRecipe**

In `src/lib/actions/recipes.ts`, in `updateRecipe`:

First, update the `findUnique` select to include `coverImageUrl`:

```ts
const existing = await db.recipe.findUnique({
  where: { id: recipeId },
  select: { authorId: true, slug: true, title: true, coverImageUrl: true },
})
```

Then, before the transaction, compute the image status update:

```ts
const newImageUrl = data.coverImageUrl || null
const imageStatusUpdate: { coverImageStatus?: 'pending_approval' | null } = {}
if (newImageUrl !== existing.coverImageUrl) {
  imageStatusUpdate.coverImageStatus = newImageUrl ? 'pending_approval' : null
}
```

Then in the `db.recipe.update` call inside the transaction, spread `imageStatusUpdate`:

```ts
db.recipe.update({
  where: { id: recipeId },
  data: {
    slug,
    title: data.title,
    description: data.description,
    coverImageUrl: newImageUrl,
    ...imageStatusUpdate,
    prepTimeMins: data.prepTimeMins ?? null,
    // ... rest unchanged
  },
}),
```

Note: replace the existing `coverImageUrl: data.coverImageUrl || null` line with `coverImageUrl: newImageUrl`.

- [ ] **Step 5: Run to verify they pass**

```bash
yarn test src/lib/actions/recipes.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions/recipes.ts src/lib/actions/recipes.test.ts
git commit -m "feat: set coverImageStatus on recipe create/update"
```

---

## Task 5: Recipe detail page — guard image on approved status

**Files:**
- Modify: `src/app/recipes/[slug]/page.tsx`

- [ ] **Step 1: Guard the OG image metadata**

In `generateMetadata` in `src/app/recipes/[slug]/page.tsx`, the `getRecipe` call already uses `include` so `coverImageStatus` is auto-selected once the schema is updated. Update the OG image lines:

```ts
// Replace:
const images = recipe.coverImageUrl
  ? [{ url: recipe.coverImageUrl, alt: recipe.title }]
  : []
// ...
card: recipe.coverImageUrl ? 'summary_large_image' : 'summary',
// ...
images: recipe.coverImageUrl ? [recipe.coverImageUrl] : [],

// With:
const imageApproved = recipe.coverImageUrl && recipe.coverImageStatus === 'approved'
const images = imageApproved
  ? [{ url: recipe.coverImageUrl!, alt: recipe.title }]
  : []
// ...
card: imageApproved ? 'summary_large_image' : 'summary',
// ...
images: imageApproved ? [recipe.coverImageUrl!] : [],
```

- [ ] **Step 2: Guard the cover image render in JSX**

In the same file, find the JSX block:

```tsx
{recipe.coverImageUrl && (
  <div className={styles.cover}>
```

Replace with:

```tsx
{recipe.coverImageUrl && recipe.coverImageStatus === 'approved' && (
  <div className={styles.cover}>
```

- [ ] **Step 3: Run lint**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/recipes/[slug]/page.tsx
git commit -m "feat: only render approved cover images on recipe detail page"
```

---

## Task 6: Edit page — pass coverImageStatus to RecipeForm

**Files:**
- Modify: `src/app/recipes/[slug]/edit/page.tsx`
- Modify: `src/components/recipe-form/RecipeForm.tsx`

- [ ] **Step 1: Add coverImageStatus prop to RecipeFormProps**

In `src/components/recipe-form/RecipeForm.tsx`, update the `RecipeFormProps` interface:

```ts
interface RecipeFormProps {
  initialValues?: Partial<RecipeFormValues>
  recipeId?: string
  initialStatus?: 'draft' | 'published'
  /** Persisted moderation status of the current cover image. Null when no image. */
  coverImageStatus?: 'pending_approval' | 'approved' | 'rejected' | null
  tags: { id: string; name: string }[]
  ingredientTypes: { id: string; name: string }[]
}
```

Update the function signature to destructure it:

```ts
export function RecipeForm({
  initialValues,
  recipeId,
  initialStatus = 'draft',
  coverImageStatus,
  tags,
  ingredientTypes,
}: RecipeFormProps) {
```

Pass it through to `ChefMode` and `GuidedMode` (these props will be added in Task 7):

```tsx
{mode === 'guided' ? (
  <GuidedMode
    form={form}
    tags={tags}
    ingredientTypes={ingredientTypes}
    recipeId={recipeId}
    coverImageStatus={coverImageStatus}
  />
) : (
  <ChefMode
    form={form}
    tags={tags}
    ingredientTypes={ingredientTypes}
    recipeId={recipeId}
    coverImageStatus={coverImageStatus}
  />
)}
```

- [ ] **Step 2: Pass coverImageStatus from edit page**

In `src/app/recipes/[slug]/edit/page.tsx`, update the `<RecipeForm>` render:

```tsx
return (
  <RecipeForm
    initialValues={initialValues}
    recipeId={recipe.id}
    initialStatus={recipe.status as 'draft' | 'published'}
    coverImageStatus={recipe.coverImageStatus ?? null}
    tags={tags}
    ingredientTypes={ingredientTypes}
  />
)
```

(`recipe.coverImageStatus` is available because `getRecipeForEdit` uses `include`, which auto-selects all scalar fields.)

- [ ] **Step 3: Run lint**

```bash
yarn lint
```

Expected: TypeScript errors about `coverImageStatus` not existing on `ChefMode`/`GuidedMode` props — these are resolved in Task 7.

- [ ] **Step 4: Commit after Task 7 passes lint** (defer commit to end of Task 7)

---

## Task 7: Restore upload UI with consent checkbox and status badge

**Files:**
- Modify: `src/components/recipe-form/ChefMode.tsx`
- Modify: `src/components/recipe-form/ChefMode.module.css`
- Modify: `src/components/recipe-form/GuidedMode.tsx`
- Modify: `src/components/recipe-form/GuidedMode.module.css`

### ChefMode

- [ ] **Step 1: Update ChefMode props and state**

In `src/components/recipe-form/ChefMode.tsx`, update the `ChefModeProps` interface:

```ts
interface ChefModeProps {
  form: UseFormReturn<RecipeFormValues>
  tags: { id: string; name: string }[]
  ingredientTypes: { id: string; name: string }[]
  recipeId?: string
  coverImageStatus?: 'pending_approval' | 'approved' | 'rejected' | null
}
```

Update the function signature:

```ts
export function ChefMode({ form, tags, ingredientTypes, recipeId, coverImageStatus }: ChefModeProps) {
```

Add the imports at the top of the file:

```ts
import { useCoverUpload } from './useCoverUpload'
```

Inside the function body, add the hook and state:

```ts
const [consentGiven, setConsentGiven] = useState(false)
const { isUploading, fileInputRef, handleCoverUpload } = useCoverUpload(setValue)
const coverImageUrl = watch('coverImageUrl')
```

- [ ] **Step 2: Restore the cover photo field in ChefMode JSX**

In `ChefMode.tsx`, after the `description` field `<div>` and before the closing `</section>` of the "About" section, add:

```tsx
          <div className={styles.field}>
            <label className={styles.label}>Cover photo</label>
            <div className={styles.coverWrapper}>
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImageUrl} alt="Cover preview" className={styles.coverPreview} />
              ) : (
                <div className={`${styles.coverPlaceholder} ${isUploading ? styles.coverLoading : ''}`}>
                  {isUploading ? '' : 'No image selected'}
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                ref={fileInputRef}
                onChange={handleCoverUpload}
                className={styles.fileInput}
                data-testid="cover-upload"
                disabled={!consentGiven}
              />
              <label className={styles.consentLabel}>
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                {' '}I confirm this image is my own and complies with our{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer">content guidelines</a>.
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!consentGiven || isUploading}
                className={`${styles.uploadButton} ${isUploading ? styles.loading : ''}`}
              >
                {coverImageUrl ? 'Change photo' : 'Upload photo'}
              </button>
            </div>
            {coverImageStatus === 'pending_approval' && (
              <p className={styles.imageStatusPending}>
                Image under review — it will appear publicly once approved.
              </p>
            )}
            {coverImageStatus === 'rejected' && (
              <p className={styles.imageStatusRejected}>
                Image rejected — please upload a different image.
              </p>
            )}
          </div>
```

- [ ] **Step 3: Add consent and status badge styles to ChefMode.module.css**

At the end of `src/components/recipe-form/ChefMode.module.css`, add:

```css
/* ── Cover image consent + status ───────────────────────────── */
.consentLabel {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-2);
  margin-top: 0.5rem;
  cursor: pointer;
}

.consentLabel input[type='checkbox'] {
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.imageStatusPending,
.imageStatusRejected {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  border-radius: 0.375rem;
  padding: 0.375rem 0.625rem;
}

.imageStatusPending {
  background-color: color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent);
  color: var(--color-text);
}

.imageStatusRejected {
  background-color: color-mix(in srgb, var(--color-danger, #ef4444) 12%, transparent);
  color: var(--color-text);
}
```

### GuidedMode

- [ ] **Step 4: Update GuidedMode props and state**

In `src/components/recipe-form/GuidedMode.tsx`, update `GuidedModeProps`:

```ts
interface GuidedModeProps {
  form: UseFormReturn<RecipeFormValues>
  tags: { id: string; name: string }[]
  ingredientTypes: { id: string; name: string }[]
  recipeId?: string
  coverImageStatus?: 'pending_approval' | 'approved' | 'rejected' | null
}
```

Update the function signature:

```ts
export function GuidedMode({ form, tags, ingredientTypes, recipeId, coverImageStatus }: GuidedModeProps) {
```

Add the import at the top of the file:

```ts
import { useCoverUpload } from './useCoverUpload'
```

Inside the function body, add:

```ts
const [consentGiven, setConsentGiven] = useState(false)
const { isUploading, fileInputRef, handleCoverUpload } = useCoverUpload(setValue)
const coverImageUrl = watch('coverImageUrl')
```

- [ ] **Step 5: Restore the cover photo field in GuidedMode JSX**

In `GuidedMode.tsx`, find the `aboutGrid` div. Restore the right-column cover photo block. The `aboutGrid` currently contains only `<div className={styles.aboutMain}>`. Add the cover photo column:

```tsx
<div className={styles.aboutGrid}>
  {/* Left: title + description */}
  <div className={styles.aboutMain}>
    {/* ... title and description fields unchanged ... */}
  </div>

  {/* Right: cover photo */}
  <div className={styles.field}>
    <label className={styles.label}>Cover photo</label>
    <div className={styles.coverWrapper}>
      {coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImageUrl} alt="Cover" className={styles.coverPreview} />
      ) : (
        <div className={`${styles.coverPlaceholder} ${isUploading ? styles.coverLoading : ''}`}>
          {isUploading ? '' : 'No photo yet'}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleCoverUpload}
        className={styles.fileInput}
        disabled={!consentGiven}
      />
      <label className={styles.consentLabel}>
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
        />
        {' '}I confirm this image is my own and complies with our{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer">content guidelines</a>.
      </label>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={!consentGiven || isUploading}
        className={`${styles.uploadButton} ${isUploading ? styles.loading : ''}`}
      >
        {coverImageUrl ? 'Change photo' : 'Upload photo'}
      </button>
    </div>
    {coverImageStatus === 'pending_approval' && (
      <p className={styles.imageStatusPending}>
        Image under review — it will appear publicly once approved.
      </p>
    )}
    {coverImageStatus === 'rejected' && (
      <p className={styles.imageStatusRejected}>
        Image rejected — please upload a different image.
      </p>
    )}
  </div>
</div>
```

- [ ] **Step 6: Restore the aboutGrid desktop layout in GuidedMode.module.css**

In `src/components/recipe-form/GuidedMode.module.css`, find the `@media (width >= 960px)` block for `.aboutGrid`. Replace:

```css
@media (width >= 960px) {
  .aboutGrid {
    max-width: 48rem;
  }
}
```

With:

```css
@media (width >= 960px) {
  .aboutGrid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    align-items: start;
  }

  .aboutGrid .coverPlaceholder {
    height: 11rem;
  }

  .aboutGrid .coverPreview {
    max-height: 14rem;
  }
}
```

- [ ] **Step 7: Add consent and status badge styles to GuidedMode.module.css**

At the end of `src/components/recipe-form/GuidedMode.module.css`, add:

```css
/* ── Cover image consent + status ───────────────────────────── */
.consentLabel {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-2);
  margin-top: 0.5rem;
  cursor: pointer;
}

.consentLabel input[type='checkbox'] {
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.imageStatusPending,
.imageStatusRejected {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  border-radius: 0.375rem;
  padding: 0.375rem 0.625rem;
}

.imageStatusPending {
  background-color: color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent);
  color: var(--color-text);
}

.imageStatusRejected {
  background-color: color-mix(in srgb, var(--color-danger, #ef4444) 12%, transparent);
  color: var(--color-text);
}
```

- [ ] **Step 8: Run lint and tests**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/recipe-form/ src/app/recipes/\[slug\]/edit/page.tsx src/components/recipe-form/RecipeForm.tsx
git commit -m "feat: restore cover image upload UI with consent checkbox and moderation status badge"
```

---

## Task 8: Admin image queue page and nav link

**Files:**
- Create: `src/app/admin/images/page.tsx`
- Create: `src/app/admin/images/AdminImageActions.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create AdminImageActions client component**

Create `src/app/admin/images/AdminImageActions.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { approveRecipeImage, rejectRecipeImage } from '@/lib/actions/admin'
import { useToast } from '@/lib/toast'
import styles from '../admin.module.css'

interface AdminImageActionsProps {
  recipeId: string
}

export function AdminImageActions({ recipeId }: AdminImageActionsProps) {
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveRecipeImage(recipeId)
      if ('error' in result) {
        toast.error('Error', 'Could not approve image')
      } else {
        toast.success('Done', 'Image approved')
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectRecipeImage(recipeId)
      if ('error' in result) {
        toast.error('Error', 'Could not reject image')
      } else {
        toast.success('Done', 'Image rejected')
      }
    })
  }

  return (
    <span className={styles.actionRow}>
      <button
        onClick={handleApprove}
        disabled={isPending}
        className={styles.actionBtn}
        type="button"
      >
        {isPending ? '…' : 'Approve'}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className={`${styles.actionBtn} ${styles.dangerBtn}`}
        type="button"
      >
        {isPending ? '…' : 'Reject'}
      </button>
    </span>
  )
}
```

- [ ] **Step 2: Create the admin images page**

Create `src/app/admin/images/page.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminImageActions } from './AdminImageActions'
import styles from '../admin.module.css'

async function getPendingImages() {
  return db.recipe.findMany({
    where: { coverImageStatus: 'pending_approval', deletedAt: null },
    orderBy: { updatedAt: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      coverImageUrl: true,
      updatedAt: true,
      author: { select: { displayName: true, email: true } },
    },
  })
}

export const metadata = { title: 'Admin — Image Moderation' }

export default async function AdminImagesPage() {
  await requireAdmin()
  const recipes = await getPendingImages()

  if (recipes.length === 0) {
    return (
      <>
        <h1 className={styles.pageTitle}>Image Moderation</h1>
        <p>No images pending review.</p>
      </>
    )
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Image Moderation ({recipes.length})</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Recipe</th>
            <th>Author</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((r) => (
            <tr key={r.id}>
              <td>
                {r.coverImageUrl && (
                  <Image
                    src={r.coverImageUrl}
                    alt={r.title}
                    width={80}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                )}
              </td>
              <td>
                <Link href={`/recipes/${r.slug}`} className={styles.tableLink}>
                  {r.title}
                </Link>
              </td>
              <td>
                <span title={r.author.email}>{r.author.displayName}</span>
              </td>
              <td>{new Date(r.updatedAt).toLocaleDateString()}</td>
              <td>
                <AdminImageActions recipeId={r.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
```

- [ ] **Step 3: Add Images link to admin nav**

In `src/app/admin/layout.tsx`, add the nav link after the Recipes link:

```tsx
<Link href="/admin" className={styles.navLink}>Recipes</Link>
<Link href="/admin/images" className={styles.navLink}>Images</Link>
<Link href="/admin/users" className={styles.navLink}>Users</Link>
```

- [ ] **Step 4: Run lint**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Step 5: Verify in browser**

```bash
yarn dev
```

- Open `http://localhost:3000/admin/images` and confirm the "Images" link appears in the sidebar.
- Upload an image on a recipe edit page (after checking the consent box), save, then confirm it appears in the admin queue.
- Approve it and confirm it now shows on the public recipe page.
- Reject a different image and confirm the rejection notice appears on the edit page.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/images/ src/app/admin/layout.tsx
git commit -m "feat: add admin image moderation queue at /admin/images"
```

---

## Self-Review Checklist

- [x] **Schema**: `CoverImageStatus` enum + field on `Recipe` — Task 1
- [x] **Terms of Service**: new §4 image upload section — Task 2
- [x] **Admin actions** (`approveRecipeImage`, `rejectRecipeImage`) with tests — Task 3
- [x] **`createRecipe`**: sets `coverImageStatus: 'pending_approval'` when URL present — Task 4
- [x] **`updateRecipe`**: resets status only when URL changes; clears on removal — Task 4
- [x] **Recipe detail page**: guards image render + OG metadata on `approved` — Task 5
- [x] **Edit page**: passes `coverImageStatus` to `RecipeForm` — Task 6
- [x] **RecipeForm → ChefMode/GuidedMode**: consent checkbox + status badge + upload restored — Task 7
- [x] **Admin images page** + nav link — Task 8
- [x] **No TBDs or placeholder steps** — all code is written out
- [x] **Type consistency**: `coverImageStatus` prop typed as `'pending_approval' | 'approved' | 'rejected' | null` throughout; Prisma enum values used as string literals consistent with existing patterns (`'draft'`, `'published'`)
