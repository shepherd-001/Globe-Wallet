import { test, expect } from '@playwright/test'

test.describe('Issue #30 — Dashboard Service Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('happy path: home dashboard shows balance and recent transactions', async ({ page }) => {
    await expect(page.getByTestId('balance-card')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('total-value')).toBeVisible()
    await expect(page.getByTestId('transaction-list')).toBeVisible({ timeout: 10000 })

    const firstTx = page.locator('[data-testid^="transaction-"]').first()
    await expect(firstTx).toBeVisible()
  })

  test('failure path: API outage does not crash the page', async ({ page }) => {
    await page.route('**/api/transactions**', (route) => route.abort())

    await page.reload()
    await expect(page.getByTestId('balance-card')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('body')).toBeVisible()
  })
})
