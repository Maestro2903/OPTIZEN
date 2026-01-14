/**
 * Monitoring Utilities
 * Health checks, metrics collection, and system status monitoring
 */

import { createServiceClient } from '@/lib/supabase/server'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    database: { status: 'ok' | 'error'; message?: string }
    timestamp: string
  }
  uptime?: number
}

export interface SystemMetrics {
  timestamp: string
  database: {
    connected: boolean
    response_time_ms?: number
  }
  memory?: {
    used_mb: number
    total_mb: number
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'ok' | 'error'
  message?: string
  response_time_ms?: number
}> {
  const startTime = Date.now()
  
  try {
    const supabase = createServiceClient()
    
    // Simple query to test connection
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      return {
        status: 'error',
        message: error.message,
        response_time_ms: responseTime
      }
    }
    
    return {
      status: 'ok',
      response_time_ms: responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime
    }
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks = {
    database: await checkDatabaseHealth(),
    timestamp: new Date().toISOString()
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (checks.database.status === 'error') {
    status = 'unhealthy'
  } else if (checks.database.response_time_ms && checks.database.response_time_ms > 1000) {
    status = 'degraded'
  }

  return {
    status,
    checks,
    uptime: process.uptime()
  }
}

/**
 * Get system metrics
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const database = await checkDatabaseHealth()
  
  const metrics: SystemMetrics = {
    timestamp: new Date().toISOString(),
    database: {
      connected: database.status === 'ok',
      response_time_ms: database.response_time_ms
    }
  }

  // Add memory metrics if available (Node.js)
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memoryUsage = process.memoryUsage()
    metrics.memory = {
      used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
    }
  }

  return metrics
}

/**
 * Check if system is ready to serve traffic
 */
export async function isSystemReady(): Promise<boolean> {
  const health = await performHealthCheck()
  return health.status === 'healthy' || health.status === 'degraded'
}












