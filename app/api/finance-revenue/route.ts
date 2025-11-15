import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/finance-revenue - List all finance revenue entries
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Filters
    const search = searchParams.get('search') || ''
    const revenue_type = searchParams.get('revenue_type')
    const payment_status = searchParams.get('payment_status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'entry_date'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build query
    let query = supabase
      .from('finance_revenue')
      .select('*, patients:patient_id(id, full_name, patient_id)', { count: 'exact' })

    // Apply search
    if (search) {
      query = query.or(`description.ilike.%${search}%,patient_name.ilike.%${search}%,invoice_reference.ilike.%${search}%`)
    }

    // Apply filters
    if (revenue_type) {
      query = query.eq('revenue_type', revenue_type)
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }
    if (date_from) {
      query = query.gte('entry_date', date_from)
    }
    if (date_to) {
      query = query.lte('entry_date', date_to)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: revenue, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue entries' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: revenue || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to convert display values to database values
function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

// POST /api/finance-revenue - Create a new revenue entry
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.entry_date || !body.revenue_type || !body.description || !body.amount || !body.payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: entry_date, revenue_type, description, amount, payment_method' },
        { status: 400 }
      )
    }

    // Validate amount
    if (typeof body.amount !== 'number' || body.amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a non-negative number' },
        { status: 400 }
      )
    }

    // Convert empty strings to null for UUID fields
    if (body.patient_id === '' || body.patient_id === undefined) {
      body.patient_id = null
    }

    // Normalize values to match database CHECK constraints
    body.revenue_type = normalizeValue(body.revenue_type)
    body.payment_method = normalizeValue(body.payment_method)
    body.payment_status = normalizeValue(body.payment_status)

    // Get patient name if patient_id is provided
    if (body.patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', body.patient_id)
        .single()
      
      if (patient) {
        body.patient_name = patient.full_name
      }
    }

    // Set paid_amount based on payment_status
    if (body.payment_status === 'received') {
      body.paid_amount = body.amount
    } else if (body.payment_status === 'pending') {
      body.paid_amount = 0
    }

    // Insert revenue entry
    const { data: revenue, error } = await supabase
      .from('finance_revenue')
      .insert(body)
      .select('*, patients:patient_id(id, full_name, patient_id)')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create revenue entry' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: revenue,
      message: 'Revenue entry created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
