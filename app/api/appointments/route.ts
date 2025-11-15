import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/appointments - List appointments with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'view')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
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
      'start_time',
      'type',
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

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with joins to get patient and provider information
    // Note: PostgREST uses table!foreign_key_column syntax for joins
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        users!appointments_provider_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `, { count: 'exact' })

    // Apply search filter - only on flat columns to avoid PostgREST nested path issues
    // Sanitize search input to prevent wildcard injection
    if (search) {
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&').replace(/,/g, '')
      query = query.ilike('type', `%${sanitizedSearch}%`)
      // Note: Patient/doctor search moved to client-side filtering due to PostgREST limitations
      // For production, consider creating a DB view or RPC that denormalizes fields
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
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const body = await request.json()

    // Explicitly validate and extract only allowed fields (no mass assignment)
    const {
      patient_id,
      appointment_date,
      start_time,
      end_time,
      type,
      provider_id,
      room,
      notes
    } = body

    if (!patient_id || !provider_id || !appointment_date || !start_time || !end_time || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, provider_id, appointment_date, start_time, end_time, type' },
        { status: 400 }
      )
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
    if (!timeRegex.test(start_time)) {
      return NextResponse.json({ 
        error: 'Invalid start_time format. Expected HH:MM (24-hour format, e.g., "09:30" or "14:00")' 
      }, { status: 400 })
    }
    if (!timeRegex.test(end_time)) {
      return NextResponse.json({ 
        error: 'Invalid end_time format. Expected HH:MM (24-hour format, e.g., "09:30" or "14:00")' 
      }, { status: 400 })
    }

    // Check for appointment conflicts (basic overlap detection)
    // TODO: Implement database-level exclusion constraint for true concurrent safety
    if (provider_id) {
      const { data: conflictingAppointments, error: conflictError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('provider_id', provider_id)
        .eq('appointment_date', appointment_date)
        .neq('status', 'cancelled')

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError)
        return NextResponse.json({ error: 'Failed to check appointment conflicts' }, { status: 500 })
      }

      // Check for time overlaps
      if (conflictingAppointments && conflictingAppointments.length > 0) {
        for (const existing of conflictingAppointments) {
          // Convert times to minutes for comparison
          const [newStartH, newStartM] = start_time.split(':').map(Number)
          const [newEndH, newEndM] = end_time.split(':').map(Number)
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

    // Get current user session for created_by
    const { data: { session } } = await supabase.auth.getSession()

    // Insert new appointment - explicitly set allowed fields only
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id,
          provider_id,
          appointment_date,
          start_time,
          end_time,
          type,
          status: 'scheduled',
          room,
          notes,
          updated_by: session?.user?.id
        }
      ])
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        users!appointments_provider_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Database error creating appointment:', error)
      return NextResponse.json({ 
        error: 'Failed to create appointment', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}