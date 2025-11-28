import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/stock-movements - List stock movements with filters
export async function GET(request: NextRequest) {
  try {
    // RBAC check - require pharmacy or optical_plan view permission
    const pharmacyCheck = await requirePermission('pharmacy', 'view')
    const opticalCheck = await requirePermission('optical_plan', 'view')
    
    if (!pharmacyCheck.authorized && !opticalCheck.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You need pharmacy or optical_plan view permission' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '50', 10)
    const item_type = searchParams.get('item_type') || ''
    const item_id = searchParams.get('item_id') || ''
    const movement_type = searchParams.get('movement_type') || ''
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''
    let sortBy = searchParams.get('sortBy') || 'movement_date'
    let sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100)

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Validate sortBy
    const allowedSortColumns = [
      'movement_date',
      'created_at',
      'movement_type',
      'item_name',
      'quantity',
      'total_value'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'movement_date'
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('stock_movements')
      .select('*', { count: 'exact' })

    // Apply filters
    if (item_type) {
      query = query.eq('item_type', item_type)
    }

    if (item_id) {
      query = query.eq('item_id', item_id)
    }

    if (movement_type) {
      query = query.eq('movement_type', movement_type)
    }

    if (date_from) {
      query = query.gte('movement_date', date_from)
    }

    if (date_to) {
      query = query.lte('movement_date', date_to)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: movements, error, count } = await query

    if (error) {
      return handleDatabaseError(error, 'fetch', 'stock movements')
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: movements,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    return handleServerError(error, 'fetch', 'stock movements')
  }
}

// POST /api/stock-movements - Create new stock movement
export async function POST(request: NextRequest) {
  try {
    // RBAC check - require pharmacy or optical_plan create permission
    const pharmacyCheck = await requirePermission('pharmacy', 'create')
    const opticalCheck = await requirePermission('optical_plan', 'create')
    
    if (!pharmacyCheck.authorized && !opticalCheck.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You need pharmacy or optical_plan create permission' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const {
      movement_date,
      movement_type,
      item_type,
      item_id,
      item_name,
      quantity,
      unit_price,
      total_value,
      batch_number,
      reference_number,
      supplier,
      customer_name,
      invoice_id,
      notes
    } = body

    if (!movement_date || !movement_type || !item_type || !item_id || !item_name || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: movement_date, movement_type, item_type, item_id, item_name, quantity' },
        { status: 400 }
      )
    }

    // Validate item_type
    if (!['pharmacy', 'optical'].includes(item_type)) {
      return NextResponse.json(
        { error: 'item_type must be either "pharmacy" or "optical"' },
        { status: 400 }
      )
    }

    // Validate movement_type
    if (!['purchase', 'sale', 'adjustment', 'return', 'expired', 'damaged'].includes(movement_type)) {
      return NextResponse.json(
        { error: 'Invalid movement_type' },
        { status: 400 }
      )
    }

    // Validate quantity
    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity === 0) {
      return NextResponse.json(
        { error: 'quantity must be a non-zero integer' },
        { status: 400 }
      )
    }

    // For sales, validate stock availability
    if (movement_type === 'sale') {
      if (parsedQuantity < 0) {
        return NextResponse.json(
          { error: 'Sale quantity cannot be negative' },
          { status: 400 }
        )
      }

      // Check stock availability using database function
      const { data: stockAvailable, error: stockError } = await supabase
        .rpc('validate_stock_availability', {
          p_item_type: item_type,
          p_item_id: item_id,
          p_quantity: parsedQuantity
        })

      if (stockError) {
        return handleDatabaseError(stockError, 'validate', 'stock availability')
      }

      if (!stockAvailable) {
        // Get current stock for error message
        const tableName = item_type === 'pharmacy' ? 'pharmacy_items' : 'optical_items'
        const { data: item } = await supabase
          .from(tableName)
          .select('stock_quantity, name')
          .eq('id', item_id)
          .single()

        return NextResponse.json(
          { 
            error: `Insufficient stock. Available: ${item?.stock_quantity || 0}, Requested: ${parsedQuantity}`,
            available_stock: item?.stock_quantity || 0
          },
          { status: 400 }
        )
      }
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    const user_id = user?.id || null

    // Get current stock for previous_stock (will be updated by trigger)
    const tableName = item_type === 'pharmacy' ? 'pharmacy_items' : 'optical_items'
    const { data: currentItem } = await supabase
      .from(tableName)
      .select('stock_quantity')
      .eq('id', item_id)
      .single()

    const previous_stock = currentItem?.stock_quantity || 0

    // Calculate total_value if not provided
    let calculatedTotalValue = total_value
    if (!calculatedTotalValue && unit_price) {
      calculatedTotalValue = Math.abs(parsedQuantity) * Number(unit_price)
    }

    // Insert stock movement (trigger will update stock automatically)
    const { data: movement, error: insertError } = await supabase
      .from('stock_movements')
      .insert([
        {
          movement_date,
          movement_type,
          item_type,
          item_id,
          item_name,
          quantity: parsedQuantity,
          unit_price: unit_price ? Number(unit_price) : null,
          total_value: calculatedTotalValue ? Number(calculatedTotalValue) : null,
          batch_number,
          reference_number,
          supplier,
          customer_name,
          invoice_id,
          user_id,
          notes,
          previous_stock
        }
      ])
      .select()
      .single()

    if (insertError) {
      return handleDatabaseError(insertError, 'create', 'stock movement')
    }

    // Get updated stock (trigger should have updated it)
    const { data: updatedItem } = await supabase
      .from(tableName)
      .select('stock_quantity')
      .eq('id', item_id)
      .single()

    // Update movement with new_stock if trigger didn't set it
    if (movement && updatedItem && !movement.new_stock) {
      await supabase
        .from('stock_movements')
        .update({ new_stock: updatedItem.stock_quantity })
        .eq('id', movement.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...movement,
        new_stock: updatedItem?.stock_quantity || movement.new_stock
      },
      message: 'Stock movement created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleServerError(error, 'create', 'stock movement')
  }
}

