import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'

// GET /api/employees - List employees with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'created_at'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status') || ''
    const role = searchParams.get('role') || ''
    const department = searchParams.get('department') || ''

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100) // Cap at 100

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Validate sortBy against allowlist
    const allowedSortColumns = [
      'created_at',
      'full_name',
      'email',
      'employee_id',
      'role',
      'department',
      'hire_date',
      'status'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'created_at'
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })

    // Apply search filter with sanitized input
    if (search) {
      // Escape special wildcard characters: backslash first, then % and _
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,employee_id.ilike.%${sanitizedSearch}%,phone.ilike.%${sanitizedSearch}%,role.ilike.%${sanitizedSearch}%`)
    }

    // Parse and validate filters (support arrays)
    const allowedStatuses = ['active', 'inactive']
    const statusValues = status ? validateArrayParam(
      parseArrayParam(status),
      allowedStatuses,
      false
    ) : []

    // Note: role and department don't have predefined enums, so we just parse arrays
    const roleValues = role ? parseArrayParam(role) : []
    const departmentValues = department ? parseArrayParam(department) : []

    // Apply status filter (supports multiple values)
    if (statusValues.length > 0) {
      query = applyArrayFilter(query, 'status', statusValues)
    }

    // Apply role filter (supports multiple values)
    if (roleValues.length > 0) {
      query = applyArrayFilter(query, 'role', roleValues)
    }

    // Apply department filter (supports multiple values)
    if (departmentValues.length > 0) {
      query = applyArrayFilter(query, 'department', departmentValues)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: employees, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: employees,
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

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const {
      employee_id,
      full_name,
      email,
      phone,
      role,
      department,
      hire_date,
      salary,
      address,
      emergency_contact,
      emergency_phone,
      qualifications,
      license_number,
      status = 'active'
    } = body

    if (!employee_id || !full_name || !email || !phone || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id, full_name, email, phone, role' },
        { status: 400 }
      )
    }

    // Insert new employee
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([
        {
          employee_id,
          full_name,
          email,
          phone,
          role,
          department,
          hire_date,
          salary,
          address,
          emergency_contact,
          emergency_phone,
          qualifications,
          license_number,
          status,
          created_by: session.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'Employee ID or email already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}