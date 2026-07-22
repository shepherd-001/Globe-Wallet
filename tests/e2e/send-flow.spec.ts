import { test, expect, Page } from '@playwright/test'

const VALID_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

async function waitForSendFormReady(page: Page) {
  await expect(page.getByTestId('send-form-card')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('current-balance')).not.toHaveText('', { timeout: 15000 })
}

/** WebKit can miss React state updates from fill(); sequential typing is more reliable. */
async function typeIntoInput(page: Page, testId: string, value: string) {
  const input = page.getByTestId(testId)
  await input.click()
  await input.fill('')
  await input.pressSequentially(value, { delay: 15 })
}

async function searchContact(page: Page, query: string) {
  const contactSearch = page.getByTestId('contact-search')
  await contactSearch.click()
  await contactSearch.fill('')
  await contactSearch.pressSequentially(query, { delay: 15 })
  await expect(page.getByTestId('contact-list')).toBeVisible({ timeout: 10000 })
}

// ── Issue #11 — Federated address E2E ────────────────────────────────────────

test.describe('Send Flow — Issue #11 Federated Address', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/send')
    await waitForSendFormReady(page)
  })

  test('happy path: type federated address, wait for resolution, send succeeds', async ({ page }) => {
    // Type the federated address supported by the mock registry
    await typeIntoInput(page, 'address-input', 'alice*stellar.org')

    // Badge should appear in resolving state, then resolved
    await expect(page.getByTestId('lookup-resolving')).toBeVisible({ timeout: 3000 })
    await expect(page.getByTestId('lookup-resolved')).toBeVisible({ timeout: 5000 })

    // The resolved badge should show a shortened public key
    const badge = page.getByTestId('lookup-resolved')
    await expect(badge).toContainText('GDXSPAY')

    // Enter amount and proceed
    await typeIntoInput(page, 'amount-input', '5')
    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-summary')).toBeVisible({ timeout: 10000 })

    // Summary should show the federated name with resolved key
    const recipient = page.getByTestId('summary-recipient')
    await expect(recipient).toContainText('alice*stellar.org')

    await page.getByTestId('confirm-send-button').click()
    await expect(page.getByTestId('send-success')).toBeVisible({ timeout: 10000 })
  })

  test('failure path: unknown federated address shows not-found badge and blocks submit', async ({ page }) => {
    await typeIntoInput(page, 'address-input', 'nobody*unknown-domain.xyz')
    await typeIntoInput(page, 'amount-input', '1')

    await expect(page.getByTestId('lookup-not-found')).toBeVisible({ timeout: 5000 })

    await page.getByTestId('review-button').click()
    await expect(page.getByTestId('send-error')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('send-error')).toContainText(/No federation record/i)
  })
})

// ── Issue #23 (original) ──────────────────────────────────────────────────────

test.describe('Send Flow — E2E (#23)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/send')
    await waitForSendFormReady(page)
  })

  test('happy path: select contact, review, and confirm send', async ({ page }) => {
    await searchContact(page, 'Ada')

    const contactOption = page.getByTestId('contact-option-c1')
    await expect(contactOption).toBeVisible({ timeout: 10000 })
    await contactOption.click()

    await expect(page.getByTestId('selected-contact')).toBeVisible()

    await typeIntoInput(page, 'amount-input', '10')

    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-summary')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('summary-amount')).toContainText('10')

    await page.getByTestId('confirm-send-button').click()

    await expect(page.getByTestId('send-success')).toBeVisible({ timeout: 10000 })
  })

  test('failure path: invalid address shows error, stays on form', async ({ page }) => {
    await typeIntoInput(page, 'address-input', 'not-a-valid-stellar-address')
    await typeIntoInput(page, 'amount-input', '5')
    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-error')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('send-error')).toContainText(/Invalid Stellar address/i)
    await expect(page.getByTestId('confirm-send-button')).not.toBeVisible()
  })

  test('back button returns to form from confirmation step', async ({ page }) => {
    await typeIntoInput(page, 'address-input', VALID_ADDRESS)
    await typeIntoInput(page, 'amount-input', '1')
    await page.getByTestId('review-button').click()

    await expect(page.getByTestId('send-summary')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('back-button').click()

    await expect(page.getByTestId('review-button')).toBeVisible()
  })
})
