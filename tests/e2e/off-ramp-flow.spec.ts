/**
 * E2E — Off-ramp / Cash Out Flow (issue #25)
 * Covers: withdraw tab, payment method selection, summary, failure path, methods tab.
 */
import { test, expect } from '@playwright/test'

test.describe('Off-ramp Flow — Withdraw tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/off-ramp')
  })

  // ── happy path ──────────────────────────────────────────────────────────────

  test('loads the Cash Out page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /cash out/i })).toBeVisible({ timeout: 5000 })
  })

  test('withdraw tab is active by default', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /withdraw/i })
    await expect(tab).toHaveAttribute('data-state', 'active')
  })

  test('shows amount input and asset selector', async ({ page }) => {
    await expect(page.getByRole('spinbutton')).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('selecting a payment method highlights it', async ({ page }) => {
    // First enabled bank option
    const methods = page.locator('[class*="border rounded-lg cursor-pointer"]')
    const firstEnabled = methods.first()
    await firstEnabled.click()
    // Should have border-primary styling after selection
    await expect(firstEnabled).toHaveClass(/border-primary/)
  })

  test('transaction summary appears after entering amount and selecting method', async ({ page }) => {
    await page.getByRole('spinbutton').fill('100')
    const methods = page.locator('[class*="border rounded-lg cursor-pointer"]')
    await methods.first().click()
    await expect(page.getByText(/transaction summary/i)).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/you'll receive/i)).toBeVisible()
  })

  test('Withdraw button is disabled when no amount or method is set', async ({ page }) => {
    const btn = page.getByRole('button', { name: /withdraw to bank/i })
    await expect(btn).toBeDisabled()
  })

  // ── failure paths ───────────────────────────────────────────────────────────

  test('shows error when withdraw is clicked with no payment method', async ({ page }) => {
    await page.getByRole('spinbutton').fill('50')
    await page.getByRole('button', { name: /withdraw to bank/i }).click()
    await expect(
      page.locator('[data-sonner-toast]').or(page.getByText(/select a payment method/i))
    ).toBeVisible({ timeout: 5000 })
  })

  test('shows error when amount exceeds balance', async ({ page }) => {
    await page.getByRole('spinbutton').fill('99999')
    const methods = page.locator('[class*="border rounded-lg cursor-pointer"]')
    await methods.first().click()
    await page.getByRole('button', { name: /withdraw to bank/i }).click()
    await expect(
      page.locator('[data-sonner-toast]').or(page.getByText(/insufficient/i))
    ).toBeVisible({ timeout: 5000 })
  })

  // ── methods tab ─────────────────────────────────────────────────────────────

  test('Methods tab shows payment method list', async ({ page }) => {
    await page.getByRole('tab', { name: /payment methods/i }).click()
    await expect(page.getByText(/your payment methods/i)).toBeVisible({ timeout: 3000 })
    // At least one method card is rendered
    await expect(page.locator('h3, [class*="font-medium"]').filter({ hasText: /Chase|Wells|Visa/i }).first()).toBeVisible()
  })
})
