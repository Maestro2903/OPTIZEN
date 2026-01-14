import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleNotFoundError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/finance-revenue/[id] - Get a specific revenue entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data: revenue, error } = await supabase
      .from('finance_revenue')
      .select('*, patients:patient_id(id, full_name, patient_id, mobile, email)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Revenue entry not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue entry' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: revenue
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/finance-revenue/[id] - Update a revenue entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    // Validate amount if provided
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount < 0) {
        return NextResponse.json(
          { error: 'Amount must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    // Get patient name if patient_id changed
    if (body.patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', body.patient_id)
        .single()
      
      if (patient) {
        body.patient_name = patient.full_name
      }
    }

    // Update paid_amount based on payment_status
    if (body.payment_status === 'received' && body.amount) {
      body.paid_amount = body.amount
    } else if (body.payment_status === 'pending') {
      body.paid_amount = 0
    }

    // Remove fields that shouldn't be updated
    const { id: _id, created_at, created_by, ...updateData } = body

    // Update revenue entry
    const { data: revenue, error } = await supabase
      .from('finance_revenue')
      .update(updateData)
      .eq('id', id)
      .select('*, patients:patient_id(id, full_name, patient_id)')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Revenue entry not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update revenue entry' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: revenue,
      message: 'Revenue entry updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/finance-revenue/[id] - Delete a revenue entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // RBAC check
  const authCheck = await requirePermission('revenue', 'delete')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = params

    // Verify revenue entry exists before deleting
    const { data: existingRevenue, error: fetchError } = await supabase
      .from('finance_revenue')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRevenue) {
      if (fetchError?.code === 'PGRST116') {
        return handleNotFoundError('Revenue entry', id)
      }
      return handleDatabaseError(fetchError || new Error('Revenue entry not found'), 'fetch', 'revenue entry')
    }

    // Delete revenue entry
    const { data: revenue, error } = await supabase
      .from('finance_revenue')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Revenue entry', id)
      }
      return handleDatabaseError(error, 'delete', 'revenue entry')
    }

    return NextResponse.json({
      success: true,
      data: revenue,
      message: 'Revenue entry deleted successfully'
    })

  } catch (error) {
    return handleServerError(error, 'delete', 'revenue entry')
  }
}
