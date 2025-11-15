import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'
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

export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('beds', 'view')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

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

    // Build query for beds with ACTIVE assignments only
    // Using filters on the relationship to only get active assignments
    let query = supabase
      .from('beds')
      .select(`
        *,
        bed_assignments!bed_assignments_bed_id_fkey (
          id,
          patient_id,
          admission_date,
          expected_discharge_date,
          admission_reason,
          surgery_scheduled_time,
          surgery_type,
          assigned_doctor_id,
          status,
          patients!bed_assignments_patient_id_fkey (
            id,
            patient_id,
            full_name,
            gender,
            date_of_birth
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

    // Get doctor names for assignments
    const assignmentIds = beds?.filter(b => b.bed_assignments && b.bed_assignments.length > 0)
      .map(b => b.bed_assignments[0].assigned_doctor_id)
      .filter(id => id) || []

    let doctorsMap: Record<string, string> = {}
    if (assignmentIds.length > 0) {
      const { data: doctors } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', assignmentIds)
      
      if (doctors) {
        doctorsMap = doctors.reduce((acc, doc) => ({
          ...acc,
          [doc.id]: doc.full_name
        }), {})
      }
    }

    // Transform data to match frontend format
    // Filter to only show ACTIVE assignments (not discharged or transferred)
    const transformedBeds = beds?.map(bed => {
      // Find the active assignment for this bed
      const activeAssignment = bed.bed_assignments && bed.bed_assignments.length > 0 
        ? bed.bed_assignments.find((a: any) => a.status === 'active') || null
        : null

      return {
        bed,
        assignment: activeAssignment ? {
          ...activeAssignment,
          patient_name: activeAssignment.patients?.full_name,
          patient_age: activeAssignment.patients?.date_of_birth
            ? new Date().getFullYear() - new Date(activeAssignment.patients.date_of_birth).getFullYear()
            : null,
          patient_mrn: activeAssignment.patients?.patient_id,
          doctor_name: activeAssignment.assigned_doctor_id ? doctorsMap[activeAssignment.assigned_doctor_id] : null,
          days_in_ward: Math.floor(
            (new Date().getTime() - new Date(activeAssignment.admission_date).getTime())
            / (1000 * 60 * 60 * 24)
          )
        } : null
      }
    })

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
    // RBAC check
    const authCheck = await requirePermission('beds', 'create')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

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