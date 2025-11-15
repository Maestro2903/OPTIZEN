import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/finance/dashboard - Get financial dashboard metrics
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('finance', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Get date range (default to current month)
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const date_from = searchParams.get('date_from') || firstDayOfMonth.toISOString().split('T')[0]
    const date_to = searchParams.get('date_to') || lastDayOfMonth.toISOString().split('T')[0]

    // Get previous month for comparison
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Query finance_revenue for current period
    const { data: revenues, error: revenuesError } = await supabase
      .from('finance_revenue')
      .select('amount, paid_amount, payment_status, entry_date, revenue_type')
      .gte('entry_date', date_from)
      .lte('entry_date', date_to)

    if (revenuesError) {
      console.error('Error fetching revenues:', revenuesError)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Query finance_revenue for previous period (for comparison)
    const { data: prevRevenues, error: prevRevenuesError } = await supabase
      .from('finance_revenue')
      .select('amount, paid_amount')
      .gte('entry_date', firstDayOfLastMonth.toISOString().split('T')[0])
      .lte('entry_date', lastDayOfLastMonth.toISOString().split('T')[0])

    // Query expenses for current period
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, expense_date, category')
      .gte('expense_date', date_from)
      .lte('expense_date', date_to)

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError)
      return NextResponse.json({ error: 'Failed to fetch expense data' }, { status: 500 })
    }

    // Query expenses for previous period
    const { data: prevExpenses, error: prevExpensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', firstDayOfLastMonth.toISOString().split('T')[0])
      .lte('expense_date', lastDayOfLastMonth.toISOString().split('T')[0])

    // Calculate current period metrics
    const totalRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.amount || 0), 0) || 0
    const totalPaid = revenues?.reduce((sum, rev) => sum + Number(rev.paid_amount || 0), 0) || 0
    const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0
    
    const receivedRevenueCount = revenues?.filter(rev => rev.payment_status === 'received').length || 0
    const pendingRevenueCount = revenues?.filter(rev => rev.payment_status === 'pending').length || 0
    const partialRevenueCount = revenues?.filter(rev => rev.payment_status === 'partial').length || 0
    
    const totalOutstanding = revenues?.reduce((sum, rev) => {
      return sum + (Number(rev.amount || 0) - Number(rev.paid_amount || 0))
    }, 0) || 0

    const netProfit = totalPaid - totalExpenses
    const profitMargin = totalPaid > 0 ? (netProfit / totalPaid) * 100 : 0

    // Calculate previous period metrics for comparison
    const prevTotalRevenue = prevRevenues?.reduce((sum, rev) => sum + Number(rev.amount || 0), 0) || 0
    const prevTotalPaid = prevRevenues?.reduce((sum, rev) => sum + Number(rev.paid_amount || 0), 0) || 0
    const prevTotalExpenses = prevExpenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0
    const prevNetProfit = prevTotalPaid - prevTotalExpenses

    // Calculate percentage changes
    const revenueChange = prevTotalRevenue > 0 
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
      : 0
    const expenseChange = prevTotalExpenses > 0 
      ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 
      : 0
    const profitChange = prevNetProfit !== 0
      ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100
      : 0

    // Expense breakdown by category
    const expensesByCategory = expenses?.reduce((acc: any, exp) => {
      const category = exp.category || 'other'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += Number(exp.amount || 0)
      return acc
    }, {}) || {}

    // Revenue by payment status (using actual revenue payment statuses)
    const revenueByStatus = {
      draft: 0, // Not applicable for finance_revenue
      sent: 0,  // Not applicable for finance_revenue
      paid: receivedRevenueCount, // 'received' maps to 'paid' for display
      overdue: 0, // Not tracked in finance_revenue
      cancelled: 0 // Not tracked in finance_revenue
    }

    // Recent transactions (last 10 from both revenues and expenses)
    const revenueTransactions = revenues
      ?.map(rev => ({
        id: rev,
        date: rev.entry_date,
        type: 'revenue',
        amount: Number(rev.amount || 0),
        status: rev.payment_status
      })) || []
    
    const expenseTransactions = expenses
      ?.map(exp => ({
        id: exp,
        date: exp.expense_date,
        type: 'expense',
        amount: Number(exp.amount || 0),
        status: 'paid'
      })) || []
    
    const recentTransactions = [...revenueTransactions, ...expenseTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        // Summary metrics
        summary: {
          totalRevenue,
          totalPaid,
          totalExpenses,
          netProfit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          totalOutstanding
        },
        
        // Comparison with previous period
        comparison: {
          revenueChange: Math.round(revenueChange * 100) / 100,
          expenseChange: Math.round(expenseChange * 100) / 100,
          profitChange: Math.round(profitChange * 100) / 100
        },

        // Revenue stats (replaces invoiceStats for finance module)
        invoiceStats: {
          total: revenues?.length || 0,
          paid: receivedRevenueCount,
          unpaid: pendingRevenueCount,
          partial: partialRevenueCount,
          byStatus: revenueByStatus
        },

        // Expense stats
        expenseStats: {
          total: expenses?.length || 0,
          totalAmount: totalExpenses,
          byCategory: expensesByCategory
        },

        // Recent activity
        recentTransactions,

        // Date range
        dateRange: {
          from: date_from,
          to: date_to
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
