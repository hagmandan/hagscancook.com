import { expect, test } from '@playwright/test'

const authCookie = {
  name: '__session',
  value: 'e2e-session',
  url: 'http://localhost:3000',
  httpOnly: true,
  sameSite: 'Lax' as const,
}

test.describe('Recipe feed pagination', () => {
  test('shows Load More button when more than 20 recipes exist', async ({
    context,
    page,
  }) => {
    await context.addCookies([authCookie])
    await page.goto('/recipes')

    const cards = page.getByRole('list').getByRole('listitem')
    await expect(cards).toHaveCount(20)

    await expect(
      page.getByRole('button', { name: 'Load more recipes' })
    ).toBeVisible()
  })

  test('Load More appends additional recipe cards', async ({
    context,
    page,
  }) => {
    await context.addCookies([authCookie])
    await page.goto('/recipes')

    const cards = page.getByRole('list').getByRole('listitem')
    await expect(cards).toHaveCount(20)

    await page.getByRole('button', { name: 'Load more recipes' }).click()

    // After loading more, there should be more than 20 cards
    await expect(cards).not.toHaveCount(20)
    const count = await cards.count()
    expect(count).toBeGreaterThan(20)
  })

  test('Load More button disappears when all recipes are loaded', async ({
    context,
    page,
  }) => {
    await context.addCookies([authCookie])
    await page.goto('/recipes')

    // Keep clicking Load More until it disappears
    let loadMoreVisible = true
    while (loadMoreVisible) {
      const button = page.getByRole('button', { name: 'Load more recipes' })
      loadMoreVisible = await button.isVisible()
      if (loadMoreVisible) {
        await button.click()
        // Wait for the button to settle: either disappears (last page) or re-enables (more pages)
        await page.waitForFunction(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          const loadMoreBtn = buttons.find(
            (b) =>
              b.textContent?.includes('Load more') ||
              b.textContent?.includes('Loading')
          )
          if (!loadMoreBtn) return true // button gone = last page loaded
          return loadMoreBtn.textContent?.includes('Load more recipes') // button re-enabled
        }, { timeout: 10000 })
      }
    }

    await expect(
      page.getByRole('button', { name: 'Load more recipes' })
    ).not.toBeVisible()

    // All recipes should be loaded and there should be more than 20
    const cards = page.getByRole('list').getByRole('listitem')
    const count = await cards.count()
    expect(count).toBeGreaterThan(20)
  })
})
