import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole, type UserRoleData } from '@/lib/utils/rbac'

// GET /api/invoices/metrics - Get aggregate invoice and revenue statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Optional date range filters
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view financial data (fail-closed approach)
    let userRole: UserRoleData | null
    
    try {
      userRole = await getUserRole(session.user.id)
    } catch (error) {
      console.error('Error fetching user role for financial data access', { 
        userId: session.user.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return NextResponse.json({ 
        error: 'Internal Server Error: Unable to fetch user role' 
      }, { status: 500 })
    }
    
    // Fail-closed: Only allow if userRole exists AND (is admin OR has permission)
    if (!userRole || (userRole.role !== 'admin' && !userRole.can_view_financial_data)) {
      console.log('Access denied: User lacks financial data permission', { 
        userId: session.user.id, 
        role: userRole?.role || 'null',
        can_view_financial_data: userRole?.can_view_financial_data || false
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build base query
    let query = supabase
      .from('invoices')
      .select('total_amount, amount_paid, balance_due, payment_status, status')

    // Apply date range if provided
    if (date_from) {
      query = query.gte('invoice_date', date_from)
    }
    if (date_to) {
      query = query.lte('invoice_date', date_to)
    }

    // Fetch all invoices (for aggregation)
    const { data: invoices, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Calculate aggregates
    const totalInvoices = invoices?.length || 0
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const paidAmount = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0
    const pendingAmount = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0

    // Count by payment status
    const paidCount = invoices?.filter(inv => inv.payment_status === 'paid').length || 0
    const unpaidCount = invoices?.filter(inv => inv.payment_status === 'unpaid').length || 0
    const partialCount = invoices?.filter(inv => inv.payment_status === 'partial').length || 0

    // Count by status
    const draftCount = invoices?.filter(inv => inv.status === 'draft').length || 0
    const sentCount = invoices?.filter(inv => inv.status === 'sent').length || 0
    const overdueCount = invoices?.filter(inv => inv.status === 'overdue').length || 0

    return NextResponse.json({
      success: true,
      data: {
        total_invoices: totalInvoices,
        total_revenue: totalRevenue,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        
        // Payment status breakdown
        payment_status: {
          paid: paidCount,
          unpaid: unpaidCount,
          partial: partialCount
        },
        
        // Invoice status breakdown
        invoice_status: {
          draft: draftCount,
          sent: sentCount,
          overdue: overdueCount
        },
        
        // Additional metrics
        collection_rate: totalRevenue > 0 ? ((paidAmount / totalRevenue) * 100).toFixed(1) : '0.0',
        average_invoice_value: totalInvoices > 0 ? (totalRevenue / totalInvoices).toFixed(2) : '0.00',
        
        // Date range (if applied)
        date_range: {
          from: date_from || null,
          to: date_to || null
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
