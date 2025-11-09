import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/appointments - List appointments with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    let page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'appointment_date'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status') || ''
    const date = searchParams.get('date') || ''
    const patient_id = searchParams.get('patient_id') || ''

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100) // Cap at 100

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Validate sortBy against allowlist
    const allowedSortColumns = [
      'appointment_date',
      'appointment_time',
      'appointment_type',
      'status',
      'created_at'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'appointment_date'
    }

    // Parse and validate status parameter (supports arrays)
    const allowedStatuses = ['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show']
    const statusValues = status ? validateArrayParam(
      parseArrayParam(status),
      allowedStatuses,
      false
    ) : []

    // Validate date format if provided
    if (date && isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)' }, { status: 400 })
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with joins to get patient information
    let query = supabase
      .from('appointments')
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
      `, { count: 'exact' })

    // Apply search filter - only on flat columns to avoid PostgREST nested path issues
    // Sanitize search input to prevent wildcard injection
    if (search) {
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&').replace(/,/g, '')
      query = query.ilike('appointment_type', `%${sanitizedSearch}%`)
      // Note: Patient search moved to client-side filtering due to PostgREST limitations
      // For production, consider creating a DB view or RPC that denormalizes patient fields
    }

    // Apply status filter (supports multiple values)
    if (statusValues.length > 0) {
      query = applyArrayFilter(query, 'status', statusValues)
    }

    // Apply date filter with proper start/end boundaries
    if (date) {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      // Use ISO midnight for start and next day's midnight for exclusive upper bound
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0)).toISOString().split('T')[0]
      const nextDay = new Date(dateObj)
      nextDay.setDate(nextDay.getDate() + 1)
      const startOfNextDay = new Date(nextDay.setHours(0, 0, 0, 0)).toISOString().split('T')[0]
      
      query = query.gte('appointment_date', startOfDay)
        .lt('appointment_date', startOfNextDay)
    }

    // Apply patient filter
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'create')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const body = await request.json()

    // Explicitly validate and extract only allowed fields (no mass assignment)
    const {
      patient_id,
      appointment_date,
      appointment_time,
      appointment_type,
      doctor_id,
      reason,
      duration_minutes,
      notes
    } = body

    if (!patient_id || !appointment_date || !appointment_time || !appointment_type) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, appointment_date, appointment_time, appointment_type' },
        { status: 400 }
      )
    }

    // Set defaults for optional fields
    const finalDuration = duration_minutes || 30
    const finalStatus = 'scheduled'

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Validate appointment_time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (!timeRegex.test(appointment_time)) {
      return NextResponse.json({ 
        error: 'Invalid appointment_time format. Expected HH:MM (24-hour format, e.g., "09:30" or "14:00")' 
      }, { status: 400 })
    }

    // Check for appointment conflicts with interval overlap logic
    // Calculate time range for new appointment
    const appointmentDuration = duration_minutes || 30
    const newStartTime = appointment_time
    
    // Parse time and calculate end time with validation
    const [hoursStr, minutesStr] = newStartTime.split(':')
    const hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    
    // Validate parsed values (additional safety check)
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return NextResponse.json({ 
        error: 'Invalid time values. Hours must be 0-23 and minutes must be 0-59' 
      }, { status: 400 })
    }

    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + appointmentDuration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60

    // Check if appointment would cross midnight (end time >= 24:00)
    if (endHours >= 24) {
      return NextResponse.json({ 
        error: `Appointment would extend past midnight (end time would be ${endHours}:${String(endMins).padStart(2, '0')}). Please schedule appointments within a single day or split across multiple days.`,
        startTime: appointment_time,
        duration: appointmentDuration,
        calculatedEndTime: `${endHours}:${String(endMins).padStart(2, '0')}`
      }, { status: 400 })
    }

    const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`

    // CRITICAL: This application-level check has TOCTOU vulnerability
    // Concurrent requests can still create conflicting appointments
    // TODO: Implement database-level exclusion constraint (see CRITICAL_PRODUCTION_BLOCKERS.md #1)
    // Required before production: ALTER TABLE appointments ADD CONSTRAINT no_overlapping_appointments ...
    
    if (doctor_id) {
      const { data: conflictingAppointments, error: conflictError } = await supabase
        .from('appointments')
        .select('id, appointment_time, duration_minutes')
        .eq('doctor_id', doctor_id)
        .eq('appointment_date', appointment_date)
        .neq('status', 'cancelled')

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError)
        return NextResponse.json({ error: 'Failed to check appointment conflicts' }, { status: 500 })
      }

      // Check for interval overlaps: (newStart < existingEnd && newEnd > existingStart)
      if (conflictingAppointments && conflictingAppointments.length > 0) {
        for (const existing of conflictingAppointments) {
          const existingDuration = existing.duration_minutes || 30
          const [exHours, exMinutes] = existing.appointment_time.split(':').map(Number)
          const existingStartMinutes = exHours * 60 + exMinutes
          const existingEndMinutes = existingStartMinutes + existingDuration

          // Overlap detection: new appointment overlaps if it starts before existing ends AND ends after existing starts
          if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
            return NextResponse.json({
              error: `Doctor has a conflicting appointment from ${existing.appointment_time} (conflicts with requested ${newStartTime}-${newEndTime})`,
              conflict: true,
              existingAppointment: {
                time: existing.appointment_time,
                duration: existingDuration
              }
            }, { status: 409 })
          }
        }
      }
    }

    // Insert new appointment - explicitly set allowed fields only
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id,
          appointment_date,
          appointment_time,
          appointment_type,
          doctor_id,
          reason,
          duration_minutes: finalDuration,
          status: finalStatus,
          notes,
          created_by: session.user.id
        }
      ])
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
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}