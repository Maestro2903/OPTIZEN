import { test, expect } from '@playwright/test'

test.describe('Medical Records (public behaviour without login)', () => {
  test('medical records route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/medical-records')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('medical records redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/medical-records')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/medical-records')
  })

  test('medical records redirect shows login CTA content', async ({ page }) => {
    await page.goto('/medical-records')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







