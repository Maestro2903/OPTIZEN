import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// Helper function to get hierarchical complaints structure
async function getHierarchicalComplaints(
  supabase: any,
  search: string,
  active_only: boolean,
  page: number,
  limit: number
) {
  try {
    // Fetch complaint categories
    let categoriesQuery = supabase
      .from('master_data')
      .select('*')
      .eq('category', 'complaint_categories')
      .order('sort_order', { ascending: true })

    if (active_only) {
      categoriesQuery = categoriesQuery.eq('is_active', true)
    }

    const { data: categories, error: categoriesError } = await categoriesQuery

    if (categoriesError) {
      console.error('Error fetching complaint categories:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch complaint categories' }, { status: 500 })
    }

    // Fetch all complaints
    let complaintsQuery = supabase
      .from('master_data')
      .select('*')
      .eq('category', 'complaints')
      .order('sort_order', { ascending: true })

    if (active_only) {
      complaintsQuery = complaintsQuery.eq('is_active', true)
    }

    const { data: allComplaints, error: complaintsError } = await complaintsQuery

    if (complaintsError) {
      console.error('Error fetching complaints:', complaintsError)
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
    }

    // Initialize arrays
    const hierarchicalData: any[] = []
    const allComplaintsList = allComplaints || []

    // Process each category
    if (categories && categories.length > 0) {
      for (const category of categories) {
        const categoryComplaints = allComplaintsList.filter((complaint: any) => {
          const parentCategoryId = complaint.metadata?.parent_category_id
          return parentCategoryId === category.id
        })

        // Apply search filter if provided
        let filteredComplaints = categoryComplaints
        if (search) {
          const sanitizedSearch = search.toLowerCase()
          filteredComplaints = categoryComplaints.filter((complaint: any) =>
            complaint.name.toLowerCase().includes(sanitizedSearch) ||
            complaint.description?.toLowerCase().includes(sanitizedSearch) ||
            category.name.toLowerCase().includes(sanitizedSearch)
          )
        }

        // Only include category if it has complaints or search matches category name
        if (filteredComplaints.length > 0 || (search && category.name.toLowerCase().includes(search.toLowerCase()))) {
          hierarchicalData.push({
            id: category.id,
            name: category.name,
            description: category.description || null,
            children: filteredComplaints.map((complaint: any) => ({
              id: complaint.id,
              name: complaint.name,
              description: complaint.description || null,
              is_active: complaint.is_active,  // ✅ Include is_active field
              sort_order: complaint.sort_order,
              created_at: complaint.created_at,
              updated_at: complaint.updated_at,
              metadata: complaint.metadata
            }))
          })
        }
      }
    }

    // Add complaints without a category (for backward compatibility)
    const complaintsWithCategoryIds = new Set(
      allComplaintsList
        .filter((c: any) => c.metadata?.parent_category_id)
        .map((c: any) => c.id)
    )

    const uncategorizedComplaints = allComplaintsList.filter((complaint: any) => {
      if (complaintsWithCategoryIds.has(complaint.id)) return false
      
      if (search) {
        const sanitizedSearch = search.toLowerCase()
        return complaint.name.toLowerCase().includes(sanitizedSearch) ||
               complaint.description?.toLowerCase().includes(sanitizedSearch)
      }
      return true
    })

    // If there are complaints without category, add them as a special group
    if (uncategorizedComplaints.length > 0) {
      hierarchicalData.push({
        id: null,
        name: 'Other Complaints',
        description: 'Complaints without a specific category',
        children: uncategorizedComplaints.map((complaint: any) => ({
          id: complaint.id,
          name: complaint.name,
          description: complaint.description || null,
          is_active: complaint.is_active,  // ✅ Include is_active field
          sort_order: complaint.sort_order,
          created_at: complaint.created_at,
          updated_at: complaint.updated_at,
          metadata: complaint.metadata
        }))
      })
    }

    // Calculate total count for pagination
    const totalCount = hierarchicalData.reduce((sum, cat) => sum + cat.children.length, 0)
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: hierarchicalData,
      category: 'complaints',
      hierarchical: true,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Error in getHierarchicalComplaints:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Allowed master data categories
const ALLOWED_CATEGORIES = [
  // Complaints and Categories
  'complaints',
  'complaint_categories',
  
  // Medical Data
  'treatments',
  'medicines',
  'surgeries',
  'surgery_types',
  'diagnostic_tests',
  'eye_conditions',
  'visual_acuity',
  'blood_tests',
  'diagnosis',
  'dosages',
  'routes',
  'anesthesia_types',
  
  // Eye Examination Findings
  'fundus_findings',
  'cornea_findings',
  'conjunctiva_findings',
  'iris_findings',
  'anterior_segment_findings',
  'lens_options',
  
  // Visit and IOP
  'eye_selection',
  'visit_types',
  'sac_status',
  'iop_ranges',
  'iop_methods',
  
  // Facility Management
  'beds',
  'room_types',
  'roles',
  
  // Financial
  'payment_methods',
  'payment_statuses',
  'revenue_types',
  'expense_categories',
  'insurance_providers',
  
  // Form-specific categories
  'pharmacy_categories',
  'color_vision_types',
  'driving_fitness_types'
]

// GET /api/master-data - List master data items by category with pagination
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('master_data', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

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


    // If no category specified, return all categories with counts
    if (!category) {
      // Try using database RPC function first for better performance
      const { data: categoryCounts, error: rpcError } = await supabase
        .rpc('get_category_counts')

      if (rpcError) {
        // RPC not available - fall back to client-side aggregation
        console.warn('RPC get_category_counts not available, using fallback query:', rpcError.message)
        console.warn('💡 Hint: Run database migrations to enable optimized queries: npx supabase db push')
        
        // Fallback: Fetch all master data and aggregate on client side
        const { data: allMasterData, error: fallbackError } = await supabase
          .from('master_data')
          .select('category')
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          return NextResponse.json({
            error: 'Failed to fetch master data categories',
            details: fallbackError.message
          }, { status: 500 })
        }

        // Aggregate counts on client side
        const counts: Record<string, number> = {}
        allMasterData?.forEach((item: any) => {
          counts[item.category] = (counts[item.category] || 0) + 1
        })

        return NextResponse.json({
          success: true,
          data: counts,
          categories: Object.keys(counts).sort(),
          fallback: true,
          hint: 'Using fallback query. Run migrations for better performance.'
        })
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

    // Special handling for complaints category - return hierarchical structure
    if (category === 'complaints') {
      return await getHierarchicalComplaints(supabase, search, active_only, page, limit)
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
    // RBAC check
    const authCheck = await requirePermission('master_data', 'create')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    const supabase = createClient()
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
          created_by: context.user_id
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