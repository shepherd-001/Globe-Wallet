/**
 * tests/e2e/health-check.spec.ts
 * Issue #19: E2E test for the /api/health endpoint.
 * Verifies the full request/response cycle through the Next.js server.
 */

import { test, expect } from "@playwright/test"

test.describe("Health Check API (Issue #19)", () => {
  test("should return healthy status from health endpoint", async ({ request }) => {
    const response = await request.get("/api/health")

    expect(response.status()).toBe(200)

    const body = await response.json()

    expect(body).toMatchObject({
      status: "healthy",
      version: "1.0.0",
    })

    expect(body.uptime).toBeGreaterThanOrEqual(0)
    expect(body.services).toBeDefined()
    expect(typeof body.services).toBe("object")
  })

  test("should report all services as operational", async ({ request }) => {
    const response = await request.get("/api/health")
    const body = await response.json()

    for (const [service, status] of Object.entries(body.services)) {
      expect(status).toBe("up")
    }
  })

  test("should respond within acceptable time", async ({ request }) => {
    const start = Date.now()
    const response = await request.get("/api/health")
    const duration = Date.now() - start

    expect(response.status()).toBe(200)
    expect(duration).toBeLessThan(5000) // 5s max
  })
})
