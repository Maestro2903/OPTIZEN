import { test, expect } from '@playwright/test'

test.describe('Discharges (public behaviour without login)', () => {
  test('discharges route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/discharges')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('discharges redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/discharges')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/discharges')
  })

  test('discharges redirect shows login CTA content', async ({ page }) => {
    await page.goto('/discharges')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







