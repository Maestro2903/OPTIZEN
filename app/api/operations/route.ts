import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

async function authenticate(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

async function authorize(user: any, action: string) {
  // Check if user has appropriate permissions for operations
  // This should be expanded based on your RBAC system
  const allowedRoles = ['admin', 'doctor', 'nurse']

  // For now, we'll check if user has any role that allows medical operations
  // In production, implement proper role-based authorization
  return true // Placeholder - implement proper role checking
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check
    const authorized = await authorize(user, 'read_operations')
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'operation_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
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
      query = query.or(`operation_name.ilike.%${search}%, patients.full_name.ilike.%${search}%, operation_notes.ilike.%${search}%`)
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
    // Authentication check
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check
    const authorized = await authorize(user, 'create_operations')
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

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