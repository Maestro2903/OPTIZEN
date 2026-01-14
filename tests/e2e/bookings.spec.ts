import { test, expect } from '@playwright/test'

test.describe('Bookings page (public access)', () => {
  test('bookings page is reachable without login', async ({ page }) => {
    await page.goto('/bookings')
    await expect(page).toHaveURL(/\/bookings$/)
  })

  test('bookings page shows main heading and description', async ({ page }) => {
    await page.goto('/bookings')

    await expect(
      page.getByRole('heading', { name: /bookings/i })
    ).toBeVisible()

    await expect(
      page.getByText('Manage appointment requests from the public booking form')
    ).toBeVisible()
  })

  test('bookings page shows Book Appointment CTA button', async ({ page }) => {
    await page.goto('/bookings')

    await expect(
      page.getByRole('button', { name: /book appointment/i })
    ).toBeVisible()
  })
})



