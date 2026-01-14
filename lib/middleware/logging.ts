/**
 * Logging Middleware for Request/Response Tracking
 * Provides structured logging for API requests, errors, and performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { auditService, extractRequestContext } from '@/lib/services/audit'

export interface LogContext {
  requestId: string
  method: string
  path: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  startTime: number
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract user ID from request (if available)
 */
async function extractUserId(req: NextRequest): Promise<string | undefined> {
  try {
    // Try to get user from session/cookies
    // This is a placeholder - actual implementation depends on your auth setup
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      // Extract user ID from token if needed
      // For now, return undefined
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Create logging context from request
 */
export async function createLogContext(req: NextRequest): Promise<LogContext> {
  const requestId = generateRequestId()
  const context = extractRequestContext(req)
  const userId = await extractUserId(req)

  return {
    requestId,
    method: req.method,
    path: req.nextUrl.pathname,
    user_id: userId,
    ...context,
    startTime: Date.now()
  }
}

/**
 * Log request start
 */
export function logRequestStart(context: LogContext): void {
  const logData = {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    user_id: context.user_id,
    ip_address: context.ip_address,
    user_agent: context.user_agent
  }

  // Use structured logging
  console.log('[REQUEST]', JSON.stringify(logData))
}

/**
 * Log request completion
 */
export function logRequestComplete(
  context: LogContext,
  response: NextResponse,
  metadata?: Record<string, any>
): void {
  const duration = Date.now() - context.startTime
  const status = response.status

  const logData = {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    status,
    duration_ms: duration,
    user_id: context.user_id,
    ...metadata
  }

  // Log to console
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
  console[level]('[RESPONSE]', JSON.stringify(logData))

  // Add request ID to response headers for tracing
  response.headers.set('X-Request-ID', context.requestId)
  response.headers.set('X-Response-Time', `${duration}ms`)
}

/**
 * Log error with full context
 */
export function logError(
  context: LogContext,
  error: Error | unknown,
  metadata?: Record<string, any>
): void {
  const errorData = {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    user_id: context.user_id,
    error: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    },
    ...metadata
  }

  console.error('[ERROR]', JSON.stringify(errorData))

  // Log to audit service (non-blocking)
  auditService.logActivity({
    user_id: context.user_id,
    action: 'error',
    table_name: 'api_errors',
    metadata: {
      ...errorData,
      ...metadata
    },
    ip_address: context.ip_address,
    user_agent: context.user_agent,
    session_id: context.session_id
  }).catch(err => {
    console.error('Failed to log error to audit service:', err)
  })
}

/**
 * Log security event
 */
export function logSecurityEvent(
  context: LogContext,
  event: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    metadata?: Record<string, any>
  }
): void {
  const securityData = {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    user_id: context.user_id,
    event_type: event.type,
    severity: event.severity,
    description: event.description,
    ...event.metadata
  }

  console.warn('[SECURITY]', JSON.stringify(securityData))

  // Log to audit service
  auditService.logActivity({
    user_id: context.user_id,
    action: `security_${event.type}`,
    table_name: 'security_events',
    metadata: securityData,
    ip_address: context.ip_address,
    user_agent: context.user_agent,
    session_id: context.session_id
  }).catch(err => {
    console.error('Failed to log security event:', err)
  })
}

/**
 * Log performance metrics
 */
export function logPerformance(
  context: LogContext,
  metrics: {
    operation: string
    duration_ms: number
    metadata?: Record<string, any>
  }
): void {
  const perfData = {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    operation: metrics.operation,
    duration_ms: metrics.duration_ms,
    ...metrics.metadata
  }

  // Only log slow operations (>1 second) or if explicitly requested
  if (metrics.duration_ms > 1000) {
    console.warn('[PERFORMANCE]', JSON.stringify(perfData))
  }
}












