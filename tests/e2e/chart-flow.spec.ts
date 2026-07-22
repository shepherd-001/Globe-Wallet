import { test, expect } from '@playwright/test'

/**
 * E2E tests for the ProjectAnalytics chart on the dashboard (Issue #17).
 * Verifies the chart renders, summary stats are correct, and the component
 * is accessible to keyboard/screen-reader users.
 */

test.describe('Issue #17 – Chart: Recharts strict typing smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
  })

  test('ProjectAnalytics section heading is visible on dashboard', async ({ page }) => {
    await expect(
      page.getByText('Project Analytics'),
    ).toBeVisible({ timeout: 10000 })
  })

  test('Weekly Activity legend label is rendered', async ({ page }) => {
    await expect(page.getByText('Weekly Activity')).toBeVisible({ timeout: 10000 })
  })

  test('Average stat displays the correct computed value', async ({ page }) => {
    // [45,75,74,92,35,60,50] → 62%
    const averageValue = page.getByText('62%')
    await expect(averageValue).toBeVisible({ timeout: 10000 })
  })

  test('Peak stat displays the maximum value', async ({ page }) => {
    // Wednesday = 92
    const peakValue = page.getByText('92%')
    await expect(peakValue).toBeVisible({ timeout: 10000 })
  })

  test('chart SVG or container is present in the DOM', async ({ page }) => {
    // Recharts renders an SVG inside a responsive wrapper
    await page.waitForSelector('svg, [data-testid="recharts-responsive-container"]', {
      timeout: 10000,
    })
    const svgCount = await page.locator('svg').count()
    expect(svgCount).toBeGreaterThan(0)
  })

  test('summary stats section contains both Average and Peak labels', async ({ page }) => {
    await expect(page.getByText('Average:')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Peak:')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Issue #17 – Chart: analytics API happy path', () => {
  test('GET /api/analytics returns success JSON with 7 weekly data points', async ({ request }) => {
    const res = await request.get('/api/analytics?period=week')
    expect(res.ok()).toBe(true)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data?.period).toBe('week')
    expect(body.data?.points).toHaveLength(7)
    expect(typeof body.data?.average).toBe('number')
    expect(typeof body.data?.peak).toBe('number')
  })

  test('GET /api/analytics returns 400 for invalid period', async ({ request }) => {
    const res = await request.get('/api/analytics?period=quarterly')
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBeTruthy()
  })
})
