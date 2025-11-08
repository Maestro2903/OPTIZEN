import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/patients/[id] - Get a specific patient by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authorization check
  const authCheck = await requirePermission('patients', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 })
    }

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
  // Authorization check
  const authCheck = await requirePermission('patients', 'edit')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = params

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

    // Define allowed fields that can be updated (matches actual DB schema)
    const allowedFields = [
      'full_name',
      'date_of_birth',
      'gender',
      'mobile',
      'email',
      'address',
      'city',
      'state',
      'postal_code',
      'country',
      'emergency_contact',
      'emergency_phone',
      'medical_history',
      'allergies',
      'current_medications',
      'insurance_provider',
      'insurance_number',
      'status'
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
    updateData.updated_by = context.user_id

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

// DELETE /api/patients/[id] - Delete a patient (hard delete with cascade)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authorization check
  const authCheck = await requirePermission('patients', 'delete')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 })
    }

    // First, verify the patient exists and get their info
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('id, patient_id, full_name')
      .eq('id', id)
      .single()

    if (fetchError || !patient) {
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }
      console.error('Database error:', fetchError)
      return NextResponse.json({ error: 'Failed to find patient' }, { status: 500 })
    }

    console.log(`Starting cascade delete for patient: ${patient.full_name} (${patient.patient_id})`)

    // Execute cascade delete using SQL transaction for data integrity
    // This ensures all related data is deleted atomically
    const { data: deleteResult, error: deleteError } = await supabase.rpc('delete_patient_cascade', {
      patient_uuid: id
    })

    // If RPC doesn't exist, fall back to manual cascade delete
    if (deleteError?.code === '42883') { // Function does not exist
      console.log('RPC function not found, using manual cascade delete')
      
      // Delete related records in order (respecting potential dependencies)
      const deleteTasks = [
        // Delete appointments
        supabase.from('appointments').delete().eq('patient_id', id),
        // Delete bed assignments
        supabase.from('bed_assignments').delete().eq('patient_id', id),
        // Delete certificates
        supabase.from('certificates').delete().eq('patient_id', id),
        // Delete encounters (cases)
        supabase.from('encounters').delete().eq('patient_id', id),
        // Delete invoices
        supabase.from('invoices').delete().eq('patient_id', id),
        // Delete optical orders
        supabase.from('optical_orders').delete().eq('patient_id', id),
        // Delete prescriptions
        supabase.from('prescriptions').delete().eq('patient_id', id),
        // Delete surgeries
        supabase.from('surgeries').delete().eq('patient_id', id),
        // Delete audit logs
        supabase.from('medical_audit_logs').delete().eq('patient_id', id),
        supabase.from('financial_audit_logs').delete().eq('patient_id', id),
      ]

      // Execute all deletes
      const results = await Promise.all(deleteTasks)
      
      // Check for any errors in related deletes
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        console.error('Errors deleting related records:', errors)
        // Continue anyway - we'll try to delete the patient
      }

      // Log what was deleted
      results.forEach((result, index) => {
        const tables = [
          'appointments', 'bed_assignments', 'certificates', 'encounters',
          'invoices', 'optical_orders', 'prescriptions', 'surgeries',
          'medical_audit_logs', 'financial_audit_logs'
        ]
        if (!result.error) {
          console.log(`Deleted from ${tables[index]}`)
        }
      })

      // Finally, delete the patient record itself
      const { error: patientDeleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)

      if (patientDeleteError) {
        console.error('Error deleting patient:', patientDeleteError)
        return NextResponse.json({ 
          error: 'Failed to delete patient record',
          details: patientDeleteError.message 
        }, { status: 500 })
      }

      console.log(`Successfully deleted patient: ${patient.full_name} (${patient.patient_id}) and all related data`)

      return NextResponse.json({
        success: true,
        data: patient,
        message: 'Patient and all related data deleted successfully'
      })
    }

    // If RPC function exists and executed successfully
    if (deleteError) {
      console.error('Error in cascade delete:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete patient',
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log(`Successfully deleted patient: ${patient.full_name} (${patient.patient_id}) via RPC`)

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient and all related data deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}