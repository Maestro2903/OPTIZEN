import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'

// GET /api/patients - List patients with pagination, filtering, and sorting
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
    const gender = searchParams.get('gender') || ''
    const state = searchParams.get('state') || ''

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
      'patient_id',
      'status',
      'date_of_birth',
      'email',
      'mobile'
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
      .from('patients')
      .select('*', { count: 'exact' })

    // Apply search filter with sanitized input
    if (search) {
      // Escape special wildcard characters: backslash first, then % and _
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,mobile.ilike.%${sanitizedSearch}%`)
    }

    // Parse and validate status parameter (supports arrays)
    const allowedStatuses = ['active', 'inactive']
    const statusValues = status ? validateArrayParam(
      parseArrayParam(status),
      allowedStatuses,
      false
    ) : []

    // Parse and validate gender parameter (supports arrays)
    const allowedGenders = ['male', 'female', 'other']
    const genderValues = gender ? validateArrayParam(
      parseArrayParam(gender),
      allowedGenders,
      false
    ) : []

    // Apply status filter (supports multiple values)
    if (statusValues.length > 0) {
      query = applyArrayFilter(query, 'status', statusValues)
    }

    // Apply gender filter (supports multiple values)
    if (genderValues.length > 0) {
      query = applyArrayFilter(query, 'gender', genderValues)
    }

    // Apply state filter
    if (state) {
      query = query.eq('state', state)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: patients, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: patients,
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

// POST /api/patients - Create a new patient
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
      patient_id,
      full_name,
      email,
      mobile,
      gender,
      date_of_birth,
      address,
      city,
      state,
      postal_code,
      emergency_contact,
      emergency_phone,
      medical_history,
      current_medications,
      allergies,
      insurance_provider,
      insurance_number,
      status = 'active'
    } = body

    if (!patient_id || !full_name || !mobile || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, full_name, mobile, gender' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Validate mobile number format (10 digits, optional +country code)
    const mobileRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/
    if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid mobile number format. Expected 10 digits with optional country code' },
        { status: 400 }
      )
    }

    // Validate date_of_birth if provided
    if (date_of_birth) {
      const dob = new Date(date_of_birth)
      if (isNaN(dob.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date_of_birth format. Expected ISO date string' },
          { status: 400 }
        )
      }
      // Check if date is not in the future
      if (dob > new Date()) {
        return NextResponse.json(
          { error: 'date_of_birth cannot be in the future' },
          { status: 400 }
        )
      }
    }

    // Validate length limits
    if (full_name.length > 200) {
      return NextResponse.json({ error: 'full_name exceeds maximum length of 200 characters' }, { status: 400 })
    }
    if (address && address.length > 500) {
      return NextResponse.json({ error: 'address exceeds maximum length of 500 characters' }, { status: 400 })
    }
    if (medical_history && medical_history.length > 2000) {
      return NextResponse.json({ error: 'medical_history exceeds maximum length of 2000 characters' }, { status: 400 })
    }
    if (allergies && allergies.length > 1000) {
      return NextResponse.json({ error: 'allergies exceeds maximum length of 1000 characters' }, { status: 400 })
    }
    if (current_medications && current_medications.length > 1000) {
      return NextResponse.json({ error: 'current_medications exceeds maximum length of 1000 characters' }, { status: 400 })
    }

    // Validate gender enum
    const allowedGenders = ['male', 'female', 'other']
    if (!allowedGenders.includes(gender.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid gender. Allowed values: ${allowedGenders.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status enum
    const allowedStatuses = ['active', 'inactive']
    if (!allowedStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert new patient
    const { data: patient, error } = await supabase
      .from('patients')
      .insert([
        {
          patient_id,
          full_name,
          email: email || null,
          mobile,
          gender,
          date_of_birth,
          address,
          city,
          state,
          postal_code,
          emergency_contact,
          emergency_phone,
          medical_history,
          current_medications,
          allergies,
          insurance_provider,
          insurance_number,
          status,
          created_by: session.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Patient ID already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}