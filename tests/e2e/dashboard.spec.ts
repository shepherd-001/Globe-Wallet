import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
  })

  test('should display balances and allow navigating to send form', async ({ page }) => {
    await expect(page.getByTestId('balance-card')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('dashboard-overview')).toBeVisible()

    await page.getByRole('link', { name: 'Send' }).click()
    await expect(page.getByRole('heading', { name: 'Send Money' })).toBeVisible()
  })

  test('should show error for invalid address in send form', async ({ page }) => {
    await page.getByRole('link', { name: 'Send' }).click()
    await page.getByLabel('Recipient Address').fill('invalid-address')
    await page.getByLabel('Amount').fill('100')
    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-error')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('send-error')).toContainText(/Invalid Stellar address/i)
  })
})
