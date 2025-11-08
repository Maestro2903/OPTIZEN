import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as z from 'zod'

// Validation schema for beds
const bedSchema = z.object({
  bed_number: z.string().min(1, 'Bed number is required'),
  ward_name: z.string().min(1, 'Ward name is required'),
  ward_type: z.enum(['general', 'icu', 'private', 'semi_private']),
  floor_number: z.number().int().positive('Floor number must be positive'),
  room_number: z.string().optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']).default('available'),
  daily_rate: z.number().positive('Daily rate must be positive'),
  description: z.string().optional(),
})

async function authenticate(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

async function authorize(user: any, action: string) {
  // Check if user has appropriate permissions for bed management
  const allowedRoles = ['admin', 'nurse', 'receptionist']
  return true // Placeholder - implement proper role checking
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check
    const authorized = await authorize(user, 'read_beds')
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters with safe parsing
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)

    const page = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam)
    const limit = Number.isNaN(limitParam) ? 50 : Math.min(100, Math.max(1, limitParam))
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'bed_number'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const ward_type = searchParams.get('ward_type')
    const status = searchParams.get('status')
    const floor_number = searchParams.get('floor_number')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query for beds with assignments
    let query = supabase
      .from('beds')
      .select(`
        *,
        bed_assignments (
          id,
          patient_id,
          admission_date,
          expected_discharge_date,
          admission_reason,
          doctor_id,
          patients:patient_id (
            id,
            patient_id,
            full_name,
            gender,
            date_of_birth
          ),
          doctors:doctor_id (
            id,
            employee_id,
            full_name
          )
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`bed_number.ilike.%${search}%, ward_name.ilike.%${search}%, room_number.ilike.%${search}%`)
    }

    if (ward_type) {
      query = query.eq('ward_type', ward_type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (floor_number) {
      query = query.eq('floor_number', parseInt(floor_number))
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: beds, error, count } = await query

    if (error) {
      console.error('Beds fetch error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend format
    const transformedBeds = beds?.map(bed => ({
      bed,
      assignment: bed.bed_assignments && bed.bed_assignments.length > 0 ? {
        ...bed.bed_assignments[0],
        patient_name: bed.bed_assignments[0].patients?.full_name,
        patient_age: bed.bed_assignments[0].patients?.date_of_birth
          ? new Date().getFullYear() - new Date(bed.bed_assignments[0].patients.date_of_birth).getFullYear()
          : null,
        patient_mrn: bed.bed_assignments[0].patients?.patient_id,
        doctor_name: bed.bed_assignments[0].doctors?.full_name,
        days_in_ward: Math.floor(
          (new Date().getTime() - new Date(bed.bed_assignments[0].admission_date).getTime())
          / (1000 * 60 * 60 * 24)
        )
      } : null
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: transformedBeds || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Unexpected error in beds GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data: bed, error } = await supabase
      .from('beds')
      .insert([
        {
          bed_number: body.bed_number,
          ward_name: body.ward_name,
          ward_type: body.ward_type,
          floor_number: body.floor_number,
          room_number: body.room_number,
          status: body.status || 'available',
          daily_rate: body.daily_rate,
          description: body.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Bed creation error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { bed, assignment: null },
      message: 'Bed created successfully'
    })

  } catch (error) {
    console.error('Unexpected error in beds POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}