/**
 * E2E tests: Chart & Analytics (Issue #15)
 * Verifies the analytics dashboard and project-analytics chart render correctly.
 *
 * @tag analytics issue-15
 */
import { test, expect } from '@playwright/test'

test.describe('Analytics Dashboard — Issue #15 @analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('project-analytics card is visible on the home dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('project-analytics')).toBeVisible({ timeout: 10_000 })
  })

  test('project-analytics shows "Project Analytics" heading', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /Project Analytics/i }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('project-analytics shows Average and Peak summary stats', async ({ page }) => {
    await page.goto('/')
    const card = page.getByTestId('project-analytics')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText(/Average:/)).toBeVisible()
    await expect(card.getByText(/Peak:/)).toBeVisible()
  })

  test('API /api/analytics returns valid JSON with success:true', async ({ page }) => {
    const response = await page.request.get('/api/analytics?interval=week')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.interval).toBe('week')
  })

  test('API /api/analytics returns 400 for invalid interval', async ({ page }) => {
    const response = await page.request.get('/api/analytics?interval=hour')
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  test('API /api/analytics volumeHistory has correct count for day interval', async ({ page }) => {
    const response = await page.request.get('/api/analytics?interval=day')
    const body = await response.json()
    expect(body.data.volumeHistory).toHaveLength(7)
  })

  test('API /api/analytics volumeHistory has correct count for year interval', async ({ page }) => {
    const response = await page.request.get('/api/analytics?interval=year')
    const body = await response.json()
    expect(body.data.volumeHistory).toHaveLength(12)
  })
})
