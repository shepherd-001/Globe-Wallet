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

async function reviewAndConfirm(page: Page) {
  await page.getByTestId('review-button').click()
  await expect(page.getByTestId('confirm-send-button')).toBeVisible({ timeout: 10000 })
  await page.getByTestId('confirm-send-button').click()
}

test.describe('Wallet Send E2E Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/send')
        await waitForSendFormReady(page)
    })

    test('should show validation error for invalid Stellar address', async ({ page }) => {
        await typeIntoInput(page, 'address-input', 'invalid-address')
        await typeIntoInput(page, 'amount-input', '100.5')
        await page.getByTestId('review-button').click()

        const errorAlert = page.locator('[data-testid="send-error"]')
        await expect(errorAlert).toBeVisible()
        await expect(errorAlert).toContainText('Invalid Stellar address')

        await expect(page.getByTestId('address-input')).toHaveAttribute('aria-invalid', 'true')
    })

    test('should show validation error for negative or zero amount', async ({ page }) => {
        await typeIntoInput(page, 'address-input', 'GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX')
        await typeIntoInput(page, 'amount-input', '-10')
        await page.getByTestId('review-button').click()

        const errorAlert = page.locator('[data-testid="send-error"]')
        await expect(errorAlert).toBeVisible()
        await expect(errorAlert).toContainText(/valid amount/i)
    })

    test('should complete a successful payment transfer and reset form', async ({ page }) => {
        await typeIntoInput(page, 'address-input', 'GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX')
        await typeIntoInput(page, 'amount-input', '25.5')
        await typeIntoInput(page, 'memo-input', 'E2E Test Transfer')

        await reviewAndConfirm(page)

        const successAlert = page.locator('[data-testid="send-success"]')
        await expect(successAlert).toBeVisible()
        await expect(successAlert).toContainText('Transaction Successful')
        await expect(successAlert).toContainText('Hash:')

        await page.getByTestId('send-again-btn').click()

        await expect(page.getByTestId('address-input')).toHaveValue('')
        await expect(page.getByTestId('amount-input')).toHaveValue('')
        await expect(page.getByTestId('memo-input')).toHaveValue('')
    })
})
