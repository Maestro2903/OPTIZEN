import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { logger } from '@/lib/utils/logger'

// GET /api/diagnosis-tests - List diagnosis test records
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
      .from('diagnosis_tests')
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
      logger.error('Error fetching diagnosis test records', error, {
        request_id: requestId,
        endpoint: '/api/diagnosis-tests',
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('GET', '/api/diagnosis-tests', 200, duration, requestId, {
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
    logger.error('API error in GET /diagnosis-tests', error, {
      request_id: requestId,
      endpoint: '/api/diagnosis-tests',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/diagnosis-tests - Create new diagnosis test record
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
      .from('diagnosis_tests')
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
    const recordData: any = {
      patient_id: body.patient_id || null,
      record_date: body.record_date,
      record_time: body.record_time || null,
      record_number: body.record_number,
      diagnosis_data: body.diagnosis_data || {},
      tests_data: body.tests_data || {},
      created_by: context.user_id
    }

    const { data: record, error } = await supabase
      .from('diagnosis_tests')
      .insert([recordData] as any)
      .select()
      .single()

    if (error) {
      logger.error('Error creating diagnosis test record', error, {
        request_id: requestId,
        endpoint: '/api/diagnosis-tests',
        user_id: context.user_id,
        record_number: body.record_number
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!record) {
      logger.error('No record returned after insert', {
        request_id: requestId,
        endpoint: '/api/diagnosis-tests',
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: 'Failed to create record' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('POST', '/api/diagnosis-tests', 201, duration, requestId, {
      user_id: context.user_id,
      record_id: (record as any).id,
      record_number: body.record_number
    })

    return NextResponse.json({
      success: true,
      data: record
    }, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in POST /diagnosis-tests', error, {
      request_id: requestId,
      endpoint: '/api/diagnosis-tests',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}





