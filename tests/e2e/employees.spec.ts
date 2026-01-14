import { test, expect } from '@playwright/test'

test.describe('Employees (public behaviour without login)', () => {
  test('employees route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/employees')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('employees redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/employees')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/employees')
  })

  test('employees redirect shows login CTA content', async ({ page }) => {
    await page.goto('/employees')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







