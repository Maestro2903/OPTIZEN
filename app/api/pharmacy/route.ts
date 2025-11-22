import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/pharmacy - List pharmacy items with stock information
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('pharmacy', 'view')
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
      'unit_price',
      'mrp',
      'stock_quantity',
      'reorder_level',
      'expiry_date'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'created_at'
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('pharmacy_items')
      .select('*', { count: 'exact' })

    // Apply search filter with sanitized input
    if (search) {
      // Escape special wildcard characters: backslash first, then % and _
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.or(`name.ilike.%${sanitizedSearch}%,generic_name.ilike.%${sanitizedSearch}%,manufacturer.ilike.%${sanitizedSearch}%,batch_number.ilike.%${sanitizedSearch}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply low stock filter using computed column (from migration 014)
    if (low_stock) {
      query = query.eq('is_low_stock', true)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: items, error, count } = await query

    if (error) {
      return handleDatabaseError(error, 'fetch', 'pharmacy items')
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

  } catch (error) {
    return handleServerError(error, 'fetch', 'pharmacy items')
  }
}

// POST /api/pharmacy - Add new pharmacy item
export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('pharmacy', 'create')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
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

    if (!name || !category || !unit_price || !mrp) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, unit_price, mrp' },
        { status: 400 }
      )
    }

    // Validate price types and ranges
    const parsedUnitPrice = Number(unit_price)
    const parsedMrp = Number(mrp)
    
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      return NextResponse.json(
        { error: 'unit_price must be a non-negative number' },
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

    // Insert new pharmacy item
    const { data: item, error } = await supabase
      .from('pharmacy_items')
      .insert([
        {
          name,
          generic_name,
          manufacturer,
          category,
          supplier,
          unit_price,
          mrp,
          stock_quantity: stock_quantity || 0,
          reorder_level: reorder_level || 10,
          batch_number,
          expiry_date,
          hsn_code,
          gst_percentage: gst_percentage || 0,
          prescription_required: prescription_required || false,
          dosage_form,
          strength,
          storage_instructions,
          description,
          image_url
        }
      ])
      .select()
      .single()

    if (error) {
      return handleDatabaseError(error, 'create', 'pharmacy item')
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Pharmacy item created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleServerError(error, 'create', 'pharmacy item')
  }
}