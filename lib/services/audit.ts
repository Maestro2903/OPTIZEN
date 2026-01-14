/**
 * Comprehensive Audit Logging Service
 * Provides structured logging for compliance and security monitoring
 */

import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export interface AuditLogData {
  user_id?: string
  action: string
  table_name: string
  record_id?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  metadata?: Record<string, any>
  session_id?: string
  ip_address?: string
  user_agent?: string
}

export interface FinancialAuditLogData {
  user_id?: string
  transaction_type: string
  amount?: number
  currency?: string
  patient_id?: string
  invoice_id?: string
  reference_number?: string
  description?: string
  metadata?: Record<string, any>
  ip_address?: string
  session_id?: string
}

export interface MedicalAuditLogData {
  user_id?: string
  action: string
  patient_id?: string
  case_id?: string
  operation_id?: string
  sensitive_data_accessed?: boolean
  access_reason?: string
  metadata?: Record<string, any>
  ip_address?: string
  session_id?: string
}

export interface SessionLogData {
  user_id?: string
  session_id: string
  action: 'login' | 'logout' | 'session_expired' | 'force_logout' | 'session_refreshed'
  ip_address?: string
  user_agent?: string
  location?: Record<string, any>
  success?: boolean
  failure_reason?: string
}

/**
 * Extract request context for audit logging
 */
export function extractRequestContext(req: NextRequest): {
  ip_address?: string
  user_agent?: string
  session_id?: string
} {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || undefined
  const userAgent = req.headers.get('user-agent') || undefined
  const sessionId = req.headers.get('x-session-id') || undefined

  return {
    ip_address: ip,
    user_agent: userAgent,
    session_id: sessionId
  }
}

/**
 * Audit Service for comprehensive logging
 */
class AuditService {
  private _supabase: ReturnType<typeof createServiceClient> | null = null

  /**
   * Lazy-load Supabase client to avoid initialization errors in test scripts
   */
  private get supabase() {
    if (!this._supabase) {
      this._supabase = createServiceClient()
    }
    return this._supabase
  }

  /**
   * Log general activity to audit_logs_new
   * Non-blocking - errors are logged but don't throw
   */
  async logActivity(data: AuditLogData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_logs_new')
        .insert([{
          user_id: data.user_id || null,
          action: data.action,
          table_name: data.table_name,
          record_id: data.record_id || null,
          old_values: data.old_values ? data.old_values : null,
          new_values: data.new_values ? data.new_values : null,
          metadata: data.metadata || {},
          session_id: data.session_id || null,
          ip_address: data.ip_address || null,
          user_agent: data.user_agent || null,
          created_at: new Date().toISOString()
        }])

      if (error) {
        // Log error but don't throw - audit failures shouldn't break the app
        console.error('Audit logging failed:', {
          error: error.message,
          action: data.action,
          table: data.table_name
        })
      }
    } catch (error) {
      // Catch any unexpected errors
      console.error('Unexpected error in audit logging:', error)
    }
  }

  /**
   * Log financial transactions
   */
  async logFinancialActivity(data: FinancialAuditLogData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('financial_audit_logs')
        .insert([{
          user_id: data.user_id || null,
          transaction_type: data.transaction_type,
          amount: data.amount || null,
          currency: data.currency || 'INR',
          patient_id: data.patient_id || null,
          invoice_id: data.invoice_id || null,
          reference_number: data.reference_number || null,
          description: data.description || null,
          metadata: data.metadata || {},
          ip_address: data.ip_address || null,
          session_id: data.session_id || null,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Financial audit logging failed:', {
          error: error.message,
          transaction_type: data.transaction_type
        })
      }
    } catch (error) {
      console.error('Unexpected error in financial audit logging:', error)
    }
  }

  /**
   * Log medical/patient data access
   */
  async logMedicalActivity(data: MedicalAuditLogData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('medical_audit_logs')
        .insert([{
          user_id: data.user_id || null,
          action: data.action,
          patient_id: data.patient_id || null,
          case_id: data.case_id || null,
          operation_id: data.operation_id || null,
          sensitive_data_accessed: data.sensitive_data_accessed || false,
          access_reason: data.access_reason || null,
          metadata: data.metadata || {},
          ip_address: data.ip_address || null,
          session_id: data.session_id || null,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Medical audit logging failed:', {
          error: error.message,
          action: data.action,
          patient_id: data.patient_id
        })
      }
    } catch (error) {
      console.error('Unexpected error in medical audit logging:', error)
    }
  }

  /**
   * Log session events (login, logout, etc.)
   */
  async logSessionActivity(data: SessionLogData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('session_logs')
        .insert([{
          user_id: data.user_id || null,
          session_id: data.session_id,
          action: data.action,
          ip_address: data.ip_address || null,
          user_agent: data.user_agent || null,
          location: data.location || null,
          success: data.success !== undefined ? data.success : true,
          failure_reason: data.failure_reason || null,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Session logging failed:', {
          error: error.message,
          action: data.action,
          session_id: data.session_id
        })
      }
    } catch (error) {
      console.error('Unexpected error in session logging:', error)
    }
  }
}

// Export singleton instance
export const auditService = new AuditService()

/**
 * Wrapper for API calls that automatically logs the call
 */
export async function auditApiCall<T>(
  fn: () => Promise<T>,
  context: {
    action: string
    table_name: string
    user_id?: string
    request?: NextRequest
    metadata?: Record<string, any>
  }
): Promise<T> {
  const startTime = Date.now()
  const requestContext = context.request ? extractRequestContext(context.request) : {}

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    // Log successful API call
    auditService.logActivity({
      user_id: context.user_id,
      action: context.action,
      table_name: context.table_name,
      metadata: {
        ...context.metadata,
        duration_ms: duration,
        success: true
      },
      ...requestContext
    }).catch(err => {
      // Don't let audit logging errors break the API call
      console.error('Failed to log API call audit:', err)
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    // Log failed API call
    auditService.logActivity({
      user_id: context.user_id,
      action: context.action,
      table_name: context.table_name,
      metadata: {
        ...context.metadata,
        duration_ms: duration,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      ...requestContext
    }).catch(err => {
      console.error('Failed to log API call audit:', err)
    })

    throw error
  }
}
