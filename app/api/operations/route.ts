import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { logger } from '@/lib/utils/logger'
import * as z from 'zod'

// Helper function to resolve eye and anesthesia names from master_data
async function resolveOperationFields(operations: any[], supabase: any) {
  if (!operations || operations.length === 0) return operations
  
  const eyeIds = operations.map(op => op.eye).filter(Boolean)
  const anesthesiaIds = operations.map(op => op.anesthesia).filter(Boolean)
  // Check if operation_name might be a UUID (UUIDs are 36 characters with dashes)
  const operationNames = operations.map(op => op.operation_name).filter(Boolean)
  const possibleOperationUuids = operationNames.filter(name => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name))
  
  // Fetch eye selection names
  let eyesMap: Record<string, string> = {}
  if (eyeIds.length > 0) {
    const { data: eyes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', eyeIds)
      .eq('category', 'eye_selection')
    
    if (eyes) {
      eyes.forEach((eye: any) => {
        eyesMap[eye.id] = eye.name
      })
    }
  }
  
  // Fetch anesthesia type names
  let anesthesiaMap: Record<string, string> = {}
  if (anesthesiaIds.length > 0) {
    const { data: anesthesiaTypes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', anesthesiaIds)
      .eq('category', 'anesthesia_types')
    
    if (anesthesiaTypes) {
      anesthesiaTypes.forEach((anesthesia: any) => {
        anesthesiaMap[anesthesia.id] = anesthesia.name
      })
    }
  }

  // Fetch surgery type names if operation_name appears to be a UUID
  let surgeryTypesMap: Record<string, string> = {}
  if (possibleOperationUuids.length > 0) {
    // Try surgery_types category first
    const { data: surgeryTypes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', possibleOperationUuids)
      .eq('category', 'surgery_types')
    
    if (surgeryTypes) {
      surgeryTypes.forEach((surgery: any) => {
        surgeryTypesMap[surgery.id] = surgery.name
      })
    }

    // Also try surgeries category as fallback
    const unresolvedSurgeryIds = possibleOperationUuids.filter(id => !surgeryTypesMap[id])
    if (unresolvedSurgeryIds.length > 0) {
      const { data: surgeries } = await supabase
        .from('master_data')
        .select('id, name')
        .in('id', unresolvedSurgeryIds)
        .eq('category', 'surgeries')
      
      if (surgeries) {
        surgeries.forEach((surgery: any) => {
          surgeryTypesMap[surgery.id] = surgery.name
        })
      }
    }
  }
  
  // Return enriched operation objects
  return operations.map(op => {
    const operationName = op.operation_name
    const isUuid = operationName && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationName)
    const resolvedOperationName = isUuid ? (surgeryTypesMap[operationName] || operationName) : operationName
    
    return {
      ...op,
      operation_name: resolvedOperationName,
      operation_name_original: operationName, // Keep original for reference
      eye_name: op.eye ? (eyesMap[op.eye] || op.eye) : undefined,
      anesthesia_name: op.anesthesia ? (anesthesiaMap[op.anesthesia] || op.anesthesia) : undefined,
    }
  })
}

// Validation schema for operations
const operationSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  case_id: z.string().uuid('Invalid case ID').optional(),
  operation_name: z.string().min(1, 'Operation name is required'),
  operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  begin_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  duration: z.string().optional(),
  eye: z.string().optional(), // Allow any string to support master data values
  sys_diagnosis: z.string().optional(),
  anesthesia: z.string().optional(),
  operation_notes: z.string().optional(),
  // Align with frontend options and allow common modes
  payment_mode: z.enum(['Cash', 'Card', 'Insurance', 'Online', 'UPI', 'Cheque']).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  iol_name: z.string().optional(),
  iol_power: z.string().optional(),
  print_notes: z.boolean().optional(),
  print_payment: z.boolean().optional(),
  print_iol: z.boolean().optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).default('scheduled'),
  // Follow-up fields
  follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  follow_up_notes: z.string().optional(),
  follow_up_visit_type: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()

  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    // Use service client for admin operations that need to bypass RLS
    const supabase = createServiceClient()
    logger.debug('Service client created for operations GET', {
      request_id: requestId,
      endpoint: '/api/operations',
      user_id: context.user_id
    })
    const { searchParams } = new URL(request.url)

    // Get query parameters with safe parsing
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '10', 10)

    // Validate and set defaults for NaN values, then clamp to ranges
    const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1
    const limit = Number.isFinite(limitParam) ? Math.min(100, Math.max(1, limitParam)) : 10
    const search = searchParams.get('search') || ''

    // Validate sortBy parameter against whitelist
    const allowedSorts = ['operation_date', 'operation_name', 'status', 'patient_id', 'case_id', 'begin_time', 'end_time', 'amount', 'created_at', 'updated_at']
    const rawSortBy = searchParams.get('sortBy') || 'operation_date'
    const sortBy = allowedSorts.includes(rawSortBy) ? rawSortBy : 'operation_date'

    // Validate sortOrder parameter
    const rawSortOrder = searchParams.get('sortOrder') || 'desc'
    const sortOrder = ['asc', 'desc'].includes(rawSortOrder) ? rawSortOrder : 'desc'

    const patient_id = searchParams.get('patient_id')
    const case_id = searchParams.get('case_id')
    const status = searchParams.get('status')

    // Calculate offset for pagination with explicit guards
    const safePage = Number.isFinite(page) ? page : 1
    const safeLimit = Number.isFinite(limit) ? limit : 10
    const offset = (safePage - 1) * safeLimit

    // Build query - filter out deleted records
    let query = supabase
      .from('operations')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        encounters:case_id (
          id,
          encounter_date,
          diagnosis,
          chief_complaint
        )
      `, { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (search) {
      // Search only in operation table columns to avoid nested relation issues
      const searchPattern = `%${search}%`
      query = query.or(`operation_name.ilike.${searchPattern},operation_notes.ilike.${searchPattern},sys_diagnosis.ilike.${searchPattern}`)
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    if (case_id) {
      query = query.eq('case_id', case_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + safeLimit - 1)

    logger.debug('Executing operations query', {
      request_id: requestId,
      endpoint: '/api/operations',
      user_id: context.user_id,
      filters: { patient_id, case_id, status, search }
    })
    const { data: operations, error, count } = await query

    if (error) {
      logger.error('Operations fetch error', error, {
        request_id: requestId,
        endpoint: '/api/operations',
        user_id: context.user_id
      })
      return NextResponse.json(
        { success: false, error: error.message, details: error },
        { status: 500 }
      )
    }

    logger.debug(`Fetched ${operations?.length || 0} operations`, {
      request_id: requestId,
      endpoint: '/api/operations',
      user_id: context.user_id,
      count: operations?.length || 0
    })
    
    // Resolve eye and anesthesia names from master_data
    logger.debug('Resolving operation fields from master_data', {
      request_id: requestId,
      endpoint: '/api/operations',
      user_id: context.user_id
    })
    const resolvedOperations = operations ? await resolveOperationFields(operations, supabase) : []

    // Normalize response: add cases alias for backward compatibility
    // Map encounters to cases format (encounters doesn't have case_no, so we generate an ID)
    const normalizedOperations = (resolvedOperations || []).map((op: any) => ({
      ...op,
      cases: op.encounters ? {
        ...op.encounters,
        case_no: op.encounters?.case_no || undefined
      } : op.cases || null
    }))

    // Calculate pagination metadata
    const total = count || 0
    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1
    const hasNextPage = safePage < totalPages
    const hasPrevPage = safePage > 1

    const duration = Date.now() - startTime
    logger.requestComplete('GET', '/api/operations', 200, duration, requestId, {
      user_id: context.user_id,
      total,
      page: safePage,
      limit: safeLimit
    })

    return NextResponse.json({
      success: true,
      data: normalizedOperations,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error in operations GET', error, {
      request_id: requestId,
      endpoint: '/api/operations',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()

  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'create')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    const body = await request.json()
    logger.info('Creating operation', {
      request_id: requestId,
      endpoint: '/api/operations',
      user_id: context.user_id,
      patient_id: body.patient_id
    })

    // Clean up empty strings to undefined for optional fields
    const emptyStringFields = ['case_id', 'iol_name', 'iol_power', 'operation_notes', 'follow_up_notes']
    emptyStringFields.forEach(field => {
      if (body[field] === '') {
        body[field] = undefined
      }
    })

    // Convert amount to number if it's a string or empty
    if (body.amount === '' || body.amount === null) {
      body.amount = undefined
    } else if (body.amount && typeof body.amount === 'string') {
      body.amount = parseFloat(body.amount)
    }

    // Validate input data
    const validation = operationSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Operation validation failed', {
        request_id: requestId,
        endpoint: '/api/operations',
        user_id: context.user_id,
        validation_errors: validation.error.issues
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }
    logger.debug('Operation validation passed', {
      request_id: requestId,
      endpoint: '/api/operations',
      user_id: context.user_id
    })

    const validatedData = validation.data
    // Use service client for admin operations that need to bypass RLS
    const supabase = createServiceClient()

    // Resolve master_data UUIDs to text values for eye, anesthesia, sys_diagnosis
    const fieldsToResolve = ['eye', 'anesthesia', 'sys_diagnosis', 'follow_up_visit_type']
    for (const field of fieldsToResolve) {
      const value = validatedData[field as keyof typeof validatedData]
      if (value && typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // It's a UUID, resolve it from master_data
        const { data: masterData } = await (supabase as any)
          .from('master_data')
          .select('name')
          .eq('id', value)
          .single()
        
        if (masterData) {
          logger.debug(`Resolved ${field} UUID to name`, {
            request_id: requestId,
            endpoint: '/api/operations',
            user_id: context.user_id,
            field,
            resolved_name: masterData.name
          })
          ;(validatedData as any)[field] = masterData.name
        }
      }
    }

    // Prepare insert data
    const insertData: any = {
      ...validatedData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: context.user_id
    }

    const { data: operation, error } = await (supabase as any)
      .from('operations')
      .insert([insertData])
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        encounters:case_id (
          id,
          encounter_date,
          diagnosis,
          chief_complaint
        )
      `)
      .single()

    if (error) {
      logger.error('Operation creation error', error, {
        request_id: requestId,
        endpoint: '/api/operations',
        user_id: context.user_id,
        patient_id: validatedData.patient_id
      })
      return NextResponse.json(
        { success: false, error: error.message, details: error },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('POST', '/api/operations', 201, duration, requestId, {
      user_id: context.user_id,
      operation_id: operation?.id,
      patient_id: validatedData.patient_id
    })

    // Resolve eye and anesthesia names from master_data
    const resolvedOperations = operation ? await resolveOperationFields([operation], supabase) : []
    const resolvedOperation = resolvedOperations.length > 0 ? resolvedOperations[0] : operation

    // Normalize response: add cases alias for backward compatibility
    const normalizedOperation = {
      ...resolvedOperation,
      cases: resolvedOperation.encounters ? {
        ...resolvedOperation.encounters,
        case_no: resolvedOperation.encounters?.case_no || undefined
      } : resolvedOperation.cases || null
    }

    return NextResponse.json({
      success: true,
      data: normalizedOperation,
      message: 'Operation scheduled successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error in operations POST', error, {
      request_id: requestId,
      endpoint: '/api/operations',
      duration_ms: duration
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}