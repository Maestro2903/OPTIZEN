import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Allowed master data categories
const ALLOWED_CATEGORIES = [
  'departments',
  'specializations',
  'insurance_types',
  'appointment_types',
  'payment_methods',
  'document_types',
  'medication_types',
  'operation_types',
  'discharge_types'
]

// GET /api/master-data - List master data items by category with pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    const categoryParam = searchParams.get('category') || ''

    // Validate category against allowlist
    const category = ALLOWED_CATEGORIES.includes(categoryParam) ? categoryParam : ''

    if (categoryParam && !category) {
      return NextResponse.json({
        error: `Invalid category. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`
      }, { status: 400 })
    }
    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '100', 10)
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'sort_order'
    let sortOrder = searchParams.get('sortOrder') || 'asc'
    const active_only = searchParams.get('active_only') === 'true'

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 100 : Math.min(limit, 1000) // Cap at 1000

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'asc'
    }

    // Validate sortBy against allowlist
    const allowedSortColumns = [
      'sort_order',
      'name',
      'category',
      'created_at',
      'updated_at',
      'is_active'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'sort_order'
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If no category specified, return all categories with counts
    if (!category) {
      // Use database aggregation instead of fetching all rows
      const { data: categoryCounts, error } = await supabase
        .rpc('get_category_counts')

      if (error) {
        // Fail hard when RPC is missing - requires database function setup
        console.error('RPC get_category_counts not available - database function setup required:', error)
        return NextResponse.json({
          error: 'Database function get_category_counts is not available. Please ensure database setup is complete.',
          details: 'Required stored procedure missing'
        }, { status: 500 })
      }

      // Transform RPC result to expected format
      const counts = categoryCounts?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.category] = item.count
        return acc
      }, {}) || {}

      return NextResponse.json({
        success: true,
        data: counts,
        categories: Object.keys(counts).sort()
      })
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query for specific category
    let query = supabase
      .from('master_data')
      .select('*', { count: 'exact' })
      .eq('category', category)

    // Apply active filter
    if (active_only) {
      query = query.eq('is_active', true)
    }

    // Apply search filter with sanitized input
    if (search) {
      // Escape special wildcard characters: backslash first, then % and _
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: items, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch master data' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: items,
      category,
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

// POST /api/master-data - Create a new master data item
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
      category,
      name,
      description,
      is_active = true,
      sort_order = 0,
      metadata = {}
    } = body

    if (!category || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: category, name' },
        { status: 400 }
      )
    }

    // Validate category against allowlist
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate types and constraints
    if (typeof category !== 'string' || category.length > 100) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (typeof name !== 'string' || name.length < 1 || name.length > 255) {
      return NextResponse.json({ error: 'Invalid name length' }, { status: 400 })
    }

    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return NextResponse.json({ error: 'Invalid description' }, { status: 400 })
    }

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_active type' }, { status: 400 })
    }

    if (typeof sort_order !== 'number' || sort_order < 0 || !Number.isInteger(sort_order)) {
      return NextResponse.json({ error: 'Invalid sort_order' }, { status: 400 })
    }

    if (metadata !== null && (typeof metadata !== 'object' || Array.isArray(metadata))) {
      return NextResponse.json({ error: 'Invalid metadata type' }, { status: 400 })
    }

    // Get the next sort order if not provided
    let finalSortOrder = sort_order
    if (sort_order === 0) {
      const { data: maxSortOrder, error: sortError } = await supabase
        .from('master_data')
        .select('sort_order')
        .eq('category', category)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sortError) {
        console.error('Database error:', sortError)
        return NextResponse.json({ error: 'Failed to calculate sort order' }, { status: 500 })
      }

      // Handle null (no existing items in category) or result
      finalSortOrder = (maxSortOrder?.sort_order || 0) + 1
    }

    // Insert new master data item
    const { data: item, error } = await supabase
      .from('master_data')
      .insert([
        {
          category,
          name,
          description,
          is_active,
          sort_order: finalSortOrder,
          metadata,
          created_by: session.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'An item with this name already exists in this category'
        }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create master data item' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Master data item created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}