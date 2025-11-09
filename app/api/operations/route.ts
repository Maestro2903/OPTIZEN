import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'
import * as z from 'zod'

// Validation schema for operations
const operationSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  case_id: z.string().uuid('Invalid case ID').optional(),
  operation_name: z.string().min(1, 'Operation name is required'),
  operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  begin_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  duration: z.string().optional(),
  eye: z.enum(['Left', 'Right', 'Both']).optional(),
  sys_diagnosis: z.string().optional(),
  anesthesia: z.string().optional(),
  operation_notes: z.string().optional(),
  payment_mode: z.enum(['Cash', 'Card', 'Insurance', 'Online']).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  iol_name: z.string().optional(),
  iol_power: z.string().optional(),
  print_notes: z.boolean().optional(),
  print_payment: z.boolean().optional(),
  print_iol: z.boolean().optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).default('scheduled'),
})

export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'view')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters with safe parsing
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '10', 10)

    // Validate and set defaults for NaN values, then clamp to ranges
    const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1
    const limit = Number.isFinite(limitParam) ? Math.min(100, Math.max(1, limitParam)) : 10
    const search = searchParams.get('search') || ''

    // Validate sortBy parameter against whitelist
    const allowedSorts = ['operation_date', 'operation_name', 'status', 'patient_id', 'case_id', 'begin_time', 'end_time', 'amount', 'created_at', 'updated_at']
    const rawSortBy = searchParams.get('sortBy') || 'operation_date'
    const sortBy = allowedSorts.includes(rawSortBy) ? rawSortBy : 'operation_date'

    // Validate sortOrder parameter
    const rawSortOrder = searchParams.get('sortOrder') || 'desc'
    const sortOrder = ['asc', 'desc'].includes(rawSortOrder) ? rawSortOrder : 'desc'

    const patient_id = searchParams.get('patient_id')
    const case_id = searchParams.get('case_id')
    const status = searchParams.get('status')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('operations')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        cases:case_id (
          id,
          case_no,
          diagnosis
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      // Search only in operation table columns to avoid nested relation issues
      const searchPattern = `%${search}%`
      query = query.or(`operation_name.ilike.${searchPattern},operation_notes.ilike.${searchPattern},procedure_details.ilike.${searchPattern}`)
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    if (case_id) {
      query = query.eq('case_id', case_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: operations, error, count } = await query

    if (error) {
      console.error('Operations fetch error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: operations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Unexpected error in operations GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'create')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const body = await request.json()

    // Convert amount to number if it's a string
    if (body.amount && typeof body.amount === 'string') {
      body.amount = parseFloat(body.amount)
    }

    // Validate input data
    const validation = operationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data
    const supabase = createClient()

    const { data: operation, error } = await supabase
      .from('operations')
      .insert([
        {
          ...validatedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        cases:case_id (
          id,
          case_no,
          diagnosis
        )
      `)
      .single()

    if (error) {
      console.error('Operation creation error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: operation,
      message: 'Operation scheduled successfully'
    })

  } catch (error) {
    console.error('Unexpected error in operations POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}