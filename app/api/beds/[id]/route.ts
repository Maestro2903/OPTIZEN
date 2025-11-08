import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const { id } = await params
    const body = await request.json()

    const { data: bed, error } = await supabase
      .from('beds')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      `)
      .single()

    if (error) {
      console.error('Bed update error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    // Transform data to match frontend format
    const transformedBed = {
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
    }

    return NextResponse.json({
      success: true,
      data: transformedBed,
      message: 'Bed updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in bed PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if bed has active assignments
    const { data: assignments, error: checkError } = await supabase
      .from('bed_assignments')
      .select('id')
      .eq('bed_id', id)
      .is('discharge_date', null)

    if (checkError) {
      console.error('Bed assignment check error:', checkError)
      return NextResponse.json(
        { success: false, error: checkError.message },
        { status: 500 }
      )
    }

    if (assignments && assignments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete bed with active assignments' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('beds')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Bed deletion error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bed deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in bed DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}