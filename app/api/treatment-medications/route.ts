import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { logger } from '@/lib/utils/logger'

// GET /api/treatment-medications - List treatment medication records
export async function GET(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()

  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const patient_id = searchParams.get('patient_id')
    const record_number = searchParams.get('record_number')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('treatment_medication_records')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile
        )
      `, { count: 'exact' })
      .order('record_date', { ascending: false })
      .order('record_time', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`record_number.ilike.%${search}%`)
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    if (record_number) {
      query = query.eq('record_number', record_number)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: records, error, count } = await query

    if (error) {
      logger.error('Error fetching treatment medication records', error, {
        request_id: requestId,
        endpoint: '/api/treatment-medications',
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('GET', '/api/treatment-medications', 200, duration, requestId, {
      user_id: context.user_id,
      count: records?.length || 0
    })

    return NextResponse.json({
      success: true,
      data: records || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in GET /treatment-medications', error, {
      request_id: requestId,
      endpoint: '/api/treatment-medications',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/treatment-medications - Create new treatment medication record
export async function POST(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()

  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'create')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createServiceClient()
    const body = await request.json()

    // Validate required fields
    if (!body.record_number) {
      return NextResponse.json(
        { success: false, error: 'Record number is required' },
        { status: 400 }
      )
    }

    if (!body.record_date) {
      return NextResponse.json(
        { success: false, error: 'Record date is required' },
        { status: 400 }
      )
    }

    // Check if record_number already exists
    const { data: existing } = await supabase
      .from('treatment_medication_records')
      .select('id')
      .eq('record_number', body.record_number)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Record number already exists' },
        { status: 400 }
      )
    }

    // Prepare data for insertion
    const recordData = {
      patient_id: body.patient_id || null,
      record_date: body.record_date,
      record_time: body.record_time || null,
      record_number: body.record_number,
      medications_data: body.medications_data || {},
      past_medications_data: body.past_medications_data || {},
      past_treatments_data: body.past_treatments_data || {},
      surgeries_data: body.surgeries_data || {},
      treatments_data: body.treatments_data || {},
      created_by: context.user_id
    }

    const { data: record, error } = await supabase
      .from('treatment_medication_records')
      .insert([recordData] as any)
      .select()
      .single()

    if (error) {
      logger.error('Error creating treatment medication record', error, {
        request_id: requestId,
        endpoint: '/api/treatment-medications',
        user_id: context.user_id,
        record_number: body.record_number
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('POST', '/api/treatment-medications', 201, duration, requestId, {
      user_id: context.user_id,
      record_id: record?.id,
      record_number: body.record_number
    })

    return NextResponse.json({
      success: true,
      data: record
    }, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in POST /treatment-medications', error, {
      request_id: requestId,
      endpoint: '/api/treatment-medications',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}











