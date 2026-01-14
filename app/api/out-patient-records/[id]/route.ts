import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { logger } from '@/lib/utils/logger'

// GET /api/out-patient-records/[id] - Get single out patient record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()
  const { id } = await params

  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createServiceClient()

    const { data: record, error } = await supabase
      .from('out_patient_records')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          date_of_birth,
          gender,
          address
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Record not found' },
          { status: 404 }
        )
      }
      logger.error('Error fetching out patient record', error, {
        request_id: requestId,
        endpoint: `/api/out-patient-records/${id}`,
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('GET', `/api/out-patient-records/${id}`, 200, duration, requestId, {
      user_id: context.user_id
    })

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in GET /out-patient-records/[id]', error, {
      request_id: requestId,
      endpoint: `/api/out-patient-records/${id}`,
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/out-patient-records/[id] - Update out patient record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()
  const { id } = await params

  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'edit')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createServiceClient()
    const body = await request.json()

    // Check if receipt_no is being changed and if it already exists
    if (body.receipt_no) {
      const { data: existing } = await supabase
        .from('out_patient_records')
        .select('id')
        .eq('receipt_no', body.receipt_no)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Receipt number already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update provided fields
    const allowedFields = [
      'receipt_no', 'uhd_no', 'record_date', 'record_time',
      'patient_id', 'name', 'age', 'sex', 'address',
      'pain_assessment_scale', 'complaints', 'diagnosis', 'tension', 'fundus',
      'eye_examination', 'vision_assessment', 'history',
      'proposed_plan', 'rx', 'urine_albumin', 'urine_sugar', 'bp', 'weight'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const { data: record, error } = await (supabase as any)
      .from('out_patient_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating out patient record', error, {
        request_id: requestId,
        endpoint: `/api/out-patient-records/${id}`,
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('PUT', `/api/out-patient-records/${id}`, 200, duration, requestId, {
      user_id: context.user_id
    })

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in PUT /out-patient-records/[id]', error, {
      request_id: requestId,
      endpoint: `/api/out-patient-records/${id}`,
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/out-patient-records/[id] - Delete out patient record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()
  const { id } = await params

  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'delete')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('out_patient_records')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting out patient record', error, {
        request_id: requestId,
        endpoint: `/api/out-patient-records/${id}`,
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('DELETE', `/api/out-patient-records/${id}`, 200, duration, requestId, {
      user_id: context.user_id
    })

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in DELETE /out-patient-records/[id]', error, {
      request_id: requestId,
      endpoint: `/api/out-patient-records/${id}`,
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}






