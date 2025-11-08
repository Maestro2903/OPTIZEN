import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/attendance - List attendance records
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const authResult = await requirePermission(request, 'attendance', 'read')
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const search = searchParams.get('search') || ''
    const sortByParam = searchParams.get('sortBy') || 'attendance_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const user_id = searchParams.get('user_id')

    // Validate sortBy against whitelist
    const allowedSortColumns = ['attendance_date', 'status', 'check_in_time', 'check_out_time', 'created_at']
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : 'attendance_date'

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('staff_attendance')
      .select('*', { count: 'exact' })

    // Apply filters
    // Note: Search on joined table fields requires different syntax
    if (search) {
      const searchPattern = `%${search}%`
      query = query.or(`notes.ilike.${searchPattern}`)
    }

    if (date) {
      query = query.eq('attendance_date', date)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: offset + limit < (count || 0),
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/attendance - Create attendance record
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const authResult = await requirePermission(request, 'attendance', 'create')
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['user_id', 'attendance_date', 'status']
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Allowed fields for insertion
    const allowedFields = [
      'user_id',
      'attendance_date',
      'status',
      'check_in_time',
      'check_out_time',
      'notes',
    ]

    const insertData: any = {
      created_by: authResult.context?.user_id || '00000000-0000-0000-0000-000000000000',
    }

    allowedFields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== null) {
        insertData[field] = body[field]
      }
    })

    const { data, error } = await supabase
      .from('staff_attendance')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

