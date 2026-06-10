# Badge System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 6-tier badge/achievement system (Iron→Iridium) for four milestones — pantry items stocked, recipes published, total favorites received, and single-recipe favorites — displayed on `/profile` with in-app toast notifications when tiers are crossed.

**Architecture:** A `UserBadge` DB table stores every earned tier permanently (one row per tier crossing). A shared `checkAndAwardBadges()` helper queries live counts, diffs against stored tiers, inserts newly earned ones, and returns them for toast display. Three server actions call the helper post-mutation; client components show toasts via the existing `useToast()` system.

**Tech Stack:** Prisma 7 + Neon PostgreSQL, Next.js App Router Server Components, React `useTransition`, `useToast()` from `src/lib/toast.tsx`

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add `BadgeType`, `BadgeTier` enums + `UserBadge` model |
| `src/lib/badges.ts` | **Create** | Thresholds, `checkAndAwardBadges`, `getHighestTier`, formatters |
| `src/lib/badges.test.ts` | **Create** | Unit tests for badge evaluation logic |
| `src/lib/actions/pantry.ts` | Modify | Call helper after `addPantryItem`; extend return type |
| `src/lib/actions/recipes.ts` | Modify | Call helper after publish; extend return type |
| `src/lib/actions/favorites.ts` | Modify | Call helper (×2) after favorite; silent for other-user awards |
| `src/app/pantry/PantrySectionAdd.tsx` | Modify | Show badge toast after add |
| `src/app/pantry/PantryManager.tsx` | Modify | Show badge toast after add |
| `src/app/pantry/PantryCategoryBoard.tsx` | Modify | Show badge toast after bulk add |
| `src/components/recipe/FavoriteButton.tsx` | Modify | Show badge toast after favorite |
| `src/components/recipe-form/RecipeForm.tsx` | Modify | Show badge toast after publish |
| `src/app/profile/page.tsx` | Modify | Parallel badge queries; render `<BadgeGrid>` |
| `src/components/profile/BadgeGrid.tsx` | **Create** | Badge display grid (Server Component) |
| `src/components/profile/BadgeGrid.module.css` | **Create** | 2-col grid + card styles |

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enums and model to schema**

In `prisma/schema.prisma`, add after the existing `CoverImageStatus` enum and before the `User` model:

```prisma
enum BadgeType {
  PANTRY_PIONEER
  RECIPE_AUTHOR
  COMMUNITY_FAVORITE
  HIT_MAKER
}

enum BadgeTier {
  IRON
  BRONZE
  SILVER
  GOLD
  PLATINUM
  IRIDIUM
}
```

Add the `UserBadge` model at the end of the file (after `PantryItem`):

```prisma
// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

/** One row per earned tier per user per badge type. Never deleted — badges
 *  are permanent once awarded. */
model UserBadge {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  badgeType BadgeType @map("badge_type")
  tier      BadgeTier
  earnedAt  DateTime  @default(now()) @map("earned_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, badgeType, tier])
  @@map("user_badges")
}
```

Add the relation to the `User` model (after `pantryItems PantryItem[]`):

```prisma
  badges      UserBadge[]
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_user_badges
```

Expected output ends with: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
npx prisma generate
```

Expected: no errors. After this step, `BadgeType`, `BadgeTier`, and `db.userBadge` are available from `@prisma/client`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add UserBadge schema for tiered badge system"
```

---

## Task 2: Badge Evaluation Module (TDD)

**Files:**
- Create: `src/lib/badges.test.ts`
- Create: `src/lib/badges.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/badges.test.ts`:

```typescript
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    pantryItem: { count: vi.fn() },
    recipe: { count: vi.fn(), findMany: vi.fn() },
    favorite: { count: vi.fn(), groupBy: vi.fn() },
    userBadge: { findMany: vi.fn(), createMany: vi.fn() },
  },
}))

import { db } from '@/lib/db'
import {
  checkAndAwardBadges,
  BADGE_THRESHOLDS,
  tierLabel,
  badgeLabel,
  badgeSubtitle,
  nextThreshold,
} from './badges'

const mockPantryCount = vi.mocked(db.pantryItem.count)
const mockRecipeCount = vi.mocked(db.recipe.count)
const mockFavCount = vi.mocked(db.favorite.count)
const mockRecipeFindMany = vi.mocked(db.recipe.findMany)
const mockFavGroupBy = vi.mocked(db.favorite.groupBy)
const mockBadgeFindMany = vi.mocked(db.userBadge.findMany)
const mockBadgeCreateMany = vi.mocked(db.userBadge.createMany)

beforeEach(() => {
  vi.clearAllMocks()
  mockBadgeCreateMany.mockResolvedValue({ count: 0 })
})

describe('BADGE_THRESHOLDS', () => {
  it('has six tiers in ascending order', () => {
    expect(BADGE_THRESHOLDS).toHaveLength(6)
    expect(BADGE_THRESHOLDS.map((t) => t.min)).toEqual([3, 10, 25, 50, 75, 100])
  })
})

describe('checkAndAwardBadges — PANTRY_PIONEER', () => {
  it('returns empty when count is below Iron threshold', async () => {
    mockPantryCount.mockResolvedValue(2)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([])
    expect(mockBadgeCreateMany).not.toHaveBeenCalled()
  })

  it('awards Iron when count exactly meets the threshold', async () => {
    mockPantryCount.mockResolvedValue(3)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([{ badgeType: 'PANTRY_PIONEER', tier: 'IRON' }])
    expect(mockBadgeCreateMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-1', badgeType: 'PANTRY_PIONEER', tier: 'IRON' }],
      skipDuplicates: true,
    })
  })

  it('awards multiple tiers when count skips ahead', async () => {
    mockPantryCount.mockResolvedValue(25)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result.map((r) => r.tier)).toEqual(['IRON', 'BRONZE', 'SILVER'])
  })

  it('skips already-earned tiers', async () => {
    mockPantryCount.mockResolvedValue(10)
    mockBadgeFindMany.mockResolvedValue([
      { tier: 'IRON' },
    ] as Awaited<ReturnType<typeof db.userBadge.findMany>>)

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([{ badgeType: 'PANTRY_PIONEER', tier: 'BRONZE' }])
    expect(mockBadgeCreateMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-1', badgeType: 'PANTRY_PIONEER', tier: 'BRONZE' }],
      skipDuplicates: true,
    })
  })

  it('returns empty when all earned tiers are already stored', async () => {
    mockPantryCount.mockResolvedValue(10)
    mockBadgeFindMany.mockResolvedValue([
      { tier: 'IRON' },
      { tier: 'BRONZE' },
    ] as Awaited<ReturnType<typeof db.userBadge.findMany>>)

    const result = await checkAndAwardBadges('user-1', 'PANTRY_PIONEER')

    expect(result).toEqual([])
    expect(mockBadgeCreateMany).not.toHaveBeenCalled()
  })
})

describe('checkAndAwardBadges — RECIPE_AUTHOR', () => {
  it('queries published non-deleted recipes', async () => {
    mockRecipeCount.mockResolvedValue(0)
    mockBadgeFindMany.mockResolvedValue([])

    await checkAndAwardBadges('user-1', 'RECIPE_AUTHOR')

    expect(mockRecipeCount).toHaveBeenCalledWith({
      where: { authorId: 'user-1', status: 'published', deletedAt: null },
    })
  })
})

describe('checkAndAwardBadges — COMMUNITY_FAVORITE', () => {
  it('queries favorites on the user\'s non-deleted recipes', async () => {
    mockFavCount.mockResolvedValue(0)
    mockBadgeFindMany.mockResolvedValue([])

    await checkAndAwardBadges('user-1', 'COMMUNITY_FAVORITE')

    expect(mockFavCount).toHaveBeenCalledWith({
      where: { recipe: { authorId: 'user-1', deletedAt: null } },
    })
  })
})

describe('checkAndAwardBadges — HIT_MAKER', () => {
  it('returns 0 when user has no recipes', async () => {
    mockRecipeFindMany.mockResolvedValue([])
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'HIT_MAKER')

    expect(result).toEqual([])
    expect(mockFavGroupBy).not.toHaveBeenCalled()
  })

  it('returns max favorites across the user\'s recipes', async () => {
    mockRecipeFindMany.mockResolvedValue([
      { id: 'recipe-a' },
      { id: 'recipe-b' },
    ] as Awaited<ReturnType<typeof db.recipe.findMany>>)
    mockFavGroupBy.mockResolvedValue([
      { recipeId: 'recipe-a', _count: { _all: 25 } },
      { recipeId: 'recipe-b', _count: { _all: 4 } },
    ] as Awaited<ReturnType<typeof db.favorite.groupBy>>)
    mockBadgeFindMany.mockResolvedValue([])

    const result = await checkAndAwardBadges('user-1', 'HIT_MAKER')

    expect(result.map((r) => r.tier)).toEqual(['IRON', 'BRONZE', 'SILVER'])
  })
})

describe('formatters', () => {
  it('tierLabel returns human-readable tier names', () => {
    expect(tierLabel('IRON')).toBe('Iron')
    expect(tierLabel('IRIDIUM')).toBe('Iridium')
  })

  it('badgeLabel returns human-readable badge names', () => {
    expect(badgeLabel('PANTRY_PIONEER')).toBe('Pantry Pioneer')
    expect(badgeLabel('HIT_MAKER')).toBe('Hit Maker')
  })

  it('badgeSubtitle returns copy mentioning the threshold count', () => {
    expect(badgeSubtitle({ badgeType: 'PANTRY_PIONEER', tier: 'IRON' })).toContain('3')
    expect(badgeSubtitle({ badgeType: 'RECIPE_AUTHOR', tier: 'BRONZE' })).toContain('10')
  })

  it('nextThreshold returns next tier above current count', () => {
    expect(nextThreshold(5)).toEqual({ tier: 'BRONZE', min: 10 })
    expect(nextThreshold(100)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
yarn test src/lib/badges.test.ts
```

Expected: `Cannot find module './badges'` or similar — tests fail because the module doesn't exist yet.

- [ ] **Step 3: Implement `src/lib/badges.ts`**

Create `src/lib/badges.ts`:

```typescript
import type { BadgeType, BadgeTier } from '@prisma/client'
import { db } from '@/lib/db'

export type NewBadge = { badgeType: BadgeType; tier: BadgeTier }

export const BADGE_THRESHOLDS: { tier: BadgeTier; min: number }[] = [
  { tier: 'IRON', min: 3 },
  { tier: 'BRONZE', min: 10 },
  { tier: 'SILVER', min: 25 },
  { tier: 'GOLD', min: 50 },
  { tier: 'PLATINUM', min: 75 },
  { tier: 'IRIDIUM', min: 100 },
]

async function getCount(userId: string, badgeType: BadgeType): Promise<number> {
  switch (badgeType) {
    case 'PANTRY_PIONEER':
      return db.pantryItem.count({ where: { userId } })
    case 'RECIPE_AUTHOR':
      return db.recipe.count({
        where: { authorId: userId, status: 'published', deletedAt: null },
      })
    case 'COMMUNITY_FAVORITE':
      return db.favorite.count({
        where: { recipe: { authorId: userId, deletedAt: null } },
      })
    case 'HIT_MAKER': {
      const recipeIds = await db.recipe
        .findMany({ where: { authorId: userId, deletedAt: null }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id))
      if (recipeIds.length === 0) return 0
      const groups = await db.favorite.groupBy({
        by: ['recipeId'],
        where: { recipeId: { in: recipeIds } },
        _count: { _all: true },
      })
      return Math.max(0, ...groups.map((g) => g._count._all))
    }
  }
}

export async function checkAndAwardBadges(
  userId: string,
  badgeType: BadgeType
): Promise<NewBadge[]> {
  const count = await getCount(userId, badgeType)

  const earnedTiers = BADGE_THRESHOLDS.filter(({ min }) => count >= min).map(({ tier }) => tier)
  if (earnedTiers.length === 0) return []

  const alreadyEarned = await db.userBadge.findMany({
    where: { userId, badgeType },
    select: { tier: true },
  })
  const alreadyEarnedSet = new Set(alreadyEarned.map((b) => b.tier))

  const newTiers = earnedTiers.filter((tier) => !alreadyEarnedSet.has(tier))
  if (newTiers.length === 0) return []

  await db.userBadge.createMany({
    data: newTiers.map((tier) => ({ userId, badgeType, tier })),
    skipDuplicates: true,
  })

  return newTiers.map((tier) => ({ badgeType, tier }))
}

export function tierLabel(tier: BadgeTier): string {
  const labels: Record<BadgeTier, string> = {
    IRON: 'Iron',
    BRONZE: 'Bronze',
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum',
    IRIDIUM: 'Iridium',
  }
  return labels[tier]
}

export function badgeLabel(badgeType: BadgeType): string {
  const labels: Record<BadgeType, string> = {
    PANTRY_PIONEER: 'Pantry Pioneer',
    RECIPE_AUTHOR: 'Recipe Author',
    COMMUNITY_FAVORITE: 'Community Favorite',
    HIT_MAKER: 'Hit Maker',
  }
  return labels[badgeType]
}

export function badgeSubtitle(badge: NewBadge): string {
  const count = BADGE_THRESHOLDS.find((t) => t.tier === badge.tier)?.min ?? 0
  const subtitles: Record<BadgeType, string> = {
    PANTRY_PIONEER: `You've stocked ${count} pantry items!`,
    RECIPE_AUTHOR: `You've published ${count} recipe${count === 1 ? '' : 's'}!`,
    COMMUNITY_FAVORITE: `Your recipes have been saved ${count} time${count === 1 ? '' : 's'}!`,
    HIT_MAKER: `One of your recipes has been saved ${count} time${count === 1 ? '' : 's'}!`,
  }
  return subtitles[badge.badgeType]
}

export function nextThreshold(currentCount: number): { tier: BadgeTier; min: number } | null {
  return BADGE_THRESHOLDS.find(({ min }) => min > currentCount) ?? null
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
yarn test src/lib/badges.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/badges.ts src/lib/badges.test.ts
git commit -m "feat: add checkAndAwardBadges helper with tier formatters"
```

---

## Task 3: Wire Badges into Pantry Actions

**Files:**
- Modify: `src/lib/actions/pantry.ts`
- Modify: `src/app/pantry/PantrySectionAdd.tsx`
- Modify: `src/app/pantry/PantryManager.tsx`
- Modify: `src/app/pantry/PantryCategoryBoard.tsx`

- [ ] **Step 1: Extend `addPantryItem` and `addPantryItems` return types and call helper**

In `src/lib/actions/pantry.ts`, add the import at the top (after existing imports):

```typescript
import { checkAndAwardBadges, type NewBadge } from '@/lib/badges'
```

Change the return type of `addPantryItem`:

```typescript
export async function addPantryItem(
  input: AddPantryItemInput
): Promise<{ item: PantryItemView; newBadges: NewBadge[] } | { error: string }> {
```

After `revalidatePath('/pantry')` and before `return { item: toView(row) }`, add:

```typescript
    const newBadges = await checkAndAwardBadges(session.userId, 'PANTRY_PIONEER')
    revalidatePath('/pantry')
    return { item: toView(row), newBadges }
```

(Remove the original standalone `revalidatePath('/pantry')` — the one above replaces it.)

Change the return type of `addPantryItems`:

```typescript
export async function addPantryItems(
  inputs: AddPantryItemInput[]
): Promise<{ items: PantryItemView[]; newBadges: NewBadge[] } | { error: string }> {
```

After `revalidatePath('/pantry')` and before `return { items: rows.map(toView) }`, add:

```typescript
    const newBadges = await checkAndAwardBadges(session.userId, 'PANTRY_PIONEER')
    revalidatePath('/pantry')
    return { items: rows.map(toView), newBadges }
```

(Remove the original standalone `revalidatePath('/pantry')`.)

- [ ] **Step 2: Run TypeScript check**

```bash
yarn build 2>&1 | grep -E "error TS|pantry"
```

Expected: errors in `PantrySectionAdd.tsx` and `PantryManager.tsx` because the return type now includes `newBadges`. That's correct — fix them next.

- [ ] **Step 3: Add toast to `PantrySectionAdd.tsx`**

In `src/app/pantry/PantrySectionAdd.tsx`:

Add import after existing imports:

```typescript
import { useToast } from '@/lib/toast'
import { tierLabel, badgeLabel, badgeSubtitle } from '@/lib/badges'
```

Add `const toast = useToast()` inside the component (after the `useState` calls):

```typescript
  const toast = useToast()
```

Update the `startTransition` callback to handle `newBadges`:

```typescript
    startTransition(async () => {
      const result = await addPantryItem({ ingredientName: trimmed, typeId })
      if ('error' in result) {
        setError(result.error)
        return
      }
      result.newBadges.forEach((b) =>
        toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
      )
      onAdded(result.item)
      setName('')
    })
```

- [ ] **Step 4: Add toast to `PantryCategoryBoard.tsx`**

`PantryCategoryBoard` already imports `useToast`. Find the `handleSave` function and update the result handling:

Add imports at the top (after existing imports):

```typescript
import { tierLabel, badgeLabel, badgeSubtitle } from '@/lib/badges'
```

Update `handleSave`:

```typescript
  function handleSave() {
    startTransition(async () => {
      const result = await addPantryItems(buildInputs(selected))
      if ('error' in result) { toast.error('Error', result.error); return }
      result.newBadges.forEach((b) =>
        toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
      )
      result.items.forEach(onUpdated)
      setSelected(new Set())
      dialogRef.current?.close()
    })
  }
```

- [ ] **Step 5: Add toast to `PantryManager.tsx`**

Find the `addPantryItem` call in `PantryManager.tsx` (around line 210). It's inside a `startTransition` callback. Apply the same pattern:

Add imports at the top of the file:

```typescript
import { useToast } from '@/lib/toast'
import { tierLabel, badgeLabel, badgeSubtitle } from '@/lib/badges'
```

Add `const toast = useToast()` inside the component (near other hooks).

Update the `addPantryItem` result handling:

```typescript
      const result = await addPantryItem({
        ingredientName: trimmed,
        amount,
        unit,
        typeId,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      result.newBadges.forEach((b) =>
        toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
      )
      onAdded(result.item)
      setName('')
      setAmount('')
      setUnit('')
      setTypeId('')
```

- [ ] **Step 6: Run TypeScript check**

```bash
yarn build 2>&1 | grep "error TS"
```

Expected: no pantry-related errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/actions/pantry.ts src/app/pantry/PantrySectionAdd.tsx src/app/pantry/PantryManager.tsx src/app/pantry/PantryCategoryBoard.tsx
git commit -m "feat: award PANTRY_PIONEER badge on pantry item adds"
```

---

## Task 4: Wire Badges into Recipe Publish

**Files:**
- Modify: `src/lib/actions/recipes.ts`
- Modify: `src/components/recipe-form/RecipeForm.tsx`

- [ ] **Step 1: Extend `createRecipe` and `updateRecipe` return types**

In `src/lib/actions/recipes.ts`, add import after existing imports:

```typescript
import { checkAndAwardBadges, type NewBadge } from '@/lib/badges'
```

Change `createRecipe` return type:

```typescript
export async function createRecipe(
  formData: RecipeFormValues,
  publish = false
): Promise<{ slug: string; newBadges: NewBadge[] } | { error: string }> {
```

After the `revalidatePath` calls in `createRecipe`, replace `return { slug: recipe.slug }` with:

```typescript
    const newBadges = publish
      ? await checkAndAwardBadges(session.userId, 'RECIPE_AUTHOR')
      : []

    revalidatePath('/')
    revalidatePath('/recipes')
    revalidatePath('/my-recipes')

    return { slug: recipe.slug, newBadges }
```

Change `updateRecipe` return type:

```typescript
export async function updateRecipe(
  recipeId: string,
  formData: RecipeFormValues,
  publish = false
): Promise<{ slug: string; newBadges: NewBadge[] } | { error: string }> {
```

After the `revalidatePath` calls in `updateRecipe`, replace `return { slug }` with:

```typescript
    const newBadges = publish
      ? await checkAndAwardBadges(session.userId, 'RECIPE_AUTHOR')
      : []

    revalidatePath('/')
    revalidatePath('/recipes')
    revalidatePath(`/recipes/${slug}`)
    revalidatePath('/my-recipes')

    return { slug, newBadges }
```

- [ ] **Step 2: Add toast in `RecipeForm.tsx`**

`RecipeForm` uses a direct async `onSubmit` (not `useActionState`), so toasts can fire directly after the action resolves. No `useEffect` needed.

In `src/components/recipe-form/RecipeForm.tsx`, add imports after existing ones:

```typescript
import { tierLabel, badgeLabel, badgeSubtitle } from '@/lib/badges'
```

Update the `onSubmit` function:

```typescript
  async function onSubmit(data: RecipeFormValues, publish: boolean) {
    const result = recipeId
      ? await updateRecipe(recipeId, data, publish)
      : await createRecipe(data, publish)

    if ('error' in result) {
      toast.error('Error', result.error)
      return
    }

    result.newBadges.forEach((b) =>
      toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
    )

    router.push(`/recipes/${result.slug}`)
  }
```

- [ ] **Step 3: Run TypeScript check**

```bash
yarn build 2>&1 | grep "error TS"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/recipes.ts src/components/recipe-form/RecipeForm.tsx
git commit -m "feat: award RECIPE_AUTHOR badge on recipe publish"
```

---

## Task 5: Wire Badges into `toggleFavorite`

**Files:**
- Modify: `src/lib/actions/favorites.ts`
- Modify: `src/components/recipe/FavoriteButton.tsx`

- [ ] **Step 1: Extend `toggleFavorite` return type and call helpers**

In `src/lib/actions/favorites.ts`, add import:

```typescript
import { checkAndAwardBadges, type NewBadge } from '@/lib/badges'
```

Change the return type:

```typescript
export async function toggleFavorite(
  recipeId: string,
  recipeSlug: string
): Promise<{ favorited: boolean; newBadges: NewBadge[] } | { error: string }> {
```

Replace the unfavorite return with:

```typescript
    if (existing) {
      await db.favorite.delete({
        where: { userId_recipeId: { userId: session.userId, recipeId } },
      })
      revalidatePath(`/recipes/${recipeSlug}`)
      revalidatePath('/favorites')
      return { favorited: false, newBadges: [] }
    }
```

For the favorite branch, fetch the recipe's authorId before creating the favorite, then call both badge helpers. Replace from `await db.favorite.create(...)` through the return:

```typescript
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true },
    })

    await db.favorite.create({
      data: { userId: session.userId, recipeId },
    })

    revalidatePath(`/recipes/${recipeSlug}`)
    revalidatePath('/favorites')

    // Award badges to the recipe's author.
    // Only include in the response when the current user IS the author —
    // otherwise the badge is awarded silently and the author sees it on
    // their profile next visit.
    const isOwnRecipe = recipe?.authorId === session.userId
    const authorId = recipe?.authorId ?? session.userId

    const [communityBadges, hitMakerBadges] = await Promise.all([
      checkAndAwardBadges(authorId, 'COMMUNITY_FAVORITE'),
      checkAndAwardBadges(authorId, 'HIT_MAKER'),
    ])

    const newBadges = isOwnRecipe ? [...communityBadges, ...hitMakerBadges] : []

    return { favorited: true, newBadges }
```

- [ ] **Step 2: Add toast in `FavoriteButton.tsx`**

In `src/components/recipe/FavoriteButton.tsx`, add imports:

```typescript
import { tierLabel, badgeLabel, badgeSubtitle } from '@/lib/badges'
```

Update the `startTransition` callback:

```typescript
    startTransition(async () => {
      const result = await toggleFavorite(recipeId, recipeSlug)
      if ('error' in result) {
        setFavorited((prev) => !prev)
        toast.error('Error', 'Could not update favorite')
        return
      }
      setFavorited(result.favorited)
      result.newBadges.forEach((b) =>
        toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
      )
    })
```

- [ ] **Step 3: Run TypeScript check**

```bash
yarn build 2>&1 | grep "error TS"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/favorites.ts src/components/recipe/FavoriteButton.tsx
git commit -m "feat: award COMMUNITY_FAVORITE and HIT_MAKER badges on favorite"
```

---

## Task 6: Profile Page Badge Grid

**Files:**
- Create: `src/components/profile/BadgeGrid.tsx`
- Create: `src/components/profile/BadgeGrid.module.css`
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: Create `BadgeGrid.tsx`**

Create `src/components/profile/BadgeGrid.tsx`:

```typescript
import type { BadgeType, BadgeTier } from '@prisma/client'
import { BADGE_THRESHOLDS, tierLabel, nextThreshold } from '@/lib/badges'
import styles from './BadgeGrid.module.css'

type EarnedBadge = { badgeType: BadgeType; tier: BadgeTier; earnedAt: Date }

export type BadgeCounts = {
  pantry: number
  recipes: number
  communityFav: number
  hitMaker: number
}

interface BadgeGridProps {
  badges: EarnedBadge[]
  counts: BadgeCounts
}

const BADGE_DEFS: {
  type: BadgeType
  label: string
  countKey: keyof BadgeCounts
  unlockHint: string
}[] = [
  {
    type: 'PANTRY_PIONEER',
    label: 'Pantry Pioneer',
    countKey: 'pantry',
    unlockHint: 'Stock 3 pantry items to unlock',
  },
  {
    type: 'RECIPE_AUTHOR',
    label: 'Recipe Author',
    countKey: 'recipes',
    unlockHint: 'Publish 3 recipes to unlock',
  },
  {
    type: 'COMMUNITY_FAVORITE',
    label: 'Community Favorite',
    countKey: 'communityFav',
    unlockHint: 'Receive 3 saves on your recipes to unlock',
  },
  {
    type: 'HIT_MAKER',
    label: 'Hit Maker',
    countKey: 'hitMaker',
    unlockHint: 'Get 3 saves on a single recipe to unlock',
  },
]

export function BadgeGrid({ badges, counts }: BadgeGridProps) {
  // Build a map of badgeType → highest earned tier + earnedAt
  const badgeMap = new Map<BadgeType, EarnedBadge>()
  for (const b of badges) {
    const existing = badgeMap.get(b.badgeType)
    const existingIdx = existing
      ? BADGE_THRESHOLDS.findIndex((t) => t.tier === existing.tier)
      : -1
    const newIdx = BADGE_THRESHOLDS.findIndex((t) => t.tier === b.tier)
    if (newIdx > existingIdx) badgeMap.set(b.badgeType, b)
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Badges</h2>
      <div className={styles.grid}>
        {BADGE_DEFS.map(({ type, label, countKey, unlockHint }) => {
          const earned = badgeMap.get(type)
          const count = counts[countKey]
          const next = nextThreshold(count)

          return (
            <div
              key={type}
              className={`${styles.card} ${earned ? styles.earned : styles.locked}`}
            >
              <p className={styles.badgeName}>{label}</p>
              {earned ? (
                <>
                  <p className={styles.tier}>{tierLabel(earned.tier)}</p>
                  <p className={styles.earnedAt}>
                    Earned{' '}
                    {earned.earnedAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {next && (
                    <p className={styles.progress}>
                      {next.min - count} more to {tierLabel(next.tier)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className={styles.tier}>Not yet earned</p>
                  <p className={styles.unlockHint}>{unlockHint}</p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `BadgeGrid.module.css`**

Create `src/components/profile/BadgeGrid.module.css`:

```css
.section {
  margin-top: 2rem;
}

.heading {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.card {
  border-radius: 0.625rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.earned {
  background-color: var(--color-surface);
}

.locked {
  background-color: var(--color-surface);
  opacity: 0.55;
}

.badgeName {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-2);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tier {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.earnedAt {
  font-size: 0.8125rem;
  color: var(--color-text-3);
  margin: 0;
}

.progress {
  font-size: 0.8125rem;
  color: var(--color-text-3);
  margin: 0.25rem 0 0;
}

.unlockHint {
  font-size: 0.8125rem;
  color: var(--color-text-3);
  margin: 0;
}
```

- [ ] **Step 3: Update `src/app/profile/page.tsx`**

Replace the entire file content:

```typescript
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProfileForm } from './ProfileForm'
import { BadgeGrid, type BadgeCounts } from '@/components/profile/BadgeGrid'
import styles from './profile.module.css'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await requireSession()
  const userId = session.userId

  const recipeIds = await db.recipe
    .findMany({ where: { authorId: userId, deletedAt: null }, select: { id: true } })
    .then((rows) => rows.map((r) => r.id))

  const hitMakerGroups =
    recipeIds.length > 0
      ? await db.favorite.groupBy({
          by: ['recipeId'],
          where: { recipeId: { in: recipeIds } },
          _count: { _all: true },
        })
      : []

  const [badges, pantryCt, recipeCt, communityFavCt] = await Promise.all([
    db.userBadge.findMany({
      where: { userId },
      select: { badgeType: true, tier: true, earnedAt: true },
      orderBy: { earnedAt: 'asc' },
    }),
    db.pantryItem.count({ where: { userId } }),
    db.recipe.count({ where: { authorId: userId, status: 'published', deletedAt: null } }),
    db.favorite.count({ where: { recipe: { authorId: userId, deletedAt: null } } }),
  ])

  const hitMakerCt = Math.max(0, ...hitMakerGroups.map((g) => g._count._all))

  const counts: BadgeCounts = {
    pantry: pantryCt,
    recipes: recipeCt,
    communityFav: communityFavCt,
    hitMaker: hitMakerCt,
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <div className={styles.card}>
        {/* Avatar */}
        <div className={styles.avatarSection}>
          {session.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.avatarUrl}
              alt={session.displayName}
              className={styles.avatar}
              width={72}
              height={72}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {session.displayName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className={styles.avatarName}>{session.displayName}</p>
            <p className={styles.avatarEmail}>{session.email}</p>
          </div>
        </div>

        <hr className={styles.divider} />

        <ProfileForm initialDisplayName={session.displayName} />
      </div>

      <BadgeGrid badges={badges} counts={counts} />
    </div>
  )
}
```

- [ ] **Step 4: Run full TypeScript build**

```bash
yarn build 2>&1 | grep "error TS"
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
yarn test
```

Expected: all tests pass, including the new `badges.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/BadgeGrid.tsx src/components/profile/BadgeGrid.module.css src/app/profile/page.tsx
git commit -m "feat: add BadgeGrid to profile page with live progress hints"
```

---

## Task 7: Manual Verification

- [ ] **Start the dev server**

```bash
yarn dev
```

- [ ] **Test Pantry Pioneer**

1. Navigate to `/pantry`
2. Add 3 pantry items (one at a time)
3. After the 3rd item: confirm "Iron unlocked — Pantry Pioneer" toast appears
4. Visit `/profile` — confirm the Pantry Pioneer card shows "Iron" and today's date

- [ ] **Test Recipe Author**

1. Navigate to `/recipes/new`
2. Create and publish a recipe
3. Confirm "Iron unlocked — Recipe Author" toast appears after redirect
4. Visit `/profile` — confirm Recipe Author card shows "Iron"

- [ ] **Test Community Favorite / Hit Maker (own recipe)**

1. Navigate to a recipe you authored
2. Click "Save" (favorite your own recipe)
3. Confirm "Iron unlocked — Community Favorite" and/or "Iron unlocked — Hit Maker" toasts appear (only if you hadn't already saved it)
4. Visit `/profile` — confirm Community Favorite and Hit Maker cards show progress

- [ ] **Test silent award for other-user recipe**

1. Log in as a second account (or use admin to create a recipe owned by the e2e-user)
2. Favorite a recipe owned by a different user
3. Confirm **no badge toast** appears for the favoriting user
4. Log in as the recipe owner — visit `/profile` — confirm their badge shows progress

- [ ] **Test progress hints**

1. On `/profile`, add more pantry items until you're between tiers
2. Confirm the "N more to Bronze" progress hint updates after each add
