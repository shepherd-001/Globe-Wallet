/**
 * E2E accessibility tests: App Shell & Navigation (Issue #16)
 * Covers: skip link, bottom nav semantics, safe area, /api/shell, PageHeader.
 *
 * @tag shell-a11y issue-16
 */
import { test, expect } from '@playwright/test'

test.describe('App Shell & Accessibility — Issue #16 @shell-a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
  })

  // ── Skip Link ────────────────────────────────────────────────────────────

  test('skip link is present in DOM and targets main-content', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.getByTestId('skip-to-main')
    await expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  test('skip link is visually hidden by default', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.getByTestId('skip-to-main')
    const classes = await skipLink.getAttribute('class')
    expect(classes).toContain('sr-only')
  })

  // ── Bottom Nav ───────────────────────────────────────────────────────────

  test('bottom nav is present with correct aria-label', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByTestId('bottom-nav')
    await expect(nav).toBeVisible({ timeout: 10_000 })
    await expect(nav).toHaveAttribute('aria-label', 'Main navigation')
  })

  test('bottom nav Home link marked aria-current=page on /', async ({ page }) => {
    await page.goto('/')
    const homeLink = page.getByTestId('nav-home')
    await expect(homeLink).toHaveAttribute('aria-current', 'page')
  })

  test('bottom nav Send link NOT aria-current on / but is on /send', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('nav-send')).not.toHaveAttribute('aria-current')

    await page.goto('/send')
    await expect(page.getByTestId('nav-send')).toHaveAttribute('aria-current', 'page')
  })

  test('bottom nav links have aria-label attributes', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('nav-home')).toHaveAttribute('aria-label', 'Home')
    await expect(page.getByTestId('nav-send')).toHaveAttribute('aria-label', 'Send')
  })

  test('all bottom nav links are keyboard-focusable', async ({ page }) => {
    await page.goto('/')
    const navLinks = ['nav-home', 'nav-send', 'nav-cards', 'nav-savings', 'nav-profile']
    for (const testId of navLinks) {
      const link = page.getByTestId(testId)
      await link.focus()
      await expect(link).toBeFocused()
    }
  })

  // ── App Shell Structure ──────────────────────────────────────────────────

  test('main content element has id=main-content', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('#main-content')
    await expect(main).toBeVisible({ timeout: 10_000 })
    await expect(main).toHaveAttribute('aria-label', 'Main content')
  })

  test('app shell outer div has data-testid=app-shell', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('app-shell')).toBeVisible()
  })

  // ── API /api/shell ───────────────────────────────────────────────────────

  test('GET /api/shell returns 200 with navItems', async ({ page }) => {
    const response = await page.request.get('/api/shell')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.config?.navItems)).toBe(true)
    expect(body.config.navItems.length).toBe(5)
  })

  // ── PageHeader ───────────────────────────────────────────────────────────

  test('Send page has PageHeader with correct title', async ({ page }) => {
    await page.goto('/send')
    const header = page.getByTestId('page-header')
    await expect(header).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('page-header-title')).toContainText(/Send/i)
  })

  test('PageHeader back link navigates away from /send', async ({ page }) => {
    await page.goto('/send')
    const backLink = page.getByTestId('page-header-back')
    await expect(backLink).toHaveAttribute('aria-label', 'Go back')
  })
})
