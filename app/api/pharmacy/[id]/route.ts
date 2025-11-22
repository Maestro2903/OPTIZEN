import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleNotFoundError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/pharmacy/[id] - Get single pharmacy item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('pharmacy', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { data: item, error } = await supabase
      .from('pharmacy_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Pharmacy item', id)
      }
      return handleDatabaseError(error, 'fetch', 'pharmacy item')
    }

    if (!item) {
      return handleNotFoundError('Pharmacy item', id)
    }

    return NextResponse.json({
      success: true,
      data: item
    })
  } catch (error) {
    return handleServerError(error, 'fetch', 'pharmacy item')
  }
}

// PUT /api/pharmacy/[id] - Update pharmacy item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('pharmacy', 'edit')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const body = await request.json()

    // Extract fields
    const {
      name,
      generic_name,
      manufacturer,
      category,
      supplier,
      unit_price,
      mrp,
      stock_quantity,
      reorder_level,
      batch_number,
      expiry_date,
      hsn_code,
      gst_percentage,
      prescription_required,
      dosage_form,
      strength,
      storage_instructions,
      description,
      image_url
    } = body

    // Validate required fields if provided
    if (name !== undefined && !name) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }

    if (category !== undefined && !category) {
      return NextResponse.json({ error: 'Category cannot be empty' }, { status: 400 })
    }

    // Validate prices if provided
    if (unit_price !== undefined) {
      const parsedUnitPrice = Number(unit_price)
      if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
        return NextResponse.json(
          { error: 'unit_price must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    if (mrp !== undefined) {
      const parsedMrp = Number(mrp)
      if (!Number.isFinite(parsedMrp) || parsedMrp < 0) {
        return NextResponse.json(
          { error: 'mrp must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    // Validate stock quantities if provided
    if (stock_quantity !== undefined) {
      const parsedStock = Number(stock_quantity)
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return NextResponse.json(
          { error: 'stock_quantity must be a non-negative integer' },
          { status: 400 }
        )
      }
    }

    if (reorder_level !== undefined) {
      const parsedReorder = Number(reorder_level)
      if (!Number.isInteger(parsedReorder) || parsedReorder < 0) {
        return NextResponse.json(
          { error: 'reorder_level must be a non-negative integer' },
          { status: 400 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (generic_name !== undefined) updateData.generic_name = generic_name
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer
    if (category !== undefined) updateData.category = category
    if (supplier !== undefined) updateData.supplier = supplier
    if (unit_price !== undefined) updateData.unit_price = unit_price
    if (mrp !== undefined) updateData.mrp = mrp
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity
    if (reorder_level !== undefined) updateData.reorder_level = reorder_level
    if (batch_number !== undefined) updateData.batch_number = batch_number
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date
    if (hsn_code !== undefined) updateData.hsn_code = hsn_code
    if (gst_percentage !== undefined) updateData.gst_percentage = gst_percentage
    if (prescription_required !== undefined) updateData.prescription_required = prescription_required
    if (dosage_form !== undefined) updateData.dosage_form = dosage_form
    if (strength !== undefined) updateData.strength = strength
    if (storage_instructions !== undefined) updateData.storage_instructions = storage_instructions
    if (description !== undefined) updateData.description = description
    if (image_url !== undefined) updateData.image_url = image_url

    // Update pharmacy item
    const { data: item, error } = await supabase
      .from('pharmacy_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Pharmacy item', id)
      }
      return handleDatabaseError(error, 'update', 'pharmacy item')
    }

    if (!item) {
      return handleNotFoundError('Pharmacy item', id)
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Pharmacy item updated successfully'
    })
  } catch (error) {
    return handleServerError(error, 'update', 'pharmacy item')
  }
}

// DELETE /api/pharmacy/[id] - Delete pharmacy item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('pharmacy', 'delete')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // First check if item exists
    const { data: existingItem, error: fetchError } = await supabase
      .from('pharmacy_items')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingItem) {
      return handleNotFoundError('Pharmacy item', id)
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('pharmacy_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return handleDatabaseError(deleteError, 'delete', 'pharmacy item')
    }

    return NextResponse.json({
      success: true,
      message: 'Pharmacy item deleted successfully',
      data: { id }
    })
  } catch (error) {
    return handleServerError(error, 'delete', 'pharmacy item')
  }
}
