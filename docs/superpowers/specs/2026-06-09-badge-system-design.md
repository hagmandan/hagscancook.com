# Badge System Design

**Date:** 2026-06-09
**Status:** Approved

## Overview

Add a tiered badge/achievement system that rewards users for pantry milestones, recipe publishing, and community engagement. Badges appear on the user's own `/profile` page. When a new tier is crossed, a success toast fires inline at the action that triggered it.

---

## Badge Definitions

Four badge types, all sharing the same 6-tier scale:

| Tier | Threshold |
|------|-----------|
| Iron | 3 |
| Bronze | 10 |
| Silver | 25 |
| Gold | 50 |
| Platinum | 75 |
| Iridium | 100 |

| Badge | Enum | What it counts |
|-------|------|---------------|
| Pantry Pioneer | `PANTRY_PIONEER` | Pantry items added by the user |
| Recipe Author | `RECIPE_AUTHOR` | Published (non-deleted) recipes authored by the user |
| Community Favorite | `COMMUNITY_FAVORITE` | Total favorites received across all the user's recipes |
| Hit Maker | `HIT_MAKER` | Favorites on the user's single most-favorited recipe |

**COMMUNITY_FAVORITE and HIT_MAKER are awarded to the recipe's author**, not the person doing the favoriting.

---

## Data Model

New Prisma enums and table added to `prisma/schema.prisma`:

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

model UserBadge {
  id        String    @id @default(uuid())
  userId    String
  badgeType BadgeType
  tier      BadgeTier
  earnedAt  DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, badgeType, tier])
  @@map("user_badges")
}
```

- One row per earned tier per user per badge type — never deleted
- `@@unique([userId, badgeType, tier])` prevents duplicate awards
- `User` model gets a `badges UserBadge[]` relation

---

## Badge Evaluation Helper — `src/lib/badges.ts`

Single shared module so action files don't duplicate logic.

### Exports

- **`BADGE_THRESHOLDS`**: `{ tier: BadgeTier; min: number }[]` ordered Iron → Iridium
- **`checkAndAwardBadges(userId, badgeType)`**: core helper (see below)
- **`tierLabel(tier)`**: `"Iron" | "Bronze" | … | "Iridium"`
- **`badgeLabel(badgeType)`**: `"Pantry Pioneer" | "Recipe Author" | …`
- **`badgeSubtitle(badge)`**: human-readable toast body copy

### `checkAndAwardBadges` algorithm

1. Query the relevant count:
   - `PANTRY_PIONEER` → `db.pantryItem.count({ where: { userId } })`
   - `RECIPE_AUTHOR` → `db.recipe.count({ where: { authorId: userId, status: 'published', deletedAt: null } })`
   - `COMMUNITY_FAVORITE` → `db.favorite.count({ where: { recipe: { authorId: userId, deletedAt: null } } })`
   - `HIT_MAKER` → two-step: fetch the user's non-deleted recipe IDs, then `db.favorite.groupBy({ by: ['recipeId'], where: { recipeId: { in: recipeIds } }, _count: { _all: true } })` → take max. (Prisma `groupBy` does not support relation filters directly.)
2. Walk `BADGE_THRESHOLDS` to find all tiers where `count >= min`
3. Fetch already-earned tiers from `UserBadge` for `(userId, badgeType)`
4. Diff → `db.userBadge.createMany({ skipDuplicates: true })` for newly earned tiers (handles skip-a-tier correctly)
5. Return newly inserted `{ badgeType, tier }[]`

---

## Server Action Integration

### `src/lib/actions/pantry.ts`
- After `addPantryItem` succeeds: `checkAndAwardBadges(userId, 'PANTRY_PIONEER')`
- Return type extended with `newBadges?: { badgeType: BadgeType; tier: BadgeTier }[]`

### `src/lib/actions/recipes.ts`
- After `createRecipe` / `updateRecipe` when `publish === true`: `checkAndAwardBadges(userId, 'RECIPE_AUTHOR')`
- Return type extended with `newBadges?`

### `src/lib/actions/favorites.ts`
- After a **favorite** (not unfavorite): call both badge types for `recipe.authorId`
- **Toast recipient rule**: only include `newBadges` in the return payload when `recipe.authorId === currentUserId`. When favoriting someone else's recipe, awards are written to the DB silently — the author sees updated badges on their next profile visit. This prevents the favoriter from seeing a toast about someone else's achievement.
- Return type extended with `newBadges?`

---

## Toast Notifications

`useToast()` from `src/lib/toast.tsx` is already wired app-wide. No new toast infrastructure needed.

**`FavoriteButton` and pantry add handler** (client components):
```typescript
const toast = useToast()
const result = await toggleFavorite(recipeId, recipeSlug)
result.newBadges?.forEach(b =>
  toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
)
```

**`RecipeForm`** (uses `useActionState` — side effects via `useEffect`):
```typescript
useEffect(() => {
  state.newBadges?.forEach(b =>
    toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
  )
}, [state.newBadges])
```

---

## Profile Page — Badge Display

### Data fetching (`src/app/profile/page.tsx`)

Parallel fetch of badge rows and live counts:
```typescript
const [badges, pantryCt, recipeCt, communityFavCt, hitMakerCt] = await Promise.all([
  db.userBadge.findMany({ where: { userId }, orderBy: { earnedAt: 'asc' } }),
  db.pantryItem.count({ where: { userId } }),
  db.recipe.count({ where: { authorId: userId, status: 'published', deletedAt: null } }),
  db.favorite.count({ where: { recipe: { authorId: userId, deletedAt: null } } }),
  // two-step HIT_MAKER max
  ...
])
```

### `BadgeGrid` component (`src/components/profile/BadgeGrid.tsx`)

Server Component. 4-card responsive grid:
- **Mobile**: 2 columns (2×2)
- **Desktop**: 4 columns (1 row)

Each earned card shows: badge name, current tier, `earnedAt` date, progress hint ("18 more to Gold") — progress hint **desktop only** via CSS.

Locked (unearned) cards show: badge name, "Not yet earned", what Iron requires ("Add 3 pantry items to unlock").

---

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add enums + `UserBadge` model + `User` relation |
| `src/lib/badges.ts` | **New** |
| `src/lib/actions/pantry.ts` | Badge hook + return type |
| `src/lib/actions/recipes.ts` | Badge hook on publish + return type |
| `src/lib/actions/favorites.ts` | Badge hook (×2, silent for other-user) + return type |
| `src/app/profile/page.tsx` | Parallel badge queries + render `<BadgeGrid>` |
| `src/components/profile/BadgeGrid.tsx` | **New** |
| `src/components/profile/BadgeGrid.module.css` | **New** |

---

## Verification

1. `npx prisma migrate dev` runs cleanly
2. `yarn build` passes TypeScript
3. `yarn test` — unit tests for `checkAndAwardBadges`: zero count, exact threshold, between thresholds, skip-multiple-tiers, already-earned-no-duplicate
4. Manual:
   - Add 3 pantry items → Iron "Pantry Pioneer" toast
   - Publish a recipe → Iron "Recipe Author" toast
   - Have someone else favorite your recipe (or use two accounts) → silent award; profile shows badge
   - Visit `/profile` → all 4 badge cards render correctly, locked cards show unlock hint
5. Edge case: unfavoriting does not revoke a badge (badges permanent)
