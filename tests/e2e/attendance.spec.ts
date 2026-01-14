import { test, expect } from '@playwright/test'

test.describe('Attendance (public behaviour without login)', () => {
  test('attendance route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/attendance')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('attendance redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/attendance')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/attendance')
  })

  test('attendance redirect shows login CTA content', async ({ page }) => {
    await page.goto('/attendance')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})







