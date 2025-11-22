import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'
import * as z from 'zod'

// Validation schema for bed assignments
const bedAssignmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  bed_id: z.string().uuid('Invalid bed ID'),
  admission_date: z.string().min(1, 'Admission date is required'),
  expected_discharge_date: z.string().optional(),
  surgery_scheduled_time: z.string().optional(),
  surgery_type: z.string().optional(),
  admission_reason: z.string().min(1, 'Admission reason is required'),
  assigned_doctor_id: z.string().uuid().optional().nullable(),
  assigned_nurse_id: z.string().uuid().optional().nullable(), // Not stored in DB but allowed in request
  notes: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('beds', 'create')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createClient()
    
    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Failed to parse request body'
        },
        { status: 400 }
      )
    }

    // Validate request body
    const validationResult = bedAssignmentSchema.safeParse(body)
    if (!validationResult.success) {
      const errorDetails = validationResult.error?.issues 
        ? validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'Invalid request data'
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: errorDetails
        },
        { status: 400 }
      )
    }

    const {
      patient_id,
      bed_id, // This is the master_data ID
      admission_date,
      expected_discharge_date,
      surgery_scheduled_time,
      surgery_type,
      admission_reason,
      assigned_doctor_id,
      notes,
    } = validationResult.data

    // Step 1: Get the bed from master_data
    const { data: masterBed, error: masterBedError } = await supabase
      .from('master_data')
      .select('*')
      .eq('id', bed_id)
      .eq('category', 'beds')
      .single()

    if (masterBedError || !masterBed) {
      console.error('Master bed fetch error:', masterBedError)
      return NextResponse.json(
        { success: false, error: 'Bed not found in master data' },
        { status: 404 }
      )
    }

    // Extract bed information from master_data
    const metadata = masterBed.metadata || {}
    const bed_number = masterBed.bed_number || masterBed.name
    const ward_name = masterBed.name
    const ward_type = metadata.ward_type || 'general'
    const floor_number = metadata.floor_number || 1
    const room_number = metadata.room_number || null
    const daily_rate = metadata.daily_rate || 0
    const bed_type = metadata.bed_type || 'Standard'
    const facilities = metadata.facilities || []
    const description = masterBed.description || null

    // Step 2: Find or create the bed in the beds table
    // First, try to find by bed_number (unique constraint)
    let { data: existingBed, error: findError } = await supabase
      .from('beds')
      .select('id')
      .eq('bed_number', bed_number)
      .single()

    let bedsTableId: string

    if (findError && findError.code === 'PGRST116') {
      // Bed doesn't exist in beds table, create it
      const { data: newBed, error: createError } = await supabase
        .from('beds')
        .insert([
          {
            bed_number,
            ward_name,
            ward_type: ward_type as 'general' | 'icu' | 'private' | 'semi_private' | 'emergency',
            bed_type,
            floor_number: parseInt(floor_number.toString()),
            room_number,
            status: 'available',
            daily_rate: parseFloat(daily_rate.toString()),
            description,
            facilities: Array.isArray(facilities) ? facilities : [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select('id')
        .single()

      if (createError || !newBed) {
        console.error('Bed creation error:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create bed in beds table', details: createError?.message },
          { status: 500 }
        )
      }

      bedsTableId = newBed.id
    } else if (findError) {
      console.error('Error finding bed:', findError)
      return NextResponse.json(
        { success: false, error: 'Failed to find bed', details: findError.message },
        { status: 500 }
      )
    } else {
      // Bed exists, use its ID
      bedsTableId = existingBed!.id
    }

    // Step 3: Check if bed is already occupied
    const { data: activeAssignment, error: checkError } = await supabase
      .from('bed_assignments')
      .select('id')
      .eq('bed_id', bedsTableId)
      .eq('status', 'active')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "not found" - something went wrong
      console.error('Error checking active assignment:', checkError)
      return NextResponse.json(
        { success: false, error: 'Failed to check bed availability', details: checkError.message },
        { status: 500 }
      )
    }

    if (activeAssignment) {
      return NextResponse.json(
        { success: false, error: 'Bed is already occupied by another patient' },
        { status: 409 }
      )
    }

    // Step 4: Format dates properly
    // admission_date should be a timestamp (ISO string)
    let formattedAdmissionDate: string
    try {
      // If it's just a date (YYYY-MM-DD), convert to timestamp
      if (admission_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedAdmissionDate = new Date(admission_date + 'T00:00:00Z').toISOString()
      } else {
        formattedAdmissionDate = new Date(admission_date).toISOString()
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid admission date format' },
        { status: 400 }
      )
    }

    // expected_discharge_date should be a DATE (not timestamp)
    let formattedExpectedDischargeDate: string | null = null
    if (expected_discharge_date) {
      try {
        // Ensure it's just a date (YYYY-MM-DD)
        if (expected_discharge_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedExpectedDischargeDate = expected_discharge_date
        } else {
          // Extract date part if it's a datetime
          formattedExpectedDischargeDate = new Date(expected_discharge_date).toISOString().split('T')[0]
        }
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid expected discharge date format' },
          { status: 400 }
        )
      }
    }

    // surgery_scheduled_time should be a timestamp (ISO string) or null
    let formattedSurgeryTime: string | null = null
    if (surgery_scheduled_time) {
      try {
        formattedSurgeryTime = new Date(surgery_scheduled_time).toISOString()
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid surgery scheduled time format' },
          { status: 400 }
        )
      }
    }

    // Step 5: Create the bed assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('bed_assignments')
      .insert([
        {
          bed_id: bedsTableId,
          patient_id,
          admission_date: formattedAdmissionDate,
          expected_discharge_date: formattedExpectedDischargeDate,
          surgery_scheduled_time: formattedSurgeryTime,
          surgery_type: surgery_type || null,
          admission_reason,
          assigned_doctor_id: assigned_doctor_id || null,
          notes: notes || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select(`
        *,
        patients!bed_assignments_patient_id_fkey (
          id,
          patient_id,
          full_name,
          gender,
          date_of_birth
        )
      `)
      .single()

    if (assignmentError) {
      console.error('Bed assignment creation error:', assignmentError)
      
      // Handle constraint violations
      if (assignmentError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Bed is already assigned to another patient' },
          { status: 409 }
        )
      }
      
      if (assignmentError.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'Invalid patient or bed reference' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create bed assignment', details: assignmentError.message },
        { status: 500 }
      )
    }

    // Step 6: Update master_data bed status to occupied
    const updatedMetadata = {
      ...metadata,
      status: 'occupied'
    }

    await supabase
      .from('master_data')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', bed_id)

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Bed assigned to patient successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in bed assignment POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

