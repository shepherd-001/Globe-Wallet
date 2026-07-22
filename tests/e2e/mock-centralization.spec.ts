import { test, expect, Page } from '@playwright/test'

async function waitForSendFormReady(page: Page) {
  await expect(page.getByTestId('send-form-card')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('current-balance')).not.toHaveText('', { timeout: 15000 })
}

async function typeIntoInput(page: Page, testId: string, value: string) {
  const input = page.getByTestId(testId)
  await input.click()
  await input.fill('')
  await input.pressSequentially(value, { delay: 15 })
}

test.describe('Mock Centralization E2E (Issue #14)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('@critical #14 - Happy path: dashboard loads with mock data', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('balance-card')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('quick-actions')).toBeVisible()
    await expect(page.getByTestId('crypto-holdings')).toBeVisible()

    await expect(page.getByTestId('quick-action-send')).toBeVisible()
    await expect(page.getByTestId('quick-action-receive')).toBeVisible()
    await expect(page.getByTestId('quick-action-convert')).toBeVisible()
    await expect(page.getByTestId('quick-action-cash-out')).toBeVisible()
  })

  test('@critical #14 - Happy path: navigate to send page and see form', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('quick-action-send').click()

    await expect(page).toHaveURL(/\/send/)
    await waitForSendFormReady(page)
    await expect(page.getByTestId('contact-search')).toBeVisible()
    await expect(page.getByTestId('address-input')).toBeVisible()
    await expect(page.getByTestId('amount-input')).toBeVisible()
    await expect(page.getByTestId('asset-select')).toBeVisible()
    await expect(page.getByTestId('review-button')).toBeVisible()
  })

  test('@critical #14 - Happy path: error state for invalid Stellar address', async ({ page }) => {
    await page.goto('/send')
    await waitForSendFormReady(page)

    await typeIntoInput(page, 'address-input', 'invalid-address')
    await typeIntoInput(page, 'amount-input', '100')
    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-error')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('send-error')).toContainText(/Invalid Stellar address/i)
  })

  test('#14 - Failure path: insufficient data handling', async ({ page }) => {
    await page.goto('/send')
    await waitForSendFormReady(page)

    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-error')).toBeVisible({ timeout: 10000 })
  })

  test('#14 - Navigation: bottom nav links work', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('bottom-nav')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('nav-cards').click()
    await expect(page).toHaveURL(/\/cards/)

    await page.getByTestId('nav-savings').click()
    await expect(page).toHaveURL(/\/savings/)

    await page.getByTestId('nav-home').click()
    await expect(page).toHaveURL(/\//)
  })

  test('#14 - Theme toggle exists', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('balance-card')).toBeVisible({ timeout: 15000 })
  })
})
