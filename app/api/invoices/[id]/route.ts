import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/invoices/[id] - Get a specific invoice by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization - verify user has access to this invoice
    const { data: invoiceAuth, error: fetchError } = await supabase
      .from('invoices')
      .select('id, created_by, patient_id')
      .eq('id', id)
      .single()

    if (fetchError || !invoiceAuth) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Verify user owns this invoice or has appropriate role
    const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role
    const isAdmin = userRole === 'admin'
    const isManager = userRole === 'manager'
    const ownsInvoice = invoiceAuth.created_by === session.user.id

    if (!ownsInvoice && !isAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch invoice with patient information (items stored in JSONB column)
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender,
          address,
          city,
          state,
          postal_code
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: invoice
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check authentication (skip in development mode)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization - verify user has access to this invoice (skip in dev mode)
    if (session) {
      const { data: invoiceAuth, error: fetchError } = await supabase
        .from('invoices')
        .select('id, created_by, patient_id')
        .eq('id', id)
        .single()

      if (fetchError || !invoiceAuth) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      // Verify user owns this invoice or has appropriate role
      const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role
      const isAdmin = userRole === 'admin'
      const isManager = userRole === 'manager'
      const ownsInvoice = invoiceAuth.created_by === session.user.id

      if (!ownsInvoice && !isAdmin && !isManager) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (body.total_amount !== undefined) {
      if (typeof body.total_amount !== 'number' || body.total_amount < 0 || !Number.isFinite(body.total_amount)) {
        return NextResponse.json(
          { error: 'total_amount must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    if (body.amount_paid !== undefined) {
      if (typeof body.amount_paid !== 'number' || body.amount_paid < 0 || !Number.isFinite(body.amount_paid)) {
        return NextResponse.json(
          { error: 'amount_paid must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    // Validate status if present
    if (body.status !== undefined) {
      const allowedStatuses = ['draft', 'sent', 'paid', 'cancelled', 'overdue']
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `status must be one of: ${allowedStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Remove fields that shouldn't be updated
    const {
      id: _id,
      created_at,
      created_by,
      patient_id, // Don't allow changing patient
      ...updateData
    } = body

    // Recalculate balance if amounts changed
    if (updateData.total_amount !== undefined || updateData.amount_paid !== undefined) {
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Database error:', fetchError)
        if (fetchError.code === 'PGRST116') { // Not found
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch current invoice' }, { status: 500 })
      }

      // Use nullish coalescing to preserve zero values
      const total = updateData.total_amount ?? currentInvoice.total_amount ?? 0
      const paid = updateData.amount_paid ?? currentInvoice.amount_paid ?? 0

      updateData.balance_due = total - paid

      // Update payment status
      if (paid >= total) {
        updateData.payment_status = 'paid'
      } else if (paid > 0) {
        updateData.payment_status = 'partial'
      } else {
        updateData.payment_status = 'unpaid'
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
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
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Cancel an invoice (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check authentication (skip in development mode)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization - verify user has access to this invoice (skip in dev mode)
    if (session) {
      const { data: invoiceAuth, error: fetchError } = await supabase
        .from('invoices')
        .select('id, created_by, patient_id')
        .eq('id', id)
        .single()

      if (fetchError || !invoiceAuth) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      // Verify user owns this invoice or has appropriate role
      const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role
      const isAdmin = userRole === 'admin'
      const isManager = userRole === 'manager'
      const ownsInvoice = invoiceAuth.created_by === session.user.id

      if (!ownsInvoice && !isAdmin && !isManager) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Update status to cancelled instead of hard delete
    const { data: invoice, error } = await supabase
      .from('invoices')
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
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to cancel invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice cancelled successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}