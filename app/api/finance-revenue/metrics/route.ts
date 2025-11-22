import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/finance-revenue/metrics - Get aggregate revenue statistics
export async function GET(request: NextRequest) {
  try {
    // RBAC check - requires financial data access
    const authCheck = await requirePermission('finance', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Optional date range filters
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''

    // Get current date and calculate month boundaries
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Format dates as YYYY-MM-DD
    const currentMonthStartStr = currentMonthStart.toISOString().split('T')[0]
    const currentMonthEndStr = currentMonthEnd.toISOString().split('T')[0]
    const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0]
    const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0]

    // Build base query for all revenue
    let query = supabase
      .from('finance_revenue')
      .select('amount, entry_date, payment_status')

    // Apply date range if provided, otherwise fetch all
    if (date_from) {
      query = query.gte('entry_date', date_from)
    }
    if (date_to) {
      query = query.lte('entry_date', date_to)
    }

    // Fetch all revenue entries (for aggregation)
    const { data: allRevenue, error: allError } = await query

    if (allError) {
      console.error('Database error:', allError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch revenue metrics' },
        { status: 500 }
      )
    }

    // Fetch current month revenue
    const { data: currentMonthRevenue, error: currentMonthError } = await supabase
      .from('finance_revenue')
      .select('amount, entry_date, payment_status')
      .gte('entry_date', currentMonthStartStr)
      .lte('entry_date', currentMonthEndStr)

    if (currentMonthError) {
      console.error('Database error fetching current month revenue:', currentMonthError)
    }

    // Fetch last month revenue
    const { data: lastMonthRevenue, error: lastMonthError } = await supabase
      .from('finance_revenue')
      .select('amount, entry_date, payment_status')
      .gte('entry_date', lastMonthStartStr)
      .lte('entry_date', lastMonthEndStr)

    if (lastMonthError) {
      console.error('Database error fetching last month revenue:', lastMonthError)
    }

    // Calculate aggregates for all revenue (within date range if specified)
    const totalRevenue = allRevenue?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

    // Calculate current month revenue
    const thisMonthRevenue = currentMonthRevenue?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

    // Calculate last month revenue
    const lastMonthRevenueAmount = lastMonthRevenue?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

    // Calculate revenue change percentage
    const revenueChange = lastMonthRevenueAmount > 0
      ? ((thisMonthRevenue - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100
      : thisMonthRevenue > 0 ? 100 : 0

    // Calculate received vs pending
    const receivedRevenue = allRevenue?.filter(e => e.payment_status === 'received')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0
    const pendingRevenue = allRevenue?.filter(e => e.payment_status === 'pending')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

    // Count entries by payment status
    const receivedCount = allRevenue?.filter(e => e.payment_status === 'received').length || 0
    const pendingCount = allRevenue?.filter(e => e.payment_status === 'pending').length || 0
    const partialCount = allRevenue?.filter(e => e.payment_status === 'partial').length || 0

    // Average revenue per entry
    const totalEntries = allRevenue?.length || 0
    const averageRevenuePerEntry = totalEntries > 0 ? totalRevenue / totalEntries : 0

    return NextResponse.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        this_month_revenue: thisMonthRevenue,
        last_month_revenue: lastMonthRevenueAmount,
        revenue_change: revenueChange,
        received_revenue: receivedRevenue,
        pending_revenue: pendingRevenue,
        total_entries: totalEntries,
        payment_status: {
          received: receivedCount,
          pending: pendingCount,
          partial: partialCount
        },
        average_revenue_per_entry: averageRevenuePerEntry,
        date_range: {
          from: date_from || null,
          to: date_to || null
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching revenue metrics' },
      { status: 500 }
    )
  }
}


