import { test, expect } from '@playwright/test'

test.describe('Access Control (public behaviour without login)', () => {
  test('access control route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/access-control')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('access control redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/access-control')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/access-control')
  })

  test('access control redirect shows login CTA content', async ({ page }) => {
    await page.goto('/access-control')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







