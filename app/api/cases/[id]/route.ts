import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/cases/[id] - Get a specific case by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch case with patient information
    const { data: encounter, error } = await supabase
      .from('encounters')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender,
          date_of_birth,
          address,
          city,
          state
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
    }

    if (!encounter) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Authorization check - users can only view their own cases
    // TODO: Add proper authorization based on case ownership or user role/permissions
    // For now, any authenticated user can view cases

    return NextResponse.json({
      success: true,
      data: encounter
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/cases/[id] - Update a case
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization check - fetch case first (only fields needed for authorization)
    const { data: existingCase, error: fetchError } = await supabase
      .from('encounters')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Error fetching case:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
    }

    // Check authorization - user must own the case or have appropriate role
    // TODO: Also check for admin role or assigned doctor role
    if (existingCase.created_by !== session.user.id) {
      return NextResponse.json({ 
        error: 'Forbidden: You do not have permission to update this case' 
      }, { status: 403 })
    }
    // For now, any authenticated user can update cases

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Explicitly validate and extract only allowed fields (no mass assignment)
    const allowedFields = [
      'encounter_date',
      'visit_type',
      'chief_complaint',
      'history_of_present_illness',
      'past_medical_history',
      'examination_findings',
      'diagnosis',
      'treatment_plan',
      'medications_prescribed',
      'follow_up_instructions',
      'status'
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Validate status if provided
    if (updateData.status) {
      const allowedStatuses = ['active', 'completed', 'cancelled']
      if (!allowedStatuses.includes(updateData.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update case
    const { data: encounter, error } = await supabase
      .from('encounters')
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
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: encounter,
      message: 'Case updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/cases/[id] - Delete a case (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id} = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization check - fetch case first
    const { data: existingCase, error: fetchError } = await supabase
      .from('encounters')
      .select('id, created_by, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Error fetching case:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
    }

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // TODO: Check authorization - user must own the case or have appropriate role
    // For now, any authenticated user can delete cases

    // Soft delete by updating status to cancelled
    const { data: encounter, error } = await supabase
      .from('encounters')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
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
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: encounter,
      message: 'Case deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}