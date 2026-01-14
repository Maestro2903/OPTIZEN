/**
 * Structured Logging Utility
 * Provides consistent logging across the application with support for audit logging
 */

import { auditService } from '@/lib/services/audit'

export interface LogMeta {
  [key: string]: any
  user_id?: string
  request_id?: string
  endpoint?: string
  duration_ms?: number
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log info messages
   */
  info(message: string, meta?: LogMeta): void {
    const logData = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }

    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
    }

    // In production, could send to external logging service
  }

  /**
   * Log error messages with optional error object
   */
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorData = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      ...meta
    }

    console.error(`[ERROR] ${message}`, error, meta ? JSON.stringify(meta, null, 2) : '')

    // Log to audit service (non-blocking)
    if (meta?.endpoint || meta?.user_id) {
      auditService.logActivity({
        user_id: meta.user_id,
        action: 'error',
        table_name: 'api_errors',
        metadata: errorData
      }).catch(err => {
        console.error('Failed to log error to audit service:', err)
      })
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: LogMeta): void {
    const logData = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }

    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, meta?: LogMeta): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
    }
  }

  /**
   * Log API request start
   */
  requestStart(method: string, path: string, requestId: string, meta?: LogMeta): void {
    this.info(`[REQUEST] ${method} ${path}`, {
      request_id: requestId,
      method,
      endpoint: path,
      ...meta
    })
  }

  /**
   * Log API request completion
   */
  requestComplete(
    method: string,
    path: string,
    status: number,
    duration: number,
    requestId: string,
    meta?: LogMeta
  ): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    const logData = {
      level,
      message: `[RESPONSE] ${method} ${path} ${status}`,
      request_id: requestId,
      method,
      endpoint: path,
      status,
      duration_ms: duration,
      ...meta
    }

    if (level === 'error') {
      this.error(logData.message, undefined, logData)
    } else if (level === 'warn') {
      this.warn(logData.message, logData)
    } else {
      this.info(logData.message, logData)
    }
  }
}

// Export singleton instance
export const logger = new Logger()












