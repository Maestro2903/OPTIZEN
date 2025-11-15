import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/doctors/available - Get available doctors for a specific time slot
export async function GET(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'view')
  if (!authCheck.authorized) return authCheck.response

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const date = searchParams.get('date')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')
    const excludeDoctorId = searchParams.get('exclude_doctor_id')
    const role = searchParams.get('role') // Filter by role (optometrist, ophthalmologist)

    // Validate required parameters
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, start_time, end_time' },
        { status: 400 }
      )
    }

    // Validate date format
    if (isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM (24-hour format)' },
        { status: 400 }
      )
    }

    // Build query for active medical professionals
    let doctorsQuery = supabase
      .from('users')
      .select('id, full_name, email, role, department, phone, employee_id')
      .eq('is_active', true)
      .in('role', ['optometrist', 'ophthalmologist', 'doctor'])

    // Apply role filter if specified
    if (role) {
      doctorsQuery = doctorsQuery.eq('role', role)
    }

    // Exclude specific doctor if provided
    if (excludeDoctorId) {
      doctorsQuery = doctorsQuery.neq('id', excludeDoctorId)
    }

    const { data: doctors, error: doctorsError } = await doctorsQuery

    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError)
      return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
    }

    if (!doctors || doctors.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No doctors found matching criteria',
      })
    }

    // Check availability for each doctor
    const availabilityPromises = doctors.map(async (doctor) => {
      const { data: conflictCheck, error: conflictError } = await supabase
        .rpc('check_doctor_availability', {
          p_doctor_id: doctor.id,
          p_date: date,
          p_start_time: startTime,
          p_end_time: endTime,
          p_exclude_appointment_id: null
        })

      if (conflictError) {
        console.error(`Error checking availability for doctor ${doctor.id}:`, conflictError)
        return {
          ...doctor,
          available: false,
          conflicts: null,
          error: 'Failed to check availability',
        }
      }

      const conflicts = conflictCheck && conflictCheck.length > 0 ? conflictCheck[0] : null
      const hasConflict = conflicts ? conflicts.has_conflict : false

      return {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        role: doctor.role,
        department: doctor.department,
        phone: doctor.phone,
        employee_id: doctor.employee_id,
        available: !hasConflict,
        conflicts: hasConflict ? conflicts.conflicting_appointments : null,
      }
    })

    const doctorsWithAvailability = await Promise.all(availabilityPromises)

    // Separate available and busy doctors
    const availableDoctors = doctorsWithAvailability.filter(d => d.available)
    const busyDoctors = doctorsWithAvailability.filter(d => !d.available)

    return NextResponse.json({
      success: true,
      data: {
        available: availableDoctors,
        busy: busyDoctors,
        summary: {
          total: doctors.length,
          available: availableDoctors.length,
          busy: busyDoctors.length,
        },
      },
      query: {
        date,
        start_time: startTime,
        end_time: endTime,
        role: role || 'all',
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
