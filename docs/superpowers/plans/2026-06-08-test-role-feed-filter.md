# Test Role Feed Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent e2e/dev seed recipes from appearing in the public recipe feed by introducing a `test` role that is excluded from all feed queries.

**Architecture:** Add `test` to the Prisma `Role` enum (which maps to a PostgreSQL enum), assign it to the e2e seed user, and filter both feed query sites (`getRecipes` server component + `loadMoreRecipes` server action) to exclude recipes authored by `test`-role users. The admin role-select UI gets a display-only disabled option so the role renders correctly in the admin panel without being assignable.

**Tech Stack:** Prisma 7, Neon PostgreSQL, Next.js 15 App Router, Vitest

---

## Files

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Modify | `prisma/dev-seed.ts` |
| Modify | `src/lib/actions/recipes.ts` |
| Modify | `src/lib/actions/recipes.test.ts` |
| Modify | `src/app/recipes/page.tsx` |
| Modify | `src/app/admin/users/AdminRoleSelect.tsx` |

> **Important:** The E2E pagination tests (`e2e/pagination.spec.ts`) authenticate as `e2e-user` and navigate to `/recipes`, expecting 20+ published recipes. After this change, the feed excludes test-role authors — so the e2e user's 25 pagination recipes will no longer appear there. Task 2 addresses this by introducing a separate `e2e-pagination-user` with `role: 'user'` to own those fixtures.

---

### Task 1: Add `test` to the Role enum and migrate

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `test` to the Role enum**

In `prisma/schema.prisma`, change:

```prisma
enum Role {
  user
  chef
  admin
}
```

to:

```prisma
enum Role {
  user
  chef
  admin
  test
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_test_role
```

Expected output includes: `✓ Generated Prisma Client` and a new migration file in `prisma/migrations/`.

- [ ] **Step 3: Commit schema + migration**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add test role to Role enum"
```

---

### Task 2: Update seed — test role for e2e user, real user for pagination fixtures

**Files:**
- Modify: `prisma/dev-seed.ts`

The `e2e-user` gets `role: 'test'` so its recipes are hidden from the public feed. A new `e2e-pagination-user` (with `role: 'user'`) owns the 25 pagination fixture recipes so they still appear in the public `/recipes` feed for the pagination E2E tests.

- [ ] **Step 1: Add the pagination user constant and update E2E_USER role**

In `prisma/dev-seed.ts`, change:

```ts
const E2E_USER = {
  firebaseUid: 'e2e-user',
  email: 'e2e-user@hagscancook.test',
  displayName: 'E2E Cook',
  role: 'user' as const,
}
```

to:

```ts
const E2E_USER = {
  firebaseUid: 'e2e-user',
  email: 'e2e-user@hagscancook.test',
  displayName: 'E2E Cook',
  role: 'test' as const,
}

const PAGINATION_USER = {
  firebaseUid: 'e2e-pagination-user',
  email: 'e2e-pagination-user@hagscancook.test',
  displayName: 'E2E Pagination Cook',
  role: 'user' as const,
}
```

- [ ] **Step 2: Upsert the pagination user in `upsertE2ERecipe` (or a new helper)**

In `prisma/dev-seed.ts`, replace the `upsertPaginationRecipes` function with one that looks up or creates `PAGINATION_USER`:

```ts
async function upsertPaginationRecipes() {
  const paginationUser = await prisma.user.upsert({
    where: { firebaseUid: PAGINATION_USER.firebaseUid },
    update: {
      email: PAGINATION_USER.email,
      displayName: PAGINATION_USER.displayName,
      role: PAGINATION_USER.role,
    },
    create: PAGINATION_USER,
  })

  for (let i = 1; i <= 25; i++) {
    await prisma.recipe.upsert({
      where: { slug: `e2e-pagination-recipe-${i}` },
      update: {},
      create: {
        slug: `e2e-pagination-recipe-${i}`,
        title: `Pagination Test Recipe ${i}`,
        description: `A simple recipe for pagination testing (${i}).`,
        status: 'published',
        authorId: paginationUser.id,
      },
    })
  }
  console.log('  ✓ 25 pagination test recipes seeded')
}
```

- [ ] **Step 3: Run the dev seed to confirm it applies**

```bash
npx tsx prisma/dev-seed.ts
```

Expected: `✅ Development seed complete.` with no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/dev-seed.ts
git commit -m "feat: assign test role to e2e user, add pagination user with real role"
```

---

### Task 3: Filter test-role authors from `loadMoreRecipes` + add unit test

**Files:**
- Modify: `src/lib/actions/recipes.ts`
- Modify: `src/lib/actions/recipes.test.ts`

- [ ] **Step 1: Write the failing test**

Add to the `describe('loadMoreRecipes', ...)` block in `src/lib/actions/recipes.test.ts`, after the existing filter tests (around line 253):

```ts
it('excludes recipes authored by test-role users', async () => {
  mockFindMany.mockResolvedValue([])

  await loadMoreRecipes('abc', {})

  expect(mockFindMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        author: { role: { not: 'test' } },
      }),
    }),
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn test src/lib/actions/recipes.test.ts
```

Expected: the new test fails with something like `Expected: ObjectContaining {"author": ...}` not found.

- [ ] **Step 3: Add the filter to `loadMoreRecipes`**

In `src/lib/actions/recipes.ts`, find the `where` object inside `loadMoreRecipes` (around line 315) and add the `author` filter:

```ts
const where: Prisma.RecipeWhereInput = {
  status: 'published',
  deletedAt: null,
  author: { role: { not: 'test' } },
  ...(filters.cuisine ? { cuisine: filters.cuisine } : {}),
  ...(filters.dietary ? { dietaryRestrictions: { has: filters.dietary } } : {}),
  ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
yarn test src/lib/actions/recipes.test.ts
```

Expected: all tests in the file pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/recipes.ts src/lib/actions/recipes.test.ts
git commit -m "feat: exclude test-role authors from recipe feed"
```

---

### Task 4: Filter test-role authors from the initial page query

**Files:**
- Modify: `src/app/recipes/page.tsx`

- [ ] **Step 1: Add the author filter to `getRecipes`**

In `src/app/recipes/page.tsx`, find the `where` object in `getRecipes` (around line 35) and add the same `author` filter:

```ts
const where: Prisma.RecipeWhereInput = {
  status: 'published',
  deletedAt: null,
  author: { role: { not: 'test' } },
}
```

- [ ] **Step 2: Run the full test suite to confirm no regressions**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/recipes/page.tsx
git commit -m "feat: exclude test-role authors from initial recipe feed query"
```

---

### Task 5: Display `test` role correctly in the admin UI

**Files:**
- Modify: `src/app/admin/users/AdminRoleSelect.tsx`

The `AdminRoleSelect` dropdown uses `defaultValue={currentRole}`. Without a matching `<option>`, a user with `role: 'test'` would show a blank or wrong selection. Add a disabled option so the value displays correctly without being assignable.

- [ ] **Step 1: Add the disabled `test` option**

In `src/app/admin/users/AdminRoleSelect.tsx`, change:

```tsx
<option value="user">user</option>
<option value="chef">chef</option>
<option value="admin">admin</option>
```

to:

```tsx
<option value="user">user</option>
<option value="chef">chef</option>
<option value="admin">admin</option>
<option value="test" disabled>test (system)</option>
```

- [ ] **Step 2: Run lint**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/users/AdminRoleSelect.tsx
git commit -m "fix: display test role correctly in admin user role select"
```

---

### Task 6: Verify end-to-end

- [ ] **Step 1: Run the full test suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 2: Run E2E tests**

```bash
yarn test:e2e
```

Expected: all tests pass. The pagination tests in `e2e/pagination.spec.ts` navigate to `/recipes` as `e2e-user` and see the 25 recipes owned by `e2e-pagination-user` (a `role: 'user'` account), which appear in the public feed.
