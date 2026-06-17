import { test, expect } from '@playwright/test'

const VALID_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

test.describe('Send Flow — E2E (#23)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/send')
  })

  test('happy path: select contact, review, and confirm send', async ({ page }) => {
    // Type in contact search to trigger dropdown
    const contactSearch = page.getByTestId('contact-search')
    await contactSearch.fill('Ada')

    // Select contact from list
    const contactOption = page.getByTestId('contact-option-c1')
    await expect(contactOption).toBeVisible({ timeout: 5000 })
    await contactOption.click()

    // Selected contact badge should appear
    await expect(page.getByTestId('selected-contact')).toBeVisible()

    // Enter amount
    await page.getByLabel('Amount').fill('10')

    // Click Review Send
    await page.getByTestId('review-button').click()

    // Confirmation step
    await expect(page.getByTestId('send-summary')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('summary-amount')).toContainText('10')

    // Confirm
    await page.getByTestId('confirm-send-button').click()

    // Success message
    await expect(page.getByTestId('send-success')).toBeVisible({ timeout: 10000 })
  })

  test('failure path: invalid address shows error, stays on form', async ({ page }) => {
    // Ensure contact search is empty so manual address input is visible
    const addressInput = page.getByLabel('Recipient Address')
    await addressInput.fill('not-a-valid-stellar-address')
    await page.getByLabel('Amount').fill('5')
    await page.getByTestId('review-button').click()

    // Error should appear, confirm button should NOT be present
    await expect(page.getByTestId('send-error')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('send-error')).toContainText(/Invalid Stellar address/i)
    await expect(page.getByTestId('confirm-send-button')).not.toBeVisible()
  })

  test('back button returns to form from confirmation step', async ({ page }) => {
    await page.getByLabel('Recipient Address').fill(VALID_ADDRESS)
    await page.getByLabel('Amount').fill('1')
    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-summary')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('back-button').click()

    await expect(page.getByTestId('review-button')).toBeVisible()
  })
})
