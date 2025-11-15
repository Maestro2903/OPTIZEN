import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// PATCH /api/appointments/[id]/reassign - Reassign appointment to another doctor
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authorization check - need edit permission
  const authCheck = await requirePermission('appointments', 'edit')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const appointmentId = params.id
    const body = await request.json()

    const { new_provider_id, reason, notes } = body

    // Validate required fields
    if (!new_provider_id) {
      return NextResponse.json(
        { error: 'Missing required field: new_provider_id' },
        { status: 400 }
      )
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reassignment reason is required' },
        { status: 400 }
      )
    }

    // Fetch current appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_id,
          full_name,
          mobile,
          email
        ),
        users!appointments_provider_id_fkey (
          id,
          full_name,
          role,
          email
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Security: Only assigned doctor or admins can reassign
    const isDoctorRole = ['optometrist', 'ophthalmologist'].includes(context.role)
    const isAdmin = ['super_admin', 'hospital_admin'].includes(context.role)
    
    if (isDoctorRole && context.user_id !== appointment.provider_id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only reassign your own appointments' },
        { status: 403 }
      )
    }

    // Verify new doctor exists and is active
    const { data: newDoctor, error: doctorError } = await supabase
      .from('users')
      .select('id, full_name, role, email')
      .eq('id', new_provider_id)
      .eq('is_active', true)
      .single()

    if (doctorError || !newDoctor) {
      return NextResponse.json({ error: 'New provider not found or inactive' }, { status: 404 })
    }

    // Verify new doctor is a medical professional
    const validRoles = ['optometrist', 'ophthalmologist', 'doctor']
    if (!validRoles.includes(newDoctor.role)) {
      return NextResponse.json(
        { error: 'New provider must be a medical professional' },
        { status: 400 }
      )
    }

    // Check for conflicts using the database function
    const { data: conflictCheck, error: conflictError } = await supabase
      .rpc('check_doctor_availability', {
        p_doctor_id: new_provider_id,
        p_date: appointment.appointment_date,
        p_start_time: appointment.start_time,
        p_end_time: appointment.end_time,
        p_exclude_appointment_id: appointmentId
      })

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json(
        { error: 'Failed to check doctor availability' },
        { status: 500 }
      )
    }

    // If there are conflicts, return them as a warning
    const conflicts = conflictCheck && conflictCheck.length > 0 ? conflictCheck[0] : null
    if (conflicts && conflicts.has_conflict) {
      return NextResponse.json({
        error: 'New provider has conflicting appointments',
        conflict: true,
        conflicts: conflicts.conflicting_appointments,
      }, { status: 409 })
    }

    // Get current user session for audit
    const { data: { session } } = await supabase.auth.getSession()

    // Perform reassignment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        provider_id: new_provider_id,
        original_provider_id: appointment.original_provider_id || appointment.provider_id,
        reassignment_reason: reason,
        reassignment_date: new Date().toISOString(),
        reassigned_by: session?.user?.id || context.user_id,
        updated_by: session?.user?.id || context.user_id,
      })
      .eq('id', appointmentId)
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_id,
          full_name,
          mobile,
          email
        ),
        users!appointments_provider_id_fkey (
          id,
          full_name,
          role,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to reassign appointment', details: updateError.message },
        { status: 500 }
      )
    }

    // Return success with updated appointment
    return NextResponse.json({
      success: true,
      message: `Appointment successfully reassigned from ${appointment.users?.full_name} to ${newDoctor.full_name}`,
      data: {
        appointment: updatedAppointment,
        previous_provider: {
          id: appointment.provider_id,
          name: appointment.users?.full_name,
          role: appointment.users?.role,
        },
        new_provider: {
          id: newDoctor.id,
          name: newDoctor.full_name,
          role: newDoctor.role,
        },
        reassignment: {
          reason,
          notes,
          date: updatedAppointment.reassignment_date,
          by: context.user_id,
        },
      },
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
