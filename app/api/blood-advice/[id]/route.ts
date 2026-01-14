import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { logger } from '@/lib/utils/logger'

// GET /api/blood-advice/[id] - Get single blood advice record
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
      .from('blood_advice_records')
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
          state
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
      logger.error('Error fetching blood advice record', error, {
        request_id: requestId,
        endpoint: `/api/blood-advice/${id}`,
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('GET', `/api/blood-advice/${id}`, 200, duration, requestId, {
      user_id: context.user_id
    })

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in GET /blood-advice/[id]', error, {
      request_id: requestId,
      endpoint: `/api/blood-advice/${id}`,
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/blood-advice/[id] - Update blood advice record
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

    // Check if record_number is being changed and if it already exists
    if (body.record_number) {
      const { data: existing } = await supabase
        .from('blood_advice_records')
        .select('id')
        .eq('record_number', body.record_number)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Record number already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: context.user_id
    }

    // Only update provided fields
    const allowedFields = [
      'patient_id', 'record_date', 'record_time', 'record_number',
      'blood_investigation_data', 'advice_remarks'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const { data: record, error } = await (supabase as any)
      .from('blood_advice_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating blood advice record', error, {
        request_id: requestId,
        endpoint: `/api/blood-advice/${id}`,
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('PUT', `/api/blood-advice/${id}`, 200, duration, requestId, {
      user_id: context.user_id
    })

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in PUT /blood-advice/[id]', error, {
      request_id: requestId,
      endpoint: `/api/blood-advice/${id}`,
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/blood-advice/[id] - Delete blood advice record
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
      .from('blood_advice_records')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting blood advice record', error, {
        request_id: requestId,
        endpoint: `/api/blood-advice/${id}`,
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('DELETE', `/api/blood-advice/${id}`, 200, duration, requestId, {
      user_id: context.user_id
    })

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in DELETE /blood-advice/[id]', error, {
      request_id: requestId,
      endpoint: `/api/blood-advice/${id}`,
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}



