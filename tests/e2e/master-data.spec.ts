import { test, expect } from '@playwright/test'

test.describe('Master Data (public behaviour without login)', () => {
  test('master data route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/master')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('master data redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/master')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/master')
  })

  test('master data redirect shows login CTA content', async ({ page }) => {
    await page.goto('/master')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







