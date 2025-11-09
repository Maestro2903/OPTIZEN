import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/cases - List cases with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('cases', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    let page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'created_at'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status') || ''
    const patient_id = searchParams.get('patient_id') || ''

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100)

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Validate sortBy against allowlist (prevent column enumeration)
    const allowedSortColumns = [
      'created_at',
      'updated_at',
      'case_no',
      'encounter_date',
      'status',
      'visit_type',
      'patient_id'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'created_at'
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with joins to get patient information
    let query = supabase
      .from('encounters')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        )
      `, { count: 'exact' })

    // Apply search filter with sanitization to prevent wildcard injection
    if (search) {
      // Escape special wildcard characters: backslash first, then % and _
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.or(`case_no.ilike.%${sanitizedSearch}%,patients.full_name.ilike.%${sanitizedSearch}%,patients.email.ilike.%${sanitizedSearch}%,patients.mobile.ilike.%${sanitizedSearch}%`)
    }

    // Parse and validate status parameter (supports arrays)
    const allowedStatuses = ['active', 'completed', 'cancelled', 'pending']
    const statusValues = status ? validateArrayParam(
      parseArrayParam(status),
      allowedStatuses,
      false
    ) : []

    // Apply status filter (supports multiple values)
    if (statusValues.length > 0) {
      query = applyArrayFilter(query, 'status', statusValues)
    }

    // Apply patient filter
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: cases, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: cases,
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

// POST /api/cases - Create a new case/encounter
export async function POST(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('cases', 'create')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const {
      case_no,
      patient_id,
      encounter_date,
      visit_type,
      chief_complaint,
      history_of_present_illness,
      past_medical_history,
      examination_findings,
      diagnosis,
      treatment_plan,
      medications_prescribed,
      follow_up_instructions,
      status = 'active',
      ...otherFields
    } = body

    if (!case_no || !patient_id || !encounter_date) {
      return NextResponse.json(
        { error: 'Missing required fields: case_no, patient_id, encounter_date' },
        { status: 400 }
      )
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Insert new case/encounter
    const { data: encounter, error } = await supabase
      .from('encounters')
      .insert([
        {
          case_no,
          patient_id,
          encounter_date,
          visit_type,
          chief_complaint,
          history_of_present_illness,
          past_medical_history,
          examination_findings,
          diagnosis,
          treatment_plan,
          medications_prescribed,
          follow_up_instructions,
          status,
          created_by: session.user.id,
          ...otherFields
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
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Case number already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: encounter,
      message: 'Case created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}