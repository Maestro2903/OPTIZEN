import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/patients/[id] - Get a specific patient by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 })
    }

    // Authorization check
    // TODO: Implement patient access control (ownership or assigned provider)
    // For now, any authenticated user can view patients (add RBAC when available)
    // Example:
    // const { data: access } = await supabase
    //   .from('patients')
    //   .select('id')
    //   .eq('id', id)
    //   .or(`owner_id.eq.${session.user.id},assigned_provider.eq.${session.user.id}`)
    //   .single()
    // if (!access) {
    //   return NextResponse.json({ error: 'Forbidden: You do not have access to this patient' }, { status: 403 })
    // }

    // Fetch patient by ID
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: patient
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/patients/[id] - Update a patient
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 })
    }

    // Authorization check - fetch patient first
    // TODO: Implement patient access control (ownership or assigned provider)
    // For now, any authenticated user can update patients (add RBAC when available)
    // Example:
    // const { data: existingPatient } = await supabase
    //   .from('patients')
    //   .select('id, owner_id, assigned_provider')
    //   .eq('id', id)
    //   .single()
    // if (!existingPatient) {
    //   return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    // }
    // if (existingPatient.owner_id !== session.user.id && existingPatient.assigned_provider !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden: You do not have permission to update this patient' }, { status: 403 })
    // }

    // Define allowed fields that can be updated
    const allowedFields = [
      'full_name',
      'date_of_birth',
      'gender',
      'blood_group',
      'mobile',
      'email',
      'address',
      'city',
      'state',
      'pincode',
      'emergency_contact_name',
      'emergency_contact_phone',
      'medical_history',
      'allergies',
      'current_medications',
      'insurance_provider',
      'insurance_number',
      'status',
      'notes'
    ]

    // Build update data with only allowed fields
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validate status field if present
    if (updateData.status !== undefined) {
      const allowedStatuses = ['active', 'inactive']
      if (!allowedStatuses.includes(updateData.status)) {
        return NextResponse.json({
          error: `Invalid status value. Allowed values: ${allowedStatuses.join(', ')}`
        }, { status: 400 })
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: 'No valid fields to update. Allowed fields: ' + allowedFields.join(', ')
      }, { status: 400 })
    }

    // Add audit fields
    updateData.updated_at = new Date().toISOString()
    updateData.updated_by = session.user.id

    // Update patient
    const { data: patient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/patients/[id] - Delete a patient (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 })
    }

    // Soft delete by updating status to inactive
    const { data: patient, error } = await supabase
      .from('patients')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}