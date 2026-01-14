import { test, expect } from '@playwright/test'

test.describe('Optical Plan (public behaviour without login)', () => {
  test('optical plan route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/optical-plan')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('optical plan redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/optical-plan')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/optical-plan')
  })

  test('optical plan redirect shows login CTA content', async ({ page }) => {
    await page.goto('/optical-plan')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







