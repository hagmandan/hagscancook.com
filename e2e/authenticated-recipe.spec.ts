import { expect, test } from '@playwright/test'

test('authenticated user can view a seeded recipe', async ({ context, page }) => {
  await context.addCookies([
    {
      name: '__session',
      value: 'e2e-session',
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])

  await page.goto('/recipes/e2e-weeknight-tomato-pasta')

  await expect(
    page.getByRole('heading', { name: 'Weeknight Tomato Pasta' })
  ).toBeVisible()
  await expect(page.getByText('Recipe by')).toBeVisible()
  await expect(page.getByText('E2E Cook')).toBeVisible()
  await expect(page.getByText('8 oz')).toBeVisible()
  await expect(page.getByText('spaghetti', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Boil the spaghetti until al dente')
  ).toBeVisible()
  await expect(page.getByTestId('favorite-button')).toBeVisible()
  await expect(
    page.getByText('Sign up to view the full recipe')
  ).toHaveCount(0)
})
