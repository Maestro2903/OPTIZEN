import { test, expect } from '@playwright/test'

test.describe('Beds (public behaviour without login)', () => {
  test('beds route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/beds')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('beds redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/beds')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/beds')
  })

  test('beds redirect shows login CTA content', async ({ page }) => {
    await page.goto('/beds')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







