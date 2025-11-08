import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation ID format' },
        { status: 400 }
      )
    }

    // Get user role from users table (secure authorization)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch operation with all required data including authorization fields
    const { data: operation, error } = await supabase
      .from('operations')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender,
          user_id
        ),
        cases:case_id (
          id,
          case_no,
          diagnosis
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Operation fetch error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    // Check if user is authorized to view this operation
    const userRole = userData.role
    const isAuthorized =
      userRole === 'super_admin' ||
      userRole === 'hospital_admin' ||
      userRole === 'ophthalmologist' ||
      userRole === 'optometrist' ||
      operation.surgeon_id === user.id ||
      operation.anesthetist_id === user.id ||
      operation.patients?.user_id === user.id

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: operation
    })

  } catch (error) {
    console.error('Unexpected error in operation GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation ID format' },
        { status: 400 }
      )
    }

    // Get user role from users table (secure authorization)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch operation for authorization check
    const { data: operationAuth, error: fetchError } = await supabase
      .from('operations')
      .select('surgeon_id, anesthetist_id, patient_id, patients(user_id)')
      .eq('id', id)
      .single()

    if (fetchError || !operationAuth) {
      return NextResponse.json(
        { success: false, error: 'Operation not found' },
        { status: 404 }
      )
    }

    // Check if user is authorized to update this operation
    const userRole = userData.role
    const isAuthorized =
      userRole === 'super_admin' ||
      userRole === 'hospital_admin' ||
      userRole === 'ophthalmologist' ||
      userRole === 'optometrist' ||
      operationAuth.surgeon_id === user.id ||
      operationAuth.anesthetist_id === user.id ||
      (operationAuth.patients as any)?.user_id === user.id

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - insufficient permissions to update this operation' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Define allowed fields that can be updated
    const allowedFields = [
      'operation_name',
      'operation_date',
      'operation_type',
      'procedure_details',
      'surgeon_id',
      'anesthetist_id',
      'duration',
      'complications',
      'status',
      'notes'
    ]

    // Validate surgeon_id and anesthetist_id if provided
    if (body.surgeon_id) {
      const { data: surgeon, error: surgeonError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', body.surgeon_id)
        .eq('role', 'surgeon')
        .single()

      if (surgeonError || !surgeon) {
        return NextResponse.json({
          success: false,
          error: 'Invalid surgeon_id - user not found or does not have surgeon role'
        }, { status: 400 })
      }
    }

    if (body.anesthetist_id) {
      const { data: anesthetist, error: anesthetistError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', body.anesthetist_id)
        .eq('role', 'anesthetist')
        .single()

      if (anesthetistError || !anesthetist) {
        return NextResponse.json({
          success: false,
          error: 'Invalid anesthetist_id - user not found or does not have anesthetist role'
        }, { status: 400 })
      }
    }

    // Build update data with only allowed fields
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update. Allowed fields: ' + allowedFields.join(', ')
      }, { status: 400 })
    }

    const { data: operation, error } = await supabase
      .from('operations')
      .update(updateData)
      .eq('id', id)
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
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Operation update error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: operation,
      message: 'Operation updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in operation PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation ID format' },
        { status: 400 }
      )
    }

    // Check if operation exists and is not already deleted
    const { data: existingOperation, error: fetchError } = await supabase
      .from('operations')
      .select('id, deleted_at')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Operation not found' },
          { status: 404 }
        )
      }
      console.error('Operation fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch operation' },
        { status: 500 }
      )
    }

    if (existingOperation.deleted_at) {
      return NextResponse.json(
        { success: false, error: 'Operation already deleted' },
        { status: 410 }
      )
    }

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('operations')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null) // Only delete if not already deleted

    if (error) {
      console.error('Operation soft deletion error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete operation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Operation deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in operation DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}