import { NextResponse } from "next/server"
import type { HealthCheckResponse } from "@/lib/types"

/**
 * GET /api/health
 * Issue #19: Health check endpoint for CI/CD monitoring.
 * Returns service status, version, and uptime.
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const start = process.uptime()

  return NextResponse.json({
    status: "healthy",
    version: "1.0.0",
    uptime: Math.floor(start),
    services: {
      api: "up",
      mockDb: "up",
    },
  })
}
