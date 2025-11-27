import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/appointment-requests - List appointment requests or get by ID
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // Handle CORS for public access (success page)
  const origin = request.headers.get('origin')
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }

  // If requesting by ID (for public success page), use service client
  if (id) {
    try {
      const supabase = createServiceClient()
      const { data: request, error } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !request) {
        return NextResponse.json(
          { error: 'Appointment request not found' },
          { status: 404, headers: corsHeaders }
        )
      }

      return NextResponse.json({
        success: true,
        data: request,
      }, { headers: corsHeaders })
    } catch (error) {
      console.error('API error:', error)
      return NextResponse.json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500, headers: corsHeaders })
    }
  }

  // Otherwise, list requests (requires auth)
  const authCheck = await requirePermission('appointments', 'view')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'created_at'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status') || ''

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100)

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Build query
    let query = supabase
      .from('appointment_requests')
      .select(`
        *,
        provider:users!appointment_requests_provider_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        processed_by_user:users!appointment_requests_processed_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%`)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointment requests', details: error.message },
        { status: 500 }
      )
    }

    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
  
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

