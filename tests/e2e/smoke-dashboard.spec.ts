import { test, expect } from '@playwright/test'

test.describe('Dashboard navigation smoke', () => {
  test('landing page is reachable', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Optizen|Eye/i)
  })

  test('redirects to login when opening dashboard sections', async ({ page }) => {
    const sections = [
      '/patients',
      '/appointments',
      '/operations',
      '/pharmacy',
      '/billing',
      '/revenue',
    ]

    for (const path of sections) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/auth\/login/)
    }
  })
})


