/**
 * Health Check Endpoint
 * Provides system health status for monitoring and load balancers
 */

import { NextRequest, NextResponse } from 'next/server'
import { performHealthCheck } from '@/lib/utils/monitoring'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/monitoring/health
 * Returns health check status
 */
export async function GET(request: NextRequest) {
  try {
    const health = await performHealthCheck()
    
    // Return appropriate HTTP status based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503
    
    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}













