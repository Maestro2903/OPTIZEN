import { test, expect } from '@playwright/test'

test.describe('My Schedule (public behaviour without login)', () => {
  test('doctor schedule route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/doctor-schedule')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('doctor schedule redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/doctor-schedule')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/doctor-schedule')
  })

  test('doctor schedule redirect shows login CTA content', async ({ page }) => {
    await page.goto('/doctor-schedule')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







