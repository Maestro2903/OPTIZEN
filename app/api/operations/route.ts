import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'
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
  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    // Use service client to bypass RLS during RBAC bypass mode
    const supabase = createServiceClient()
    console.log('🔧 Service client created for operations GET')
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

    // Calculate offset for pagination
    const offset = (page - 1) * limit

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
    query = query.range(offset, offset + limit - 1)

    console.log('🔍 Executing query...')
    const { data: operations, error, count } = await query

    if (error) {
      console.error('❌ Operations fetch error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { success: false, error: error.message, details: error },
        { status: 500 }
      )
    }

    console.log(`✅ Fetched ${operations?.length || 0} operations`)
    
    // Resolve eye and anesthesia names from master_data
    console.log('🔄 Resolving operation fields from master_data...')
    const resolvedOperations = operations ? await resolveOperationFields(operations, supabase) : []

    // Normalize response: add cases alias for backward compatibility
    // Map encounters to cases format (encounters doesn't have case_no, so we generate an ID)
    const normalizedOperations = (resolvedOperations || []).map((op: any) => ({
      ...op,
      cases: op.encounters ? {
        ...op.encounters,
        case_no: op.encounters.id ? `ENC-${op.encounters.id.substring(0, 8).toUpperCase()}` : undefined
      } : op.cases || null
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: normalizedOperations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Unexpected error in operations GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'create')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    const body = await request.json()
    console.log('📝 Creating operation with data:', JSON.stringify(body, null, 2))

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
      console.error('❌ Validation failed:', validation.error.issues)
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }
    console.log('✅ Validation passed')

    const validatedData = validation.data
    // Use service client to bypass RLS during RBAC bypass mode
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
          console.log(`🔄 Resolved ${field} UUID to: ${masterData.name}`)
          ;(validatedData as any)[field] = masterData.name
        }
      }
    }

    // Prepare insert data
    // In development mode with RBAC bypass, don't set created_by to avoid foreign key constraint issues
    const insertData: any = {
      ...validatedData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Only set created_by if it's not the mock bypass user ID
    if (context.user_id !== '00000000-0000-0000-0000-000000000000') {
      insertData.created_by = context.user_id
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
      console.error('❌ Operation creation error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { success: false, error: error.message, details: error },
        { status: 500 }
      )
    }

    console.log('✅ Operation created successfully:', operation?.id)

    // Resolve eye and anesthesia names from master_data
    const resolvedOperations = operation ? await resolveOperationFields([operation], supabase) : []
    const resolvedOperation = resolvedOperations.length > 0 ? resolvedOperations[0] : operation

    // Normalize response: add cases alias for backward compatibility
    const normalizedOperation = {
      ...resolvedOperation,
      cases: resolvedOperation.encounters ? {
        ...resolvedOperation.encounters,
        case_no: resolvedOperation.encounters.id ? `ENC-${resolvedOperation.encounters.id.substring(0, 8).toUpperCase()}` : undefined
      } : resolvedOperation.cases || null
    }

    return NextResponse.json({
      success: true,
      data: normalizedOperation,
      message: 'Operation scheduled successfully'
    })

  } catch (error) {
    console.error('Unexpected error in operations POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}