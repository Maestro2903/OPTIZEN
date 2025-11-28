import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/appointments/[id] - Get a specific appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'view')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params

    // Fetch appointment with patient information
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender,
          date_of_birth,
          address
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
    }

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: appointment
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/appointments/[id] - Update an appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'edit')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params

    const body = await request.json()

    // Validate request body
    const allowedStatuses = ['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show']
    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Validate dates
    if (body.appointment_date && isNaN(Date.parse(body.appointment_date))) {
      return NextResponse.json({ error: 'Invalid appointment date format' }, { status: 400 })
    }

    // Remove fields that shouldn't be updated
    const {
      id: _id,
      created_at,
      created_by,
      patient_id, // Don't allow changing patient
      ...updateData
    } = body

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // If updating time, check for conflicts
    if (updateData.appointment_date || updateData.start_time || updateData.end_time) {
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('appointment_date, start_time, end_time, provider_id')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching current appointment:', fetchError)
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
      }

      if (!currentAppointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      const newDate = updateData.appointment_date || currentAppointment.appointment_date
      const newStartTime = updateData.start_time || currentAppointment.start_time
      const newEndTime = updateData.end_time || currentAppointment.end_time
      const providerId = updateData.provider_id || currentAppointment.provider_id

      // Check for appointment conflicts (overlap detection)
      if (providerId) {
        const { data: conflictingAppointments, error: conflictError } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('provider_id', providerId)
          .eq('appointment_date', newDate)
          .neq('status', 'cancelled')
          .neq('id', id) // Exclude current appointment

        if (conflictError) {
          console.error('Error checking conflicts:', conflictError)
          return NextResponse.json({ error: 'Failed to check appointment conflicts' }, { status: 500 })
        }

        // Check for time overlaps
        if (conflictingAppointments && conflictingAppointments.length > 0) {
          for (const existing of conflictingAppointments) {
            // Convert times to minutes for comparison
            const [newStartH, newStartM] = newStartTime.split(':').map(Number)
            const [newEndH, newEndM] = newEndTime.split(':').map(Number)
            const [exStartH, exStartM] = existing.start_time.split(':').map(Number)
            const [exEndH, exEndM] = existing.end_time.split(':').map(Number)
            
            const newStartMinutes = newStartH * 60 + newStartM
            const newEndMinutes = newEndH * 60 + newEndM
            const exStartMinutes = exStartH * 60 + exStartM
            const exEndMinutes = exEndH * 60 + exEndM

            // Check for overlap: (start1 < end2 AND start2 < end1)
            if (newStartMinutes < exEndMinutes && exStartMinutes < newEndMinutes) {
              return NextResponse.json({
                error: `Provider has a conflicting appointment from ${existing.start_time} to ${existing.end_time}`,
                conflict: true,
                existingAppointment: {
                  start_time: existing.start_time,
                  end_time: existing.end_time
                }
              }, { status: 409 })
            }
          }
        }
      }
    }

    // Update appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
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
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/appointments/[id] - Cancel an appointment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'delete')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

  try {
    const supabase = createClient()
    const { id } = await params

    // Fetch current appointment with all needed fields for validation
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, status, appointment_date, start_time, end_time, patient_id, provider_id, created_at')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching appointment:', fetchError)
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
    }

    if (!currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Validate cancellation eligibility
    if (currentAppointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Appointment already cancelled' }, { status: 400 })
    }

    if (currentAppointment.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel completed appointment' }, { status: 400 })
    }

    // Optional: Check if appointment is in the past
    const appointmentDateTime = new Date(`${currentAppointment.appointment_date}T${currentAppointment.start_time}`)
    const now = new Date()
    if (appointmentDateTime < now) {
      return NextResponse.json({ 
        error: 'Cannot cancel a past appointment',
        appointmentDate: currentAppointment.appointment_date,
        appointmentTime: currentAppointment.start_time
      }, { status: 400 })
    }

    // Update status to cancelled instead of hard delete
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
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
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}