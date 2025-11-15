import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('discharges', 'view')
  if (!authCheck.authorized) return authCheck.response

  try {
    const supabase = createClient()
    const { id } = await params

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid discharge ID format' },
        { status: 400 }
      )
    }

    const { data: fullDischarge, error } = await supabase
      .from('discharges')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        cases:case_id (
          id,
          case_no,
          diagnosis
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Discharge fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve discharge' },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: fullDischarge
    })

  } catch (error) {
    console.error('Unexpected error in discharge GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('discharges', 'edit')
  if (!authCheck.authorized) return authCheck.response

  try {
    const supabase = createClient()
    const { id } = await params

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid discharge ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate and restrict updatable fields
    const allowedFields = [
      'discharge_type', 'discharge_summary', 'final_diagnosis',
      'treatment_given', 'condition_on_discharge', 'instructions',
      'follow_up_date', 'medications', 'vitals_at_discharge',
      'status', 'discharge_date'
    ]

    const updateData: any = { updated_at: new Date().toISOString() }
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    const { data: discharge, error } = await supabase
      .from('discharges')
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
        ),
        cases:case_id (
          id,
          case_no,
          diagnosis
        )
      `)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Discharge update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update discharge' },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: discharge,
      message: 'Discharge record updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in discharge PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('discharges', 'delete')
  if (!authCheck.authorized) return authCheck.response

  try {
    const supabase = createClient()
    const { id } = await params

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid discharge ID format' },
        { status: 400 }
      )
    }

    // Check if discharge exists before soft delete
    const { data: existingDischarge, error: fetchError } = await supabase
      .from('discharges')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingDischarge) {
      return NextResponse.json(
        { error: 'Discharge not found' },
        { status: 404 }
      )
    }

    // Soft delete - update deleted_at instead of hard delete
    const { error } = await supabase
      .from('discharges')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Discharge soft deletion error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete discharge' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Discharge record deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in discharge DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}