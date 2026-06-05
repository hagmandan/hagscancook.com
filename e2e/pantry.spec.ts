import { expect, test } from '@playwright/test'

// The seeded e2e-user has a pantry with olive oil, spaghetti, and parmesan.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: '__session',
      value: 'e2e-session',
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
})

test('user can view, add, edit, and remove pantry items', async ({ page }) => {
  await page.goto('/pantry')

  await expect(page.getByRole('heading', { name: 'Pantry' })).toBeVisible()

  // Seeded items are visible, grouped by category.
  await expect(page.getByText('spaghetti', { exact: true })).toBeVisible()
  await expect(page.getByText('olive oil', { exact: true })).toBeVisible()

  // Quick-add a new ingredient.
  await page.getByTestId('pantry-add-name').fill('basil')
  await page.getByTestId('pantry-add-amount').fill('1')
  await page.getByTestId('pantry-add-submit').click()

  const basilRow = page.getByRole('listitem').filter({ hasText: 'basil' })
  await expect(basilRow).toBeVisible()

  // Edit it: open inline edit and change the amount (scoped to the row to
  // avoid the quick-add field that shares the "Amount" label).
  await page.getByRole('button', { name: 'Edit basil' }).click()
  await basilRow.getByLabel('Amount').fill('2')
  await basilRow.getByRole('button', { name: 'Save' }).click()
  await expect(basilRow.getByText('2', { exact: true })).toBeVisible()

  // Remove it.
  await page.getByRole('button', { name: 'Remove basil' }).click()
  await expect(page.getByText('basil', { exact: true })).toHaveCount(0)
})
