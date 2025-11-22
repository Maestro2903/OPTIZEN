import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase/server'
import * as z from 'zod'
import { rbacService, requirePermission, hasFinancialAccess } from '@/lib/services/rbac'
import { auditService, auditApiCall } from '@/lib/services/audit'
import { validateSessionMiddleware } from '@/lib/services/session'
import { applyRateLimit } from '@/lib/middleware/rateLimiter'
import { createSecureResponse } from '@/lib/middleware/security'

// Validation schema for revenue transactions
const revenueTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  transaction_date: z.string().datetime('Invalid date format'),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  patient_id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
})

async function authenticate(request: NextRequest) {
  // Use session-based authentication
  const sessionValidation = await validateSessionMiddleware(request)

  if (!sessionValidation.valid || !sessionValidation.user_id) {
    return null
  }

  const supabase = await createAuthenticatedClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.id !== sessionValidation.user_id) {
    return null
  }

  return { user, sessionData: sessionValidation.session }
}

async function authorize(userId: string, action: string, resource: string = 'revenue') {
  // Use comprehensive RBAC system
  const hasPermission = await rbacService.hasPermission(userId, action, resource)

  if (!hasPermission) {
    // Also check if user has general financial access
    return await hasFinancialAccess(userId)
  }

  return hasPermission
}

function getClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    sessionId: request.headers.get('x-session-id') || request.cookies.get('session_id')?.value
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, 'financial')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Authentication check
    const authResult = await authenticate(request)
    if (!authResult) {
      return createSecureResponse(
        { success: false, error: 'Authentication required' },
        { status: 401 },
        request
      )
    }

    // Authorization check
    const authorized = await authorize(authResult.user.id, 'read', 'revenue')
    if (!authorized) {
      await auditService.logActivity({
        user_id: authResult.user.id,
        action: 'revenue_access_denied',
        table_name: 'revenue',
        ip_address: getClientInfo(request).ipAddress,
        user_agent: getClientInfo(request).userAgent,
        metadata: { success: false, failure_reason: 'Insufficient permissions' }
      })

      return createSecureResponse(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 },
        request
      )
    }

    const supabase = await createAuthenticatedClient()
    const { searchParams } = new URL(request.url)

    // Get and validate query parameters
    let page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '10')

    // Validate and sanitize pagination params
    if (!Number.isFinite(page) || page < 1) {
      page = 1
    }
    if (!Number.isFinite(limit) || limit < 1) {
      limit = 10
    }
    limit = Math.min(100, limit) // Clamp limit to max 100

    const search = searchParams.get('search') || ''

    // Validate sortBy parameter against whitelist
    const allowedSorts = ['transaction_date', 'amount', 'type', 'category', 'description', 'payment_method', 'created_at', 'updated_at']
    const rawSortBy = searchParams.get('sortBy') || 'transaction_date'
    const sortBy = allowedSorts.includes(rawSortBy) ? rawSortBy : 'transaction_date'

    // Validate sortOrder parameter
    const rawSortOrder = searchParams.get('sortOrder') || 'desc'
    const sortOrder = ['asc', 'desc'].includes(rawSortOrder) ? rawSortOrder : 'desc'

    const type = searchParams.get('type') // 'income' or 'expense'
    const category = searchParams.get('category')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('revenue_transactions')
      .select(`*`, { count: 'exact' })

    // Apply filters
    if (search) {
      // Escape special LIKE characters to prevent wildcard injection
      const escapedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      const searchPattern = `%${escapedSearch}%`
      query = query.or(`description.ilike.${searchPattern}, category.ilike.${searchPattern}, reference.ilike.${searchPattern}`)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (date_from) {
      query = query.gte('transaction_date', date_from)
    }

    if (date_to) {
      query = query.lte('transaction_date', date_to)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Revenue transactions fetch error:', error)
      await auditService.logActivity({
        user_id: authResult.user.id,
        action: 'revenue_fetch_error',
        table_name: 'revenue',
        ip_address: getClientInfo(request).ipAddress,
        user_agent: getClientInfo(request).userAgent,
        metadata: { success: false, failure_reason: error.message }
      })

      return createSecureResponse(
        { success: false, error: error.message },
        { status: 500 },
        request
      )
    }

    // Log successful access
    await auditService.logActivity({
      user_id: authResult.user.id,
      action: 'revenue_fetch',
      table_name: 'revenue',
      ip_address: getClientInfo(request).ipAddress,
      user_agent: getClientInfo(request).userAgent,
      metadata: { success: true, count: count || 0, filters: { search, type, category, date_from, date_to } }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return createSecureResponse({
      success: true,
      data: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    }, { status: 200 }, request)

  } catch (error) {
    console.error('Unexpected error in revenue GET:', error)
    return createSecureResponse(
      { success: false, error: 'Internal server error' },
      { status: 500 },
      request
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, 'financial')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Authentication check
    const authResult = await authenticate(request)
    if (!authResult) {
      return createSecureResponse(
        { success: false, error: 'Authentication required' },
        { status: 401 },
        request
      )
    }

    // Authorization check
    const authorized = await authorize(authResult.user.id, 'create', 'revenue')
    if (!authorized) {
      await auditService.logActivity({
        user_id: authResult.user.id,
        action: 'revenue_create_denied',
        table_name: 'revenue',
        ip_address: getClientInfo(request).ipAddress,
        user_agent: getClientInfo(request).userAgent,
        metadata: { success: false, failure_reason: 'Insufficient permissions' }
      })

      return createSecureResponse(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 },
        request
      )
    }

    const body = await request.json()

    // Convert amount to number if it's a string
    if (body.amount && typeof body.amount === 'string') {
      body.amount = parseFloat(body.amount)
    }

    // Validate input data
    const validation = revenueTransactionSchema.safeParse(body)
    if (!validation.success) {
      await auditService.logActivity({
        user_id: authResult.user.id,
        action: 'revenue_create_validation_failed',
        table_name: 'revenue',
        ip_address: getClientInfo(request).ipAddress,
        user_agent: getClientInfo(request).userAgent,
        metadata: { success: false, failure_reason: 'Validation error', details: validation.error.issues }
      })

      return createSecureResponse(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.issues
        },
        { status: 400 },
        request
      )
    }

    const validatedData = validation.data
    const supabase = await createAuthenticatedClient()

    const { data: transaction, error } = await supabase
      .from('revenue_transactions')
      .insert([
        {
          ...validatedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Revenue transaction creation error:', error)
      await auditService.logActivity({
        user_id: authResult.user.id,
        action: 'revenue_create_failed',
        table_name: 'revenue',
        ip_address: getClientInfo(request).ipAddress,
        user_agent: getClientInfo(request).userAgent,
        metadata: { success: false, failure_reason: error.message, details: validatedData }
      })

      return createSecureResponse(
        { success: false, error: error.message },
        { status: 500 },
        request
      )
    }

    // Log successful transaction creation
    await auditService.logFinancialActivity({
      user_id: authResult.user.id,
      transaction_type: transaction.type,
      amount: transaction.amount,
      patient_id: transaction.patient_id,
      invoice_id: transaction.invoice_id,
      reference_number: transaction.reference,
      description: transaction.description,
      ip_address: getClientInfo(request).ipAddress,
      metadata: {
        category: transaction.category,
        transaction_id: transaction.id
      }
    })

    return createSecureResponse({
      success: true,
      data: transaction,
      message: 'Transaction recorded successfully'
    }, { status: 201 }, request)

  } catch (error) {
    console.error('Unexpected error in revenue POST:', error)
    return createSecureResponse(
      { success: false, error: 'Internal server error' },
      { status: 500 },
      request
    )
  }
}