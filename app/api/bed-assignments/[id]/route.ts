import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('beds', 'edit')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { id } = await params

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bed assignment ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'discharge') {
      // Find the active assignment by ID
      const { data: assignment, error: assignmentError } = await supabase
        .from('bed_assignments')
        .select(`
          *,
          beds!bed_assignments_bed_id_fkey (
            id,
            bed_number,
            ward_name
          )
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (assignmentError || !assignment) {
        if (assignmentError?.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Active bed assignment not found' },
            { status: 404 }
          )
        }
        console.error('Error finding assignment:', assignmentError)
        return NextResponse.json(
          { success: false, error: 'Failed to find bed assignment', details: assignmentError?.message },
          { status: 500 }
        )
      }

      // Update the assignment to discharged status
      const actualDischargeDate = new Date().toISOString()
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('bed_assignments')
        .update({
          status: 'discharged',
          actual_discharge_date: actualDischargeDate,
          updated_at: actualDischargeDate,
        })
        .eq('id', id)
        .select(`
          *,
          beds!bed_assignments_bed_id_fkey (
            id,
            bed_number,
            ward_name
          ),
          patients!bed_assignments_patient_id_fkey (
            id,
            patient_id,
            full_name
          )
        `)
        .single()

      if (updateError) {
        console.error('Error updating assignment:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to discharge bed assignment', details: updateError.message },
          { status: 500 }
        )
      }

      // Update master_data bed status to available
      // First, find the master_data bed by bed_number
      const bedNumber = assignment.beds?.bed_number
      if (bedNumber) {
        const { data: masterBed } = await supabase
          .from('master_data')
          .select('*')
          .eq('category', 'beds')
          .or(`bed_number.eq.${bedNumber},name.eq.${bedNumber}`)
          .single()

        if (masterBed) {
          const metadata = masterBed.metadata || {}
          const updatedMetadata = {
            ...metadata,
            status: 'available'
          }

          await supabase
            .from('master_data')
            .update({
              metadata: updatedMetadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', masterBed.id)
        }
      }

      return NextResponse.json({
        success: true,
        data: updatedAssignment,
        message: 'Bed assignment discharged successfully'
      })
    }

    // Handle other update actions if needed in the future
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Unexpected error in bed assignment PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

