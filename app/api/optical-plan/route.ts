import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/optical-plan - List optical items with stock information
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('optical_plan', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'created_at'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const category = searchParams.get('category') || ''
    const item_type = searchParams.get('item_type') || ''
    const low_stock = searchParams.get('low_stock') === 'true'

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100) // Cap at 100

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Validate sortBy against allowlist (using database column names)
    const allowedSortColumns = [
      'created_at',
      'name',
      'category',
      'item_type',
      'purchase_price',
      'selling_price',
      'mrp',
      'stock_quantity',
      'reorder_level'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'created_at'
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('optical_items')
      .select('*', { count: 'exact' })

    // Apply search filter with sanitized input
    if (search) {
      // Escape special wildcard characters: backslash first, then % and _
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.or(`name.ilike.%${sanitizedSearch}%,brand.ilike.%${sanitizedSearch}%,model.ilike.%${sanitizedSearch}%,sku.ilike.%${sanitizedSearch}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply item_type filter
    if (item_type) {
      query = query.eq('item_type', item_type)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // For low stock filter, we need to fetch all items first, then filter
    // This is because we need to compare stock_quantity with reorder_level
    let allItems: any[] = []
    let totalCount = 0

    if (low_stock) {
      // Fetch all items to filter by low stock
      const { data: allData, error: allError, count: allCount } = await query
      if (allError) {
        return handleDatabaseError(allError, 'fetch', 'optical items')
      }
      allItems = allData || []
      totalCount = allCount || 0
      
      // Filter for low stock items
      allItems = allItems.filter(item => item.stock_quantity <= item.reorder_level)
      totalCount = allItems.length
      
      // Apply pagination to filtered results
      const paginatedItems = allItems.slice(offset, offset + limit)
      const totalPages = Math.ceil(totalCount / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return NextResponse.json({
        success: true,
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      })
    } else {
      // Apply pagination normally
      query = query.range(offset, offset + limit - 1)
      const { data: items, error, count } = await query

      if (error) {
        return handleDatabaseError(error, 'fetch', 'optical items')
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil((count || 0) / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return NextResponse.json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      })
    }

  } catch (error) {
    return handleServerError(error, 'fetch', 'optical items')
  }
}

// POST /api/optical-plan - Add new optical item
export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('optical_plan', 'create')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
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

    if (!name || !category || !item_type || !sku || purchase_price === undefined || mrp === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, item_type, sku, purchase_price, mrp' },
        { status: 400 }
      )
    }

    // Validate price types and ranges
    const parsedPurchasePrice = Number(purchase_price)
    const parsedSellingPrice = Number(selling_price || purchase_price)
    const parsedMrp = Number(mrp)
    
    if (!Number.isFinite(parsedPurchasePrice) || parsedPurchasePrice < 0) {
      return NextResponse.json(
        { error: 'purchase_price must be a non-negative number' },
        { status: 400 }
      )
    }
    
    if (!Number.isFinite(parsedSellingPrice) || parsedSellingPrice < 0) {
      return NextResponse.json(
        { error: 'selling_price must be a non-negative number' },
        { status: 400 }
      )
    }
    
    if (!Number.isFinite(parsedMrp) || parsedMrp < 0) {
      return NextResponse.json(
        { error: 'mrp must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate stock quantities if provided
    if (stock_quantity !== undefined && stock_quantity !== null) {
      const parsedStock = Number(stock_quantity)
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return NextResponse.json(
          { error: 'stock_quantity must be a non-negative integer' },
          { status: 400 }
        )
      }
    }

    if (reorder_level !== undefined && reorder_level !== null) {
      const parsedReorder = Number(reorder_level)
      if (!Number.isInteger(parsedReorder) || parsedReorder < 0) {
        return NextResponse.json(
          { error: 'reorder_level must be a non-negative integer' },
          { status: 400 }
        )
      }
    }

    // Check if SKU already exists
    const { data: existingItem } = await supabase
      .from('optical_items')
      .select('id, sku')
      .eq('sku', sku)
      .single()

    if (existingItem) {
      return NextResponse.json(
        { error: 'SKU already exists. Please use a unique SKU.' },
        { status: 400 }
      )
    }

    // Insert new optical item
    const { data: item, error } = await supabase
      .from('optical_items')
      .insert([
        {
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
          purchase_price: parsedPurchasePrice,
          selling_price: parsedSellingPrice,
          mrp: parsedMrp,
          stock_quantity: stock_quantity || 0,
          reorder_level: reorder_level || 5,
          supplier,
          image_url,
          warranty_months: warranty_months || 0,
          hsn_code,
          gst_percentage: gst_percentage || 18,
          description
        }
      ])
      .select()
      .single()

    if (error) {
      return handleDatabaseError(error, 'create', 'optical item')
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Optical item created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleServerError(error, 'create', 'optical item')
  }
}

