import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleNotFoundError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/stock-movements/[id] - Get single stock movement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const pharmacyCheck = await requirePermission('pharmacy', 'view')
    const opticalCheck = await requirePermission('optical_plan', 'view')
    
    if (!pharmacyCheck.authorized && !opticalCheck.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Movement ID is required' }, { status: 400 })
    }

    const { data: movement, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Stock movement', id)
      }
      return handleDatabaseError(error, 'fetch', 'stock movement')
    }

    if (!movement) {
      return handleNotFoundError('Stock movement', id)
    }

    return NextResponse.json({
      success: true,
      data: movement
    })
  } catch (error) {
    return handleServerError(error, 'fetch', 'stock movement')
  }
}

// PUT /api/stock-movements/[id] - Update stock movement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const pharmacyCheck = await requirePermission('pharmacy', 'edit')
    const opticalCheck = await requirePermission('optical_plan', 'edit')
    
    if (!pharmacyCheck.authorized && !opticalCheck.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Movement ID is required' }, { status: 400 })
    }

    // Get existing movement
    const { data: existingMovement, error: fetchError } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingMovement) {
      return handleNotFoundError('Stock movement', id)
    }

    const body = await request.json()

    // For updates, we need to reverse the old movement and apply the new one
    // This is complex, so we'll delete and recreate (with proper validation)
    // Or we can update non-critical fields only

    // For now, allow updating only notes, reference_number, and other non-stock-affecting fields
    const updateData: any = {}

    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.reference_number !== undefined) updateData.reference_number = body.reference_number
    if (body.supplier !== undefined) updateData.supplier = body.supplier
    if (body.customer_name !== undefined) updateData.customer_name = body.customer_name

    // If quantity or movement_type changes, we need to reverse and recreate
    // For safety, we'll require deletion and recreation for stock-affecting changes
    if (body.quantity !== undefined || body.movement_type !== undefined || body.item_id !== undefined) {
      return NextResponse.json(
        { error: 'Cannot update quantity, movement_type, or item_id. Please delete and recreate the movement.' },
        { status: 400 }
      )
    }

    // Update the movement
    const { data: updatedMovement, error: updateError } = await supabase
      .from('stock_movements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return handleDatabaseError(updateError, 'update', 'stock movement')
    }

    return NextResponse.json({
      success: true,
      data: updatedMovement,
      message: 'Stock movement updated successfully'
    })
  } catch (error) {
    return handleServerError(error, 'update', 'stock movement')
  }
}

// DELETE /api/stock-movements/[id] - Delete stock movement (will reverse stock)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const pharmacyCheck = await requirePermission('pharmacy', 'delete')
    const opticalCheck = await requirePermission('optical_plan', 'delete')
    
    if (!pharmacyCheck.authorized && !opticalCheck.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Movement ID is required' }, { status: 400 })
    }

    // Get existing movement
    const { data: existingMovement, error: fetchError } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingMovement) {
      return handleNotFoundError('Stock movement', id)
    }

    // Delete the movement (trigger will reverse stock automatically)
    const { error: deleteError } = await supabase
      .from('stock_movements')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return handleDatabaseError(deleteError, 'delete', 'stock movement')
    }

    return NextResponse.json({
      success: true,
      message: 'Stock movement deleted and stock reversed successfully',
      data: { id }
    })
  } catch (error) {
    return handleServerError(error, 'delete', 'stock movement')
  }
}

