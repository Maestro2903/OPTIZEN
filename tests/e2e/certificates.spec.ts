import { test, expect } from '@playwright/test'

test.describe('Certificates (public behaviour without login)', () => {
  test('certificates route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/certificates')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('certificates redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/certificates')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/certificates')
  })

  test('certificates redirect shows login CTA content', async ({ page }) => {
    await page.goto('/certificates')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







