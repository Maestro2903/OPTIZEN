/**
 * Comprehensive Audit Logging Service for Healthcare Compliance
 * Tracks all system activities for HIPAA and other regulatory requirements
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'

export interface AuditLogEntry {
  id?: string
  user_id: string
  action: string
  table_name: string
  record_id?: string
  old_values?: any
  new_values?: any
  metadata?: any
  session_id?: string
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export interface FinancialAuditEntry {
  id?: string
  user_id: string
  transaction_type: string
  amount?: number
  currency?: string
  patient_id?: string
  invoice_id?: string
  reference_number?: string
  description?: string
  metadata?: any
  ip_address?: string
  session_id?: string
  created_at?: string
}

export interface MedicalAuditEntry {
  id?: string
  user_id: string
  action: string
  patient_id?: string
  case_id?: string
  operation_id?: string
  sensitive_data_accessed?: boolean
  access_reason?: string
  metadata?: any
  ip_address?: string
  session_id?: string
  created_at?: string
}

export interface SessionLogEntry {
  id?: string
  user_id: string
  session_id: string
  action: string
  ip_address?: string
  user_agent?: string
  location?: any
  success?: boolean
  failure_reason?: string
  created_at?: string
}

export class AuditService {
  private supabase

  constructor(isClient = false) {
    this.supabase = isClient ? createClientClient() : createClient()
  }

  /**
   * Log general system activity
   */
  async logActivity(entry: AuditLogEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .insert([{
          ...entry,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error logging audit activity:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in logActivity:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Log financial transactions and billing activities
   */
  async logFinancialActivity(entry: FinancialAuditEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('financial_audit_logs')
        .insert([{
          ...entry,
          currency: entry.currency || 'INR',
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error logging financial audit:', error)
        return { success: false, error: error.message }
      }

      // Also log in general audit log for comprehensive tracking
      await this.logActivity({
        user_id: entry.user_id,
        action: entry.transaction_type,
        table_name: 'financial_transactions',
        record_id: entry.reference_number,
        metadata: {
          amount: entry.amount,
          patient_id: entry.patient_id,
          invoice_id: entry.invoice_id
        },
        session_id: entry.session_id,
        ip_address: entry.ip_address
      })

      return { success: true }
    } catch (error) {
      console.error('Error in logFinancialActivity:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Log medical activities and patient data access
   */
  async logMedicalActivity(entry: MedicalAuditEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('medical_audit_logs')
        .insert([{
          ...entry,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error logging medical audit:', error)
        return { success: false, error: error.message }
      }

      // Also log in general audit log
      await this.logActivity({
        user_id: entry.user_id,
        action: entry.action,
        table_name: 'medical_records',
        record_id: entry.patient_id || entry.case_id || entry.operation_id,
        metadata: {
          patient_id: entry.patient_id,
          case_id: entry.case_id,
          operation_id: entry.operation_id,
          sensitive_data_accessed: entry.sensitive_data_accessed,
          access_reason: entry.access_reason
        },
        session_id: entry.session_id,
        ip_address: entry.ip_address
      })

      return { success: true }
    } catch (error) {
      console.error('Error in logMedicalActivity:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Log user session activities
   */
  async logSessionActivity(entry: SessionLogEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('session_logs')
        .insert([{
          ...entry,
          success: entry.success !== false, // Default to true unless explicitly false
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error logging session activity:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in logSessionActivity:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Log patient data access (HIPAA compliance)
   */
  async logPatientAccess(
    userId: string,
    patientId: string,
    action: string,
    reason: string,
    metadata?: any,
    sessionData?: { sessionId?: string; ipAddress?: string }
  ): Promise<{ success: boolean; error?: string }> {
    return this.logMedicalActivity({
      user_id: userId,
      action: `patient_${action}`,
      patient_id: patientId,
      sensitive_data_accessed: true,
      access_reason: reason,
      metadata: metadata || {},
      session_id: sessionData?.sessionId,
      ip_address: sessionData?.ipAddress
    })
  }

  /**
   * Log financial transaction
   */
  async logFinancialTransaction(
    userId: string,
    transactionType: string,
    amount: number,
    patientId?: string,
    invoiceId?: string,
    referenceNumber?: string,
    sessionData?: { sessionId?: string; ipAddress?: string }
  ): Promise<{ success: boolean; error?: string }> {
    return this.logFinancialActivity({
      user_id: userId,
      transaction_type: transactionType,
      amount,
      patient_id: patientId,
      invoice_id: invoiceId,
      reference_number: referenceNumber,
      description: `${transactionType} transaction`,
      session_id: sessionData?.sessionId,
      ip_address: sessionData?.ipAddress
    })
  }

  /**
   * Log user login
   */
  async logLogin(
    userId: string,
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    failureReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.logSessionActivity({
      user_id: userId,
      session_id: sessionId,
      action: 'login',
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
      failure_reason: failureReason
    })
  }

  /**
   * Log user logout
   */
  async logLogout(
    userId: string,
    sessionId: string,
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.logSessionActivity({
      user_id: userId,
      session_id: sessionId,
      action: 'logout',
      ip_address: ipAddress
    })
  }

  /**
   * Get audit logs with filters for compliance reporting
   */
  async getAuditLogs(filters: {
    startDate?: string
    endDate?: string
    userId?: string
    action?: string
    tableName?: string
    patientId?: string
    limit?: number
    offset?: number
  }): Promise<{ data: any[]; count: number; error?: string }> {
    try {
      let query = this.supabase
        .from('compliance_audit_view')
        .select('*', { count: 'exact' })

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName)
      }

      query = query
        .order('created_at', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 100) - 1)

      const { data, error, count } = await query

      if (error) {
        return { data: [], count: 0, error: error.message }
      }

      return { data: data || [], count: count || 0 }
    } catch (error) {
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get patient access history for HIPAA compliance
   */
  async getPatientAccessHistory(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: any[]; error?: string }> {
    try {
      let query = this.supabase
        .from('medical_audit_logs')
        .select(`
          *,
          user:user_id (
            email
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: data || [] }
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: string,
    endDate: string,
    reportType?: 'financial' | 'medical' | 'security' | 'all'
  ): Promise<{ data: any; error?: string }> {
    try {
      const filters: any = { startDate, endDate }

      // Get audit logs based on report type
      let auditData
      if (reportType === 'financial') {
        const { data } = await this.supabase
          .from('financial_audit_logs')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
        auditData = data
      } else if (reportType === 'medical') {
        const { data } = await this.supabase
          .from('medical_audit_logs')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
        auditData = data
      } else {
        const { data } = await this.getAuditLogs({ ...filters, limit: 10000 })
        auditData = data
      }

      // Generate summary statistics
      const summary = {
        totalActivities: auditData?.length || 0,
        uniqueUsers: new Set(auditData?.map((log: any) => log.user_id)).size,
        activityBreakdown: {} as Record<string, number>,
        timeRange: { startDate, endDate },
        reportType: reportType || 'all',
        generatedAt: new Date().toISOString()
      }

      // Count activities by action
      auditData?.forEach((log: any) => {
        const action = log.action || log.transaction_type
        summary.activityBreakdown[action] = (summary.activityBreakdown[action] || 0) + 1
      })

      return {
        data: {
          summary,
          details: auditData,
        }
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Singleton instance for server-side usage
export const auditService = new AuditService()

// Factory function for client-side usage
export const createAuditService = () => new AuditService(true)

/**
 * Middleware helper for automatic audit logging in API routes
 */
export async function auditApiCall(
  userId: string,
  action: string,
  resource: string,
  recordId?: string,
  sessionData?: { sessionId?: string; ipAddress?: string; userAgent?: string },
  metadata?: any
): Promise<void> {
  await auditService.logActivity({
    user_id: userId,
    action: `api_${action}`,
    table_name: resource,
    record_id: recordId,
    metadata: {
      ...metadata,
      source: 'api'
    },
    session_id: sessionData?.sessionId,
    ip_address: sessionData?.ipAddress,
    user_agent: sessionData?.userAgent
  })
}