import { test, expect } from '@playwright/test'

test.describe('Old Patient Records (public behaviour without login)', () => {
  test('old patient records route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/old-patient-records')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('old patient records redirect adds redirectedFrom query param', async ({ page }) => {
    await page.goto('/old-patient-records')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/auth/login')
    expect(current.searchParams.get('redirectedFrom')).toBe('/old-patient-records')
  })

  test('old patient records redirect shows login CTA content', async ({ page }) => {
    await page.goto('/old-patient-records')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})



