import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('discharges', 'view')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const sortByParam = searchParams.get('sortBy') || 'discharge_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate sortBy against whitelist
    const allowedSortColumns = [
      'discharge_date',
      'admission_date',
      'discharge_type',
      'status',
      'created_at',
      'updated_at'
    ]
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : 'discharge_date'
    const patient_id = searchParams.get('patient_id')
    const case_id = searchParams.get('case_id')
    const status = searchParams.get('status')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('discharges')
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
      .is('deleted_at', null)

    // Apply filters
    if (search) {
      // First, find patient IDs that match the search term
      const { data: matchingPatients } = await supabase
        .from('patients')
        .select('id')
        .ilike('full_name', `%${search}%`)

      const patientIds = matchingPatients?.map(p => p.id) || []

      // Apply search to discharge fields and patient IDs
      if (patientIds.length > 0) {
        query = query.or(`discharge_summary.ilike.%${search}%,instructions.ilike.%${search}%,patient_id.in.(${patientIds.join(',')})`)
      } else {
        query = query.or(`discharge_summary.ilike.%${search}%,instructions.ilike.%${search}%`)
      }
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

    const { data: discharges, error, count } = await query

    if (error) {
      console.error('Discharges fetch error:', error)
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
      data: discharges || [],
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
    console.error('Unexpected error in discharges GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('discharges', 'create')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['patient_id', 'case_id', 'discharge_date']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate UUID fields
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(body.patient_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient_id format' },
        { status: 400 }
      )
    }

    if (!uuidRegex.test(body.case_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid case_id format' },
        { status: 400 }
      )
    }

    // Validate discharge_date format (ISO date)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.discharge_date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid discharge_date format (expected YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const { data: discharge, error } = await supabase
      .from('discharges')
      .insert([
        {
          patient_id: body.patient_id,
          case_id: body.case_id,
          admission_date: body.admission_date,
          discharge_date: body.discharge_date,
          discharge_type: body.discharge_type || 'regular',
          discharge_summary: body.discharge_summary,
          final_diagnosis: body.final_diagnosis,
          treatment_given: body.treatment_given,
          condition_on_discharge: body.condition_on_discharge,
          instructions: body.instructions,
          follow_up_date: body.follow_up_date,
          medications: body.medications,
          vitals_at_discharge: body.vitals_at_discharge,
          doctor_id: body.doctor_id,
          status: body.status || 'completed',
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
      console.error('Discharge creation error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: discharge,
      message: 'Discharge record created successfully'
    })

  } catch (error) {
    console.error('Unexpected error in discharges POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}