/**
 * E2E — Savings, Cards, and Profile pages (issue #25)
 * Smoke tests verifying each page loads and key elements are present.
 */
import { test, expect } from '@playwright/test'

// ── Savings ───────────────────────────────────────────────────────────────────

test.describe('Savings page', () => {
  test('loads with a page header', async ({ page }) => {
    await page.goto('/savings')
    await expect(page.getByRole('heading', { name: /savings/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows at least one savings goal', async ({ page }) => {
    await page.goto('/savings')
    // SavingsView renders goal cards — check for a progress element as a proxy
    const goals = page.locator('[role="progressbar"]')
    await expect(goals.first()).toBeVisible({ timeout: 5000 })
  })

  test('back button is present and links to home', async ({ page }) => {
    await page.goto('/savings')
    const back = page.getByRole('link', { name: /go back/i })
    await expect(back).toBeVisible()
    await expect(back).toHaveAttribute('href', '/')
  })
})

// ── Cards ────────────────────────────────────────────────────────────────────

test.describe('Cards page', () => {
  test('loads with a page header', async ({ page }) => {
    await page.goto('/cards')
    await expect(page.getByRole('heading', { name: /cards/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows at least one payment card', async ({ page }) => {
    await page.goto('/cards')
    // CardsView renders card items — look for card last4 digits pattern
    const cardText = page.getByText(/\d{4}/).first()
    await expect(cardText).toBeVisible({ timeout: 5000 })
  })
})

// ── Profile ───────────────────────────────────────────────────────────────────

test.describe('Profile page', () => {
  test('loads with a page header', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({ timeout: 5000 })
  })

  test('page body renders without crashing', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('body')).toBeVisible()
  })
})
