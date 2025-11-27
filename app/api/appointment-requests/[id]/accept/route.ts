import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { generatePatientId } from '@/lib/utils/id-generator'

// POST /api/appointment-requests/[id]/accept - Accept appointment request and create patient + appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('bookings', 'create')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params
    const body = await request.json()

    // Use context.user_id - requirePermission already validated the user
    // In Supabase, users.id matches auth.users.id (same UUID)
    const authUserId = context.user_id

    // Get the appointment request
    const { data: appointmentRequest, error: requestError } = await supabase
      .from('appointment_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError || !appointmentRequest) {
      return NextResponse.json(
        { error: 'Appointment request not found' },
        { status: 404 }
      )
    }

    if (appointmentRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${appointmentRequest.status}` },
        { status: 400 }
      )
    }

    // Extract patient information from body (full form data)
    const {
      full_name,
      email,
      mobile,
      gender,
      date_of_birth,
      country,
      state,
      address,
      city,
      postal_code,
      emergency_contact,
      emergency_phone,
      medical_history,
      current_medications,
      allergies,
      insurance_provider,
      insurance_number,
    } = body

    // Validate required fields
    if (!full_name || !mobile || !gender || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, mobile, gender, state' },
        { status: 400 }
      )
    }
    
    // Country is optional (has database default), but if provided should be valid
    // Default to 'India' if not provided (matches database default)
    const finalCountry = country || 'India'

    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Validate mobile number format
    const mobileRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/
    if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid mobile number format. Expected 10 digits with optional country code' },
        { status: 400 }
      )
    }

    // Validate gender
    const allowedGenders = ['male', 'female', 'other']
    if (!allowedGenders.includes(gender.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid gender. Allowed values: ${allowedGenders.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate patient ID and create patient with retry logic
    let patient: any
    let patientError: any
    const maxPatientRetries = 3
    
    for (let retryAttempt = 0; retryAttempt < maxPatientRetries; retryAttempt++) {
      // Generate patient ID
      let patient_id: string
      try {
        patient_id = await generatePatientId()
      } catch (error) {
        console.error('[Accept Booking] Error generating patient ID:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          requestId: id,
          attempt: retryAttempt + 1,
        })
        if (retryAttempt === maxPatientRetries - 1) {
          return NextResponse.json(
            { 
              error: 'Failed to generate patient ID', 
              details: error instanceof Error ? error.message : 'Unknown error',
              code: 'PATIENT_ID_GENERATION_FAILED'
            },
            { status: 500 }
          )
        }
        // Retry with new ID
        continue
      }

      // Create patient
      const patientData = {
        patient_id,
        full_name,
        email: email || null,
        mobile,
        gender: gender.toLowerCase(),
        date_of_birth: date_of_birth || null,
        country: finalCountry, // Use provided country or default to 'India'
        state,
        address: address || null,
        city: city || null,
        postal_code: postal_code || null,
        emergency_contact: emergency_contact || null,
        emergency_phone: emergency_phone || null,
        medical_history: medical_history || null,
        current_medications: current_medications || null,
        allergies: allergies || null,
        insurance_provider: insurance_provider || null,
        insurance_number: insurance_number || null,
        status: 'active',
        created_by: authUserId, // Use auth.users ID directly to match foreign key constraint
      }

      const result = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single()

      patient = result.data
      patientError = result.error

      // If successful, break out of retry loop
      if (!patientError) {
        break
      }

      // If it's a unique constraint violation on patient_id, retry with new ID
      if (patientError.code === '23505' && patientError.message?.includes('patient_id')) {
        console.warn('[Accept Booking] Patient ID collision detected, retrying:', {
          patientId: patient_id,
          attempt: retryAttempt + 1,
          maxAttempts: maxPatientRetries,
        })
        // Continue to retry with new ID
        continue
      }

      // For other errors, log and break (don't retry)
      break
    }

    if (patientError) {
      console.error('[Accept Booking] Error creating patient:', {
        error: patientError,
        code: patientError.code,
        message: patientError.message,
        details: patientError.details,
        hint: patientError.hint,
        requestId: id,
        userId: authUserId,
        contextUserId: context.user_id,
        sanitizedData: {
          full_name,
          mobile: mobile ? `${mobile.slice(0, 3)}***` : null,
          email: email ? `${email.split('@')[0]}@***` : null,
          gender,
          country: finalCountry,
          state,
        }
      })
      return NextResponse.json(
        { 
          error: 'Failed to create patient', 
          details: patientError.message,
          code: patientError.code || 'PATIENT_CREATION_FAILED',
          hint: patientError.hint
        },
        { status: 500 }
      )
    }

    // Check for appointment conflicts
    if (appointmentRequest.provider_id) {
      const { data: conflictingAppointments } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('provider_id', appointmentRequest.provider_id)
        .eq('appointment_date', appointmentRequest.appointment_date)
        .neq('status', 'cancelled')

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        for (const existing of conflictingAppointments) {
          const [newStartH, newStartM] = appointmentRequest.start_time.split(':').map(Number)
          const [newEndH, newEndM] = appointmentRequest.end_time.split(':').map(Number)
          const [exStartH, exStartM] = existing.start_time.split(':').map(Number)
          const [exEndH, exEndM] = existing.end_time.split(':').map(Number)
          
          const newStart = newStartH * 60 + newStartM
          const newEnd = newEndH * 60 + newEndM
          const exStart = exStartH * 60 + exStartM
          const exEnd = exEndH * 60 + exEndM

          if ((newStart < exEnd && newEnd > exStart)) {
            // Delete the patient we just created
            await supabase.from('patients').delete().eq('id', patient.id)
            
            return NextResponse.json(
              { error: 'Time slot is already booked. Please choose a different time.' },
              { status: 409 }
            )
          }
        }
      }
    }

    // Ensure we have a provider_id - it's required by the appointments table
    let providerId = appointmentRequest.provider_id
    
    if (!providerId) {
      // Find an available doctor/provider for this appointment time
      // First, get all active doctors/optometrists/ophthalmologists
      const { data: availableProviders, error: providerError } = await supabase
        .from('users')
        .select('id')
        .in('role', ['optometrist', 'ophthalmologist', 'doctor'])
        .eq('is_active', true)
        .limit(1)
      
      if (providerError || !availableProviders || availableProviders.length === 0) {
        // Delete the patient we just created
        await supabase.from('patients').delete().eq('id', patient.id)
        
        console.error('[Accept Booking] No available providers found:', {
          requestId: id,
          error: providerError,
        })
        
        return NextResponse.json(
          { 
            error: 'No available doctor found. Please assign a doctor to the appointment request before accepting.',
            code: 'NO_PROVIDER_AVAILABLE'
          },
          { status: 400 }
        )
      }
      
      // Use the first available provider
      providerId = availableProviders[0].id
      
      console.log('[Accept Booking] Auto-assigned provider:', {
        requestId: id,
        providerId,
        appointmentDate: appointmentRequest.appointment_date,
      })
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: patient.id,
          provider_id: providerId, // Now guaranteed to be non-null
          appointment_date: appointmentRequest.appointment_date,
          start_time: appointmentRequest.start_time,
          end_time: appointmentRequest.end_time,
          type: appointmentRequest.type,
          status: 'scheduled',
          room: null,
          notes: appointmentRequest.notes || appointmentRequest.reason || null,
        }
      ])
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_id,
          full_name,
          email,
          mobile
        ),
        users!appointments_provider_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .single()

    if (appointmentError) {
      console.error('[Accept Booking] Error creating appointment:', {
        error: appointmentError,
        code: appointmentError.code,
        message: appointmentError.message,
        details: appointmentError.details,
        hint: appointmentError.hint,
        requestId: id,
        patientId: patient.id,
        appointmentData: {
          patient_id: patient.id,
          provider_id: appointmentRequest.provider_id,
          appointment_date: appointmentRequest.appointment_date,
          start_time: appointmentRequest.start_time,
          end_time: appointmentRequest.end_time,
          type: appointmentRequest.type,
        }
      })
      // Delete the patient we just created
      const deleteError = await supabase.from('patients').delete().eq('id', patient.id)
      if (deleteError.error) {
        console.error('[Accept Booking] Failed to cleanup patient after appointment creation error:', deleteError.error)
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create appointment', 
          details: appointmentError.message,
          code: appointmentError.code || 'APPOINTMENT_CREATION_FAILED',
          hint: appointmentError.hint
        },
        { status: 500 }
      )
    }

    // Update appointment request status
    // Note: processed_by references users table, not auth.users, so use context.user_id
    // Also update provider_id if it was auto-assigned
    const updateData: any = {
      status: 'accepted',
      processed_by: context.user_id, // users table reference
      processed_at: new Date().toISOString(),
      patient_id: patient.id,
      appointment_id: appointment.id,
    }
    
    // If provider was auto-assigned, update the request with the provider_id
    if (!appointmentRequest.provider_id && providerId) {
      updateData.provider_id = providerId
    }
    
    const { error: updateError } = await supabase
      .from('appointment_requests')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('[Accept Booking] Error updating request status:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        requestId: id,
        patientId: patient.id,
        appointmentId: appointment.id,
      })
      // Don't fail the whole operation, but log it
    }

    return NextResponse.json({
      success: true,
      data: {
        patient,
        appointment,
        request: {
          ...appointmentRequest,
          status: 'accepted',
          patient_id: patient.id,
          appointment_id: appointment.id,
        },
      },
      message: 'Appointment request accepted and appointment created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('[Accept Booking] Unexpected API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      requestId: await params.then(p => p.id).catch(() => 'unknown'),
    })
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

