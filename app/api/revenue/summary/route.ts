import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - verify user has financial access
    // TODO: Implement proper role-based authorization
    // For now, requiring any authenticated user

    const { searchParams } = new URL(request.url)

    // Get and validate query parameters
    const rawMonth = searchParams.get('month')
    const rawYear = searchParams.get('year')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // Validate month parameter
    let month: number | null = null
    if (rawMonth) {
      const parsedMonth = parseInt(rawMonth)
      if (Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid month. Must be between 1 and 12' },
          { status: 400 }
        )
      }
    }

    // Validate year parameter
    let year: number | null = null
    if (rawYear) {
      const parsedYear = parseInt(rawYear)
      const currentYear = new Date().getFullYear()
      if (Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= currentYear + 10) {
        year = parsedYear
      } else {
        return NextResponse.json(
          { success: false, error: `Invalid year. Must be between 1900 and ${currentYear + 10}` },
          { status: 400 }
        )
      }
    }

    // Validate date parameters if present
    let parsedDateFrom: Date | null = null
    let parsedDateTo: Date | null = null

    if (date_from) {
      parsedDateFrom = new Date(date_from)
      if (isNaN(parsedDateFrom.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date_from format. Use ISO date format' },
          { status: 400 }
        )
      }
    }

    if (date_to) {
      parsedDateTo = new Date(date_to)
      if (isNaN(parsedDateTo.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date_to format. Use ISO date format' },
          { status: 400 }
        )
      }
    }

    // Validate date range
    if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
      return NextResponse.json(
        { success: false, error: 'date_from must be before or equal to date_to' },
        { status: 400 }
      )
    }

    // Build date filters
    let startDate: string
    let endDate: string

    if (month !== null && year !== null) {
      const monthStr = month.toString().padStart(2, '0')
      startDate = `${year}-${monthStr}-01`
      // Calculate last day of month correctly
      const lastDay = new Date(year, month, 0).getDate()
      endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}`
    } else if (parsedDateFrom && parsedDateTo) {
      startDate = date_from!
      endDate = date_to!
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    }

    // Get income summary
    const { data: incomeData, error: incomeError } = await supabase
      .from('revenue_transactions')
      .select('amount, category')
      .eq('type', 'income')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)

    if (incomeError) {
      console.error('Income summary fetch error:', incomeError)
      return NextResponse.json(
        { success: false, error: incomeError.message },
        { status: 500 }
      )
    }

    // Get expense summary
    const { data: expenseData, error: expenseError } = await supabase
      .from('revenue_transactions')
      .select('amount, category')
      .eq('type', 'expense')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)

    if (expenseError) {
      console.error('Expense summary fetch error:', expenseError)
      return NextResponse.json(
        { success: false, error: expenseError.message },
        { status: 500 }
      )
    }

    // Calculate totals
    const totalIncome = incomeData?.reduce((sum, item) => sum + item.amount, 0) || 0
    const totalExpenses = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0
    const netProfit = totalIncome - totalExpenses

    // Calculate income by category
    const incomeByCategory = incomeData?.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate expenses by category
    const expensesByCategory = expenseData?.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netProfit,
        incomeByCategory,
        expensesByCategory,
        transactionCount: {
          income: incomeData?.length || 0,
          expense: expenseData?.length || 0,
          total: (incomeData?.length || 0) + (expenseData?.length || 0)
        }
      }
    })

  } catch (error) {
    console.error('Unexpected error in revenue summary:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}