import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { logger } from '@/lib/utils/logger'

// GET /api/out-patient-records - List out patient records
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
    const receipt_no = searchParams.get('receipt_no')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('out_patient_records')
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
      query = query.or(`receipt_no.ilike.%${search}%,name.ilike.%${search}%,uhd_no.ilike.%${search}%`)
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    if (receipt_no) {
      query = query.eq('receipt_no', receipt_no)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: records, error, count } = await query

    if (error) {
      logger.error('Error fetching out patient records', error, {
        request_id: requestId,
        endpoint: '/api/out-patient-records',
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('GET', '/api/out-patient-records', 200, duration, requestId, {
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
    logger.error('API error in GET /out-patient-records', error, {
      request_id: requestId,
      endpoint: '/api/out-patient-records',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/out-patient-records - Create new out patient record
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
    if (!body.receipt_no) {
      return NextResponse.json(
        { success: false, error: 'Receipt number is required' },
        { status: 400 }
      )
    }

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Patient name is required' },
        { status: 400 }
      )
    }

    if (!body.record_date) {
      return NextResponse.json(
        { success: false, error: 'Record date is required' },
        { status: 400 }
      )
    }

    // Check if receipt_no already exists
    const { data: existing } = await supabase
      .from('out_patient_records')
      .select('id')
      .eq('receipt_no', body.receipt_no)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Receipt number already exists' },
        { status: 400 }
      )
    }

    // Prepare data for insertion
    const recordData: any = {
      receipt_no: body.receipt_no,
      uhd_no: body.uhd_no || null,
      record_date: body.record_date,
      record_time: body.record_time || null,
      patient_id: body.patient_id || null,
      name: body.name,
      age: body.age || null,
      sex: body.sex || null,
      address: body.address || null,
      pain_assessment_scale: body.pain_assessment_scale || null,
      complaints: body.complaints || null,
      diagnosis: body.diagnosis || null,
      tension: body.tension || null,
      fundus: body.fundus || null,
      eye_examination: body.eye_examination || {},
      vision_assessment: body.vision_assessment || {},
      history: body.history || {},
      proposed_plan: body.proposed_plan || null,
      rx: body.rx || null,
      urine_albumin: body.urine_albumin || null,
      urine_sugar: body.urine_sugar || null,
      bp: body.bp || null,
      weight: body.weight || null,
      created_by: context.user_id
    }

    const { data: record, error } = await supabase
      .from('out_patient_records')
      .insert([recordData] as any)
      .select()
      .single()

    if (error) {
      logger.error('Error creating out patient record', error, {
        request_id: requestId,
        endpoint: '/api/out-patient-records',
        user_id: context.user_id,
        receipt_no: body.receipt_no
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!record) {
      logger.error('No record returned after insert', {
        request_id: requestId,
        endpoint: '/api/out-patient-records',
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: 'Failed to create record' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('POST', '/api/out-patient-records', 201, duration, requestId, {
      user_id: context.user_id,
      record_id: (record as any).id,
      receipt_no: body.receipt_no
    })

    return NextResponse.json({
      success: true,
      data: record
    }, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in POST /out-patient-records', error, {
      request_id: requestId,
      endpoint: '/api/out-patient-records',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}






