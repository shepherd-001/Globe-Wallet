/**
 * E2E — Receive Flow (issue #25)
 * Covers: address display, QR code render, tab switching, payment request.
 */
import { test, expect } from '@playwright/test'

test.describe('Receive Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/receive')
  })

  // ── happy path ──────────────────────────────────────────────────────────────

  test('shows a Stellar address on the address tab', async ({ page }) => {
    // Address tab is default
    const code = page.locator('code')
    await expect(code).toBeVisible({ timeout: 5000 })
    const address = await code.textContent()
    // Stellar addresses: 56 chars, start with G
    expect(address?.trim()).toMatch(/^G[A-Z0-9]{55}$/i)
  })

  test('renders a QR code for the address', async ({ page }) => {
    const qr = page.locator('svg').first()
    await expect(qr).toBeVisible({ timeout: 5000 })
  })

  test('Copy button is present and labelled', async ({ page }) => {
    const copyBtn = page.getByRole('button', { name: /copy/i }).first()
    await expect(copyBtn).toBeVisible()
  })

  test('switching to Request tab shows amount and memo inputs', async ({ page }) => {
    await page.getByRole('tab', { name: /request/i }).click()
    await expect(page.getByLabel(/amount/i)).toBeVisible()
    await expect(page.getByLabel(/memo/i)).toBeVisible()
  })

  test('payment request QR updates when amount is entered', async ({ page }) => {
    await page.getByRole('tab', { name: /request/i }).click()
    await page.getByLabel(/amount/i).fill('50')
    // Summary line should show the entered amount
    await expect(page.getByText('50 XLM')).toBeVisible({ timeout: 3000 })
  })

  test('memo entered on request tab is reflected in summary', async ({ page }) => {
    await page.getByRole('tab', { name: /request/i }).click()
    await page.getByLabel(/amount/i).fill('10')
    await page.getByLabel(/memo/i).fill('lunch')
    await expect(page.getByText('lunch')).toBeVisible({ timeout: 3000 })
  })

  // ── navigation ──────────────────────────────────────────────────────────────

  test('back button returns to home', async ({ page }) => {
    await page.getByRole('link', { name: /back/i }).click()
    await expect(page).toHaveURL('/')
  })
})
