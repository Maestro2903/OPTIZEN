import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // Build date filters
    let startDate: string
    let endDate: string
    
    if (month && year) {
      startDate = `${year}-${month.padStart(2, '0')}-01`
      endDate = `${year}-${month.padStart(2, '0')}-31`
    } else if (date_from && date_to) {
      startDate = date_from
      endDate = date_to
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