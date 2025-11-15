import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/expenses - List expenses with filters
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('expenses', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'expense_date'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const category = searchParams.get('category') || ''
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''

    // Validate and constrain
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100)

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    const allowedSortColumns = [
      'expense_date',
      'amount',
      'category',
      'vendor',
      'created_at'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'expense_date'
    }

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.or(`description.ilike.%${sanitizedSearch}%,vendor.ilike.%${sanitizedSearch}%,bill_number.ilike.%${sanitizedSearch}%,notes.ilike.%${sanitizedSearch}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply date range filter
    if (date_from) {
      query = query.gte('expense_date', date_from)
    }
    if (date_to) {
      query = query.lte('expense_date', date_to)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: expenses, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('expenses', 'create')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const {
      expense_date,
      category,
      sub_category,
      description,
      amount,
      payment_method,
      vendor,
      bill_number,
      notes,
      receipt_url
    } = body

    if (!expense_date || !category || !description || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: expense_date, category, description, amount' },
        { status: 400 }
      )
    }

    // Validate amount
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: 'amount must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate category (now accepts any string from master data)
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // Insert expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert([
        {
          expense_date,
          category,
          sub_category,
          description,
          amount: parsedAmount,
          payment_method,
          vendor,
          bill_number,
          notes,
          receipt_url,
          added_by: context.user_id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
