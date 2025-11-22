import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/expenses/metrics - Get aggregate expense statistics
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('expenses', 'view')
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

    // Build base query for all expenses
    let query = supabase
      .from('expenses')
      .select('amount, expense_date, category, sub_category, payment_method')

    // Apply date range if provided, otherwise fetch all
    if (date_from) {
      query = query.gte('expense_date', date_from)
    }
    if (date_to) {
      query = query.lte('expense_date', date_to)
    }

    // Fetch all expenses (for aggregation)
    const { data: allExpenses, error: allError } = await query

    if (allError) {
      console.error('Database error:', allError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expense metrics' },
        { status: 500 }
      )
    }

    // Fetch current month expenses
    const { data: currentMonthExpenses, error: currentMonthError } = await supabase
      .from('expenses')
      .select('amount, expense_date, category, sub_category')
      .gte('expense_date', currentMonthStartStr)
      .lte('expense_date', currentMonthEndStr)

    if (currentMonthError) {
      console.error('Database error fetching current month expenses:', currentMonthError)
    }

    // Fetch last month expenses
    const { data: lastMonthExpenses, error: lastMonthError } = await supabase
      .from('expenses')
      .select('amount, expense_date, category, sub_category')
      .gte('expense_date', lastMonthStartStr)
      .lte('expense_date', lastMonthEndStr)

    if (lastMonthError) {
      console.error('Database error fetching last month expenses:', lastMonthError)
    }

    // Calculate aggregates for all expenses (within date range if specified)
    const totalExpenses = allExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0

    // Calculate current month expenses
    const thisMonthExpenses = currentMonthExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0

    // Calculate last month expenses
    const lastMonthExpensesAmount = lastMonthExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0

    // Calculate expense change percentage
    const expensesChange = lastMonthExpensesAmount > 0
      ? ((thisMonthExpenses - lastMonthExpensesAmount) / lastMonthExpensesAmount) * 100
      : thisMonthExpenses > 0 ? 100 : 0

    // Calculate expenses by category
    const expensesByCategory: Record<string, number> = {}
    allExpenses?.forEach(expense => {
      const category = expense.category || 'other'
      expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0)
    })

    // Calculate expenses by payment method
    const expensesByPaymentMethod: Record<string, number> = {}
    allExpenses?.forEach(expense => {
      const method = expense.payment_method || 'other'
      expensesByPaymentMethod[method] = (expensesByPaymentMethod[method] || 0) + (expense.amount || 0)
    })

    // Count expenses
    const totalExpenseEntries = allExpenses?.length || 0
    const averageExpensePerEntry = totalExpenseEntries > 0 ? totalExpenses / totalExpenseEntries : 0

    // Current month expenses by category
    const thisMonthExpensesByCategory: Record<string, number> = {}
    currentMonthExpenses?.forEach(expense => {
      const category = expense.category || 'other'
      thisMonthExpensesByCategory[category] = (thisMonthExpensesByCategory[category] || 0) + (expense.amount || 0)
    })

    return NextResponse.json({
      success: true,
      data: {
        total_expenses: totalExpenses,
        this_month_expenses: thisMonthExpenses,
        last_month_expenses: lastMonthExpensesAmount,
        expenses_change: expensesChange,
        total_expense_entries: totalExpenseEntries,
        average_expense_per_entry: averageExpensePerEntry,
        expenses_by_category: expensesByCategory,
        expenses_by_payment_method: expensesByPaymentMethod,
        this_month_expenses_by_category: thisMonthExpensesByCategory,
        date_range: {
          from: date_from || null,
          to: date_to || null
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching expense metrics' },
      { status: 500 }
    )
  }
}

