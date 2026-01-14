import { test, expect } from '@playwright/test'

test.describe('Cases (public behaviour without login)', () => {
  test('cases route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/cases')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('cases redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/cases')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/cases')
  })

  test('cases redirect shows login CTA content', async ({ page }) => {
    await page.goto('/cases')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







