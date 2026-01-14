import { test, expect } from '@playwright/test'

test.describe('Patients & Appointments (public behaviour without login)', () => {
  test('patients and appointments routes redirect to login when not authenticated', async ({ page }) => {
    const protectedPaths = ['/patients', '/appointments']

    for (const path of protectedPaths) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/auth\/login/)
    }
  })

  test('patients redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/patients')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/patients')
  })

  test('patients redirect shows login CTA content', async ({ page }) => {
    await page.goto('/patients')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})


