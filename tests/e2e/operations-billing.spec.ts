import { test, expect } from '@playwright/test'

test.describe('Operations & Billing (public behaviour without login)', () => {
  test('operations, billing and revenue routes redirect to login when not authenticated', async ({ page }) => {
    const protectedPaths = ['/operations', '/billing', '/revenue']

    for (const path of protectedPaths) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/auth\/login/)
    }
  })
})






