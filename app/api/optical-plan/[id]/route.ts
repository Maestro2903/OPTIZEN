import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleNotFoundError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/optical-plan/[id] - Get single optical item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('optical_plan', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { data: item, error } = await supabase
      .from('optical_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Optical item', id)
      }
      return handleDatabaseError(error, 'fetch', 'optical item')
    }

    if (!item) {
      return handleNotFoundError('Optical item', id)
    }

    return NextResponse.json({
      success: true,
      data: item
    })
  } catch (error) {
    return handleServerError(error, 'fetch', 'optical item')
  }
}

// PUT /api/optical-plan/[id] - Update optical item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('optical_plan', 'edit')
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
      item_type,
      name,
      brand,
      model,
      sku,
      category,
      sub_category,
      size,
      color,
      material,
      gender,
      purchase_price,
      selling_price,
      mrp,
      stock_quantity,
      reorder_level,
      supplier,
      image_url,
      warranty_months,
      hsn_code,
      gst_percentage,
      description
    } = body

    // Validate required fields if provided
    if (name !== undefined && !name) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }

    if (category !== undefined && !category) {
      return NextResponse.json({ error: 'Category cannot be empty' }, { status: 400 })
    }

    // Validate prices if provided
    if (purchase_price !== undefined) {
      const parsedPurchasePrice = Number(purchase_price)
      if (!Number.isFinite(parsedPurchasePrice) || parsedPurchasePrice < 0) {
        return NextResponse.json(
          { error: 'purchase_price must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    if (selling_price !== undefined) {
      const parsedSellingPrice = Number(selling_price)
      if (!Number.isFinite(parsedSellingPrice) || parsedSellingPrice < 0) {
        return NextResponse.json(
          { error: 'selling_price must be a non-negative number' },
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

    // Check SKU uniqueness if SKU is being updated
    if (sku !== undefined) {
      const { data: existingItem } = await supabase
        .from('optical_items')
        .select('id, sku')
        .eq('sku', sku)
        .neq('id', id)
        .single()

      if (existingItem) {
        return NextResponse.json(
          { error: 'SKU already exists. Please use a unique SKU.' },
          { status: 400 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (item_type !== undefined) updateData.item_type = item_type
    if (name !== undefined) updateData.name = name
    if (brand !== undefined) updateData.brand = brand
    if (model !== undefined) updateData.model = model
    if (sku !== undefined) updateData.sku = sku
    if (category !== undefined) updateData.category = category
    if (sub_category !== undefined) updateData.sub_category = sub_category
    if (size !== undefined) updateData.size = size
    if (color !== undefined) updateData.color = color
    if (material !== undefined) updateData.material = material
    if (gender !== undefined) updateData.gender = gender
    if (purchase_price !== undefined) updateData.purchase_price = purchase_price
    if (selling_price !== undefined) updateData.selling_price = selling_price
    if (mrp !== undefined) updateData.mrp = mrp
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity
    if (reorder_level !== undefined) updateData.reorder_level = reorder_level
    if (supplier !== undefined) updateData.supplier = supplier
    if (image_url !== undefined) updateData.image_url = image_url
    if (warranty_months !== undefined) updateData.warranty_months = warranty_months
    if (hsn_code !== undefined) updateData.hsn_code = hsn_code
    if (gst_percentage !== undefined) updateData.gst_percentage = gst_percentage
    if (description !== undefined) updateData.description = description

    // Update optical item
    const { data: item, error } = await supabase
      .from('optical_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFoundError('Optical item', id)
      }
      return handleDatabaseError(error, 'update', 'optical item')
    }

    if (!item) {
      return handleNotFoundError('Optical item', id)
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Optical item updated successfully'
    })
  } catch (error) {
    return handleServerError(error, 'update', 'optical item')
  }
}

// DELETE /api/optical-plan/[id] - Delete optical item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('optical_plan', 'delete')
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
      .from('optical_items')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingItem) {
      return handleNotFoundError('Optical item', id)
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('optical_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return handleDatabaseError(deleteError, 'delete', 'optical item')
    }

    return NextResponse.json({
      success: true,
      message: 'Optical item deleted successfully',
      data: { id }
    })
  } catch (error) {
    return handleServerError(error, 'delete', 'optical item')
  }
}

