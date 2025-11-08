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

    // Fetch invoice with patient information and items
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
        ),
        invoice_items (
          id,
          item_description,
          quantity,
          unit_price,
          total_price
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

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Remove fields that shouldn't be updated
    const {
      id: _id,
      created_at,
      created_by,
      patient_id, // Don't allow changing patient
      invoice_items, // Handle items separately
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
        return NextResponse.json({ error: 'Failed to fetch current invoice' }, { status: 500 })
      }

      if (!currentInvoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
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
        ),
        invoice_items (
          id,
          item_description,
          quantity,
          unit_price,
          total_price
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

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        ),
        invoice_items (
          id,
          item_description,
          quantity,
          unit_price,
          total_price
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