import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/expenses/[id] - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requirePermission('expenses', 'view')
    if (!authCheck.authorized) return authCheck.response

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
    }

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: expense
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requirePermission('expenses', 'edit')
    if (!authCheck.authorized) return authCheck.response

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    const body = await request.json()

    const {
      expense_date,
      category,
      sub_category,
      description,
      amount,
      payment_method,
      vendor,
      bill_number,
      notes,
      receipt_url
    } = body

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (expense_date !== undefined) updateData.expense_date = expense_date
    if (category !== undefined) {
      const allowedCategories = [
        'salary', 'utilities', 'supplies', 'maintenance',
        'rent', 'marketing', 'equipment', 'other'
      ]
      if (!allowedCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Allowed values: ${allowedCategories.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.category = category
    }
    if (sub_category !== undefined) updateData.sub_category = sub_category
    if (description !== undefined) updateData.description = description
    if (amount !== undefined) {
      const parsedAmount = Number(amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        return NextResponse.json(
          { error: 'amount must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.amount = parsedAmount
    }
    if (payment_method !== undefined) updateData.payment_method = payment_method
    if (vendor !== undefined) updateData.vendor = vendor
    if (bill_number !== undefined) updateData.bill_number = bill_number
    if (notes !== undefined) updateData.notes = notes
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url

    // Update expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
    }

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requirePermission('expenses', 'delete')
    if (!authCheck.authorized) return authCheck.response

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Check if expense exists
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('id, description')
      .eq('id', id)
      .single()

    if (fetchError || !existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Delete expense
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
      data: { id }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
