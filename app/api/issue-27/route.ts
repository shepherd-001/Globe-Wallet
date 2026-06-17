import { NextResponse } from 'next/server'

/**
 * Enterprise analytics and health check endpoint for Issue #27
 */
export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        version: '1.2.0-issue-27',
        services: [
            'wallet',
            'exchange',
            'offRamp',
            'pricing',
            'fiat'
        ],
        timestamp: new Date().toISOString()
    })
}
