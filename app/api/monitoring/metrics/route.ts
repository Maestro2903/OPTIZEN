/**
 * Metrics Endpoint
 * Returns detailed system metrics for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSystemMetrics } from '@/lib/utils/monitoring'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/monitoring/metrics
 * Returns detailed system metrics
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await getSystemMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

