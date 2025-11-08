import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/pharmacy - List pharmacy items with stock information
export async function GET(request: NextRequest) {
  try {
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

    // Validate sortBy against allowlist
    const allowedSortColumns = [
      'created_at',
      'item_name',
      'category',
      'unit_price',
      'selling_price',
      'current_stock',
      'reorder_level',
      'expiry_date'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'created_at'
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      query = query.or(`item_name.ilike.%${sanitizedSearch}%,generic_name.ilike.%${sanitizedSearch}%,manufacturer.ilike.%${sanitizedSearch}%,batch_number.ilike.%${sanitizedSearch}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply low stock filter
    // Note: PostgREST doesn't support column-to-column comparison directly
    // TODO: Create a computed field or database view for is_low_stock
    // For now, fetch and filter in application code when low_stock is requested
    // A better approach would be to add a computed column or use an RPC function

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: items, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch pharmacy items' }, { status: 500 })
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
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/pharmacy - Add new pharmacy item
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const {
      item_name,
      generic_name,
      manufacturer,
      category,
      unit_price,
      selling_price,
      current_stock,
      reorder_level,
      batch_number,
      expiry_date,
      description
    } = body

    if (!item_name || !category || !unit_price || !selling_price) {
      return NextResponse.json(
        { error: 'Missing required fields: item_name, category, unit_price, selling_price' },
        { status: 400 }
      )
    }

    // Validate price types and ranges
    const parsedUnitPrice = Number(unit_price)
    const parsedSellingPrice = Number(selling_price)
    
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0) {
      return NextResponse.json(
        { error: 'unit_price must be a positive number greater than 0' },
        { status: 400 }
      )
    }
    
    if (!Number.isFinite(parsedSellingPrice) || parsedSellingPrice <= 0) {
      return NextResponse.json(
        { error: 'selling_price must be a positive number greater than 0' },
        { status: 400 }
      )
    }
    
    if (parsedSellingPrice < parsedUnitPrice) {
      return NextResponse.json(
        { error: 'selling_price must be greater than or equal to unit_price' },
        { status: 400 }
      )
    }

    // Validate stock quantities if provided
    if (current_stock !== undefined && current_stock !== null) {
      const parsedStock = Number(current_stock)
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return NextResponse.json(
          { error: 'current_stock must be a non-negative integer' },
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
          item_name,
          generic_name,
          manufacturer,
          category,
          unit_price,
          selling_price,
          current_stock: current_stock || 0,
          reorder_level: reorder_level || 0,
          batch_number,
          expiry_date,
          description,
          created_by: session.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create pharmacy item' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Pharmacy item created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}