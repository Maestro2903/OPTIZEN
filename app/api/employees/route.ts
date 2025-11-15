import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/employees - List employees with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('employees', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

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

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query - employees are stored in the users table
    let query = supabase
      .from('users')
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
    // Note: users table has is_active (boolean), not status (text)
    const allowedStatuses = ['active', 'inactive']
    const statusValues = status ? validateArrayParam(
      parseArrayParam(status),
      allowedStatuses,
      false
    ) : []

    // Note: role and department don't have predefined enums, so we just parse arrays
    const roleValues = role ? parseArrayParam(role) : []
    const departmentValues = department ? parseArrayParam(department) : []

    // Apply status filter using is_active column (boolean)
    if (statusValues.length > 0) {
      if (statusValues.includes('active')) {
        query = query.eq('is_active', true)
      } else if (statusValues.includes('inactive')) {
        query = query.eq('is_active', false)
      }
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

// POST /api/employees - Create a new employee with authentication
export async function POST(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('employees', 'create')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const {
      employee_id,
      full_name,
      email,
      password,
      phone,
      role,
      department,
      position,
      hire_date,
      salary,
      address,
      emergency_contact,
      emergency_phone,
      qualifications,
      license_number,
      date_of_birth,
      gender,
      blood_group,
      marital_status,
      experience,
      is_active = true
    } = body

    // Validate required fields
    if (!employee_id || !full_name || !email || !password || !phone || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id, full_name, email, password, phone, role' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role against allowed enum values
    const validRoles = [
      'super_admin', 'hospital_admin', 'receptionist', 'optometrist', 
      'ophthalmologist', 'technician', 'billing_staff', 'admin', 
      'doctor', 'nurse', 'finance', 'pharmacy_staff', 'pharmacy', 
      'lab_technician', 'manager', 'read_only'
    ]
    if (!validRoles.includes(role.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        employee_id,
        role: role.toLowerCase()
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Email already registered in the system' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `Failed to create user account: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'Failed to create user account: No user data returned' },
        { status: 500 }
      )
    }

    // Step 2: Create user profile in public.users table
    const { data: employee, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use auth user ID
        employee_id,
        full_name,
        email,
        phone,
        role: role.toLowerCase(), // Normalize to lowercase for DB enum
        department,
        position,
        hire_date,
        salary: salary ? parseFloat(salary) : null,
        address,
        emergency_contact,
        emergency_phone,
        qualifications,
        license_number,
        date_of_birth,
        gender,
        blood_group,
        marital_status,
        experience,
        is_active,
        created_by: context.user_id
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Rollback: Delete the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('Rolled back auth user creation due to profile error')
      } catch (rollbackError) {
        console.error('Failed to rollback auth user:', rollbackError)
      }
      
      if (profileError.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'Employee ID or email already exists'
        }, { status: 409 })
      }
      return NextResponse.json({ 
        error: 'Failed to create employee profile',
        details: profileError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: `Employee ${full_name} created successfully. Login credentials have been set up.`
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}