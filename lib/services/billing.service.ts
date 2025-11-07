import { type Invoice } from './api-client'
import { createClient } from '@/lib/supabase/client'

/**
 * Billing Service - Handles all billing and invoice-related API operations
 */
export class BillingService {
  private supabase = createClient()

  /**
   * Get invoices with optional filtering
   */
  async getInvoices(params?: {
    patientId?: string
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<Invoice[]> {
    let query = this.supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(*),
        invoice_items(*)
      `)
      .order('created_at', { ascending: false })

    if (params?.patientId) {
      query = query.eq('patient_id', params.patientId)
    }

    if (params?.status) {
      query = query.eq('status', params.status)
    }

    if (params?.startDate) {
      query = query.gte('created_at', params.startDate)
    }

    if (params?.endDate) {
      query = query.lte('created_at', params.endDate)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`)
    return data || []
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(*),
        invoice_items(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch invoice: ${error.message}`)
    }
    return data
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: {
    patient_id: string
    amount: number
    items: Array<{
      description: string
      quantity: number
      unit_price: number
      amount: number
    }>
    due_date?: string
    notes?: string
  }): Promise<Invoice> {
    try {
      // Start a transaction by creating the invoice first
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .insert({
          patient_id: invoiceData.patient_id,
          amount: invoiceData.amount,
          due_date: invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          notes: invoiceData.notes,
          status: 'pending'
        })
        .select()
        .single()

      if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`)

      // Create invoice items
      const invoiceItemsData = invoiceData.items.map(item => ({
        invoice_id: invoice.id,
        ...item
      }))

      const { error: itemsError } = await this.supabase
        .from('invoice_items')
        .insert(invoiceItemsData)

      if (itemsError) throw new Error(`Failed to create invoice items: ${itemsError.message}`)

      // Return the complete invoice with items
      return this.getInvoiceById(invoice.id) as Promise<Invoice>
    } catch (error) {
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update an invoice
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await this.supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        patient:patients(*),
        invoice_items(*)
      `)
      .single()

    if (error) throw new Error(`Failed to update invoice: ${error.message}`)
    return data
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(id: string, paymentMethod?: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod
    })
  }

  /**
   * Mark invoice as overdue
   */
  async markInvoiceAsOverdue(id: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'overdue'
    })
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
    })
  }

  /**
   * Get pending invoices
   */
  async getPendingInvoices(): Promise<Invoice[]> {
    return this.getInvoices({ status: 'pending' })
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date().toISOString()
    const { data, error } = await this.supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(*),
        invoice_items(*)
      `)
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    if (error) throw new Error(`Failed to fetch overdue invoices: ${error.message}`)
    return data || []
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(dateRange?: { start: string; end: string }): Promise<{
    totalRevenue: number
    paidAmount: number
    pendingAmount: number
    overdueAmount: number
    invoiceCount: number
  }> {
    let baseQuery = this.supabase.from('invoices')

    if (dateRange) {
      // Apply date range filter to all queries
      const queries = await Promise.all([
        this.supabase.from('invoices').select('amount, status, due_date, created_at').gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      ])

      const { data: invoices, error } = queries[0]
      if (error) throw new Error(`Failed to fetch revenue stats: ${error.message}`)

      const stats = (invoices || []).reduce((acc, invoice) => {
        acc.totalRevenue += invoice.amount
        acc.invoiceCount++

        if (invoice.status === 'paid') {
          acc.paidAmount += invoice.amount
        } else if (invoice.status === 'sent') {
          const isOverdue = new Date(invoice.due_date) < new Date()
          if (isOverdue) {
            acc.overdueAmount += invoice.amount
          } else {
            acc.pendingAmount += invoice.amount
          }
        }

        return acc
      }, {
        totalRevenue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        invoiceCount: 0
      })

      return stats
    }

    const [allInvoices] = await Promise.all([
      baseQuery.select('amount, status, due_date, created_at')
    ])

    const { data: invoices, error } = allInvoices
    if (error) throw new Error(`Failed to fetch revenue stats: ${error.message}`)

    const stats = (invoices || []).reduce((acc, invoice) => {
      acc.totalRevenue += invoice.amount
      acc.invoiceCount++

      if (invoice.status === 'paid') {
        acc.paidAmount += invoice.amount
      } else if (invoice.status === 'pending') {
        const isOverdue = new Date(invoice.due_date) < new Date()
        if (isOverdue) {
          acc.overdueAmount += invoice.amount
        } else {
          acc.pendingAmount += invoice.amount
        }
      }

      return acc
    }, {
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      invoiceCount: 0
    })

    return stats
  }

  /**
   * Get payment history for a patient
   */
  async getPaymentHistory(patientId: string): Promise<Invoice[]> {
    return this.getInvoices({
      patientId,
      status: 'paid'
    })
  }

  /**
   * Generate invoice number (simple implementation)
   */
  async generateInvoiceNumber(): Promise<string> {
    const { count } = await this.supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`
    return invoiceNumber
  }
}

// Export singleton instance
export const billingService = new BillingService()