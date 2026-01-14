import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/patients')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })
})






