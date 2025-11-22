import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/attendance - List attendance records with employee details
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const authResult = await requirePermission('attendance', 'view')
    if (!authResult.authorized) {
      return (authResult as { authorized: false; response: NextResponse }).response
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
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const status = searchParams.get('status')
    const user_id = searchParams.get('user_id')
    const department = searchParams.get('department')
    const role = searchParams.get('role')

    // Validate sortBy against whitelist
    const allowedSortColumns = ['attendance_date', 'status', 'check_in_time', 'check_out_time', 'working_hours', 'created_at']
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : 'attendance_date'

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with employee join
    let query = supabase
      .from('staff_attendance')
      .select(`
        *,
        employees:user_id (
          id,
          employee_id,
          full_name,
          email,
          phone,
          role,
          department
        )
      `, { count: 'exact' })

    // Apply date filters
    if (date) {
      query = query.eq('attendance_date', date)
    } else if (date_from && date_to) {
      query = query.gte('attendance_date', date_from).lte('attendance_date', date_to)
    } else if (date_from) {
      query = query.gte('attendance_date', date_from)
    } else if (date_to) {
      query = query.lte('attendance_date', date_to)
    }

    // Apply status filter (support multiple statuses)
    if (status) {
      const statuses = status.split(',').map(s => s.trim())
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0])
      } else if (statuses.length > 1) {
        query = query.in('status', statuses)
      }
    }

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    // Apply role and department filters via joins
    // Note: Supabase PostgREST doesn't support filtering on joined tables directly,
    // so we need to fetch user IDs first if filtering by role/department
    let userIdsToFilter: string[] | null = null
    
    if (search || role || department) {
      // First, get matching user IDs from the users table
      let userQuery = supabase
        .from('users')
        .select('id, full_name, email, role, department')
      
      if (role) {
        userQuery = userQuery.eq('role', role)
      }
      
      if (department) {
        userQuery = userQuery.eq('department', department)
      }
      
      const { data: matchingUsers } = await userQuery
      
      // Filter by search term if provided
      let filteredUsers = matchingUsers || []
      if (search) {
        const searchLower = search.toLowerCase()
        filteredUsers = filteredUsers.filter(user => 
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.role?.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower)
        )
      }
      
      userIdsToFilter = filteredUsers.map(u => u.id)
      
      // If no users match the filter, return empty result
      if (userIdsToFilter.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        })
      }
      
      // Apply user ID filter to attendance query
      query = query.in('user_id', userIdsToFilter)
    }

    // Get total count before pagination with same filters
    let countQuery = supabase
      .from('staff_attendance')
      .select('*', { count: 'exact', head: true })
    
    // Apply same date filters as main query
    if (date) {
      countQuery = countQuery.eq('attendance_date', date)
    } else if (date_from && date_to) {
      countQuery = countQuery.gte('attendance_date', date_from).lte('attendance_date', date_to)
    } else if (date_from) {
      countQuery = countQuery.gte('attendance_date', date_from)
    } else if (date_to) {
      countQuery = countQuery.lte('attendance_date', date_to)
    }
    
    // Apply status filter
    if (status) {
      const statuses = status.split(',').map(s => s.trim())
      if (statuses.length === 1) {
        countQuery = countQuery.eq('status', statuses[0])
      } else if (statuses.length > 1) {
        countQuery = countQuery.in('status', statuses)
      }
    }
    
    if (user_id) {
      countQuery = countQuery.eq('user_id', user_id)
    }
    
    if (userIdsToFilter) {
      countQuery = countQuery.in('user_id', userIdsToFilter)
    }
    
    const { count: totalCount } = await countQuery
    
    // Get status counts for filters (with same date/search filters)
    let statusCountQuery = supabase
      .from('staff_attendance')
      .select('status')
    
    // Apply same filters for status counts
    if (date) {
      statusCountQuery = statusCountQuery.eq('attendance_date', date)
    } else if (date_from && date_to) {
      statusCountQuery = statusCountQuery.gte('attendance_date', date_from).lte('attendance_date', date_to)
    } else if (date_from) {
      statusCountQuery = statusCountQuery.gte('attendance_date', date_from)
    } else if (date_to) {
      statusCountQuery = statusCountQuery.lte('attendance_date', date_to)
    }
    
    if (user_id) {
      statusCountQuery = statusCountQuery.eq('user_id', user_id)
    }
    
    if (userIdsToFilter) {
      statusCountQuery = statusCountQuery.in('user_id', userIdsToFilter)
    }
    
    const { data: statusData } = await statusCountQuery
    
    // Calculate status counts
    const statusCounts = {
      present: 0,
      absent: 0,
      sick_leave: 0,
      casual_leave: 0,
      paid_leave: 0,
      half_day: 0
    }
    
    statusData?.forEach(record => {
      if (record.status && statusCounts.hasOwnProperty(record.status)) {
        statusCounts[record.status as keyof typeof statusCounts]++
      }
    })
    
    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    const total = totalCount || 0

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: offset + limit < total,
        hasPrevPage: page > 1,
      },
      statusCounts,
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
    const authResult = await requirePermission('attendance', 'create')
    if (!authResult.authorized) {
      return (authResult as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['user_id', 'attendance_date', 'status']
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'sick_leave', 'casual_leave', 'paid_leave', 'half_day']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate attendance date - prevent future dates for present/absent status
    const attendanceDate = new Date(body.attendance_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    attendanceDate.setHours(0, 0, 0, 0)
    
    // Allow future dates only for leave requests
    const leaveStatuses = ['sick_leave', 'casual_leave', 'paid_leave']
    if (attendanceDate > today && !leaveStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot mark attendance for future dates. Use leave status for future absences.' },
        { status: 400 }
      )
    }

    // Validate times if provided
    if (body.check_in_time && body.check_out_time) {
      // Use Date objects for proper time comparison
      const checkIn = new Date(`2000-01-01T${body.check_in_time}`)
      const checkOut = new Date(`2000-01-01T${body.check_out_time}`)
      
      // Validate that check-out is after check-in
      if (checkOut <= checkIn) {
        return NextResponse.json(
          { success: false, error: 'Check-out time must be after check-in time' },
          { status: 400 }
        )
      }
      
      // Calculate working hours to validate
      const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      
      if (hoursWorked > 24) {
        return NextResponse.json(
          { success: false, error: 'Working hours cannot exceed 24 hours' },
          { status: 400 }
        )
      }
      
      if (hoursWorked < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid time range' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate attendance
    const { data: existingRecord } = await supabase
      .from('staff_attendance')
      .select('id')
      .eq('user_id', body.user_id)
      .eq('attendance_date', body.attendance_date)
      .single()

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Attendance record already exists for this user on this date' },
        { status: 409 }
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
      marked_by: authResult.context?.user_id,
    }

    allowedFields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        insertData[field] = body[field]
      }
    })

    // Insert with employee details
    const { data, error } = await supabase
      .from('staff_attendance')
      .insert(insertData)
      .select(`
        *,
        employees:user_id (
          id,
          employee_id,
          full_name,
          email,
          phone,
          role,
          department
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Attendance record already exists for this date' },
          { status: 409 }
        )
      }
      if (error.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'Invalid user ID' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create attendance record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

