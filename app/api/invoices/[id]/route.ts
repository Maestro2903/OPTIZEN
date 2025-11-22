import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleDatabaseError, handleNotFoundError, handleServerError } from '@/lib/utils/api-errors'

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
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Invoice', id)
      }
      return handleDatabaseError(error, 'fetch', 'invoice')
    }

    return NextResponse.json({
      success: true,
      data: invoice
    })

  } catch (error) {
    return handleServerError(error, 'fetch', 'invoice')
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
      invoice_number, // Don't allow changing invoice number
      ...updateData
    } = body

    // Handle items if provided (stored as JSONB)
    if (body.items !== undefined) {
      updateData.items = body.items
    }

    // Recalculate balance if amounts changed
    if (updateData.total_amount !== undefined || updateData.amount_paid !== undefined || updateData.items !== undefined) {
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid, subtotal, discount_amount, tax_amount')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return handleNotFoundError('Invoice', id)
        }
        return handleDatabaseError(fetchError, 'fetch', 'current invoice')
      }

      // If items are being updated, recalculate totals from items
      if (updateData.items !== undefined && Array.isArray(updateData.items)) {
        const subtotal = updateData.items.reduce((sum: number, item: any) => {
          const qty = item.quantity || 0
          const rate = item.rate || 0
          return sum + (qty * rate)
        }, 0)

        const discountAmount = updateData.discount_amount !== undefined 
          ? updateData.discount_amount 
          : (currentInvoice.discount_amount || 0)
        const afterDiscount = subtotal - discountAmount
        const taxAmount = updateData.tax_amount !== undefined
          ? updateData.tax_amount
          : (currentInvoice.tax_amount || 0)
        const totalAmount = afterDiscount + taxAmount

        updateData.subtotal = subtotal
        updateData.discount_amount = discountAmount
        updateData.tax_amount = taxAmount
        updateData.total_amount = totalAmount
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
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Invoice', id)
      }
      return handleDatabaseError(error, 'update', 'invoice')
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully'
    })

  } catch (error) {
    return handleServerError(error, 'update', 'invoice')
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
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Invoice', id)
      }
      return handleDatabaseError(error, 'cancel', 'invoice')
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice cancelled successfully'
    })

  } catch (error) {
    return handleServerError(error, 'cancel', 'invoice')
  }
}