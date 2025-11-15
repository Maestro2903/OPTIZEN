import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'view')
    if (!authCheck.authorized) return authCheck.response

    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation ID format' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS during RBAC bypass mode
    const supabase = createServiceClient()

    // Fetch operation with all required data
    const { data: operation, error } = await supabase
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
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Operation fetch error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

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
      data: normalizedOperation
    })

  } catch (error) {
    console.error('Unexpected error in operation GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'edit')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation ID format' },
        { status: 400 }
      )
    }

    // Check if operation exists
    // Use service client to bypass RLS during RBAC bypass mode
    const supabase = createServiceClient()
    const { data: existingOperation, error: fetchError } = await supabase
      .from('operations')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingOperation) {
      return NextResponse.json(
        { success: false, error: 'Operation not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Define allowed fields that can be updated (matching the schema)
    const allowedFields = [
      'operation_name',
      'operation_date',
      'begin_time',
      'end_time',
      'duration',
      'eye',
      'sys_diagnosis',
      'anesthesia',
      'operation_notes',
      'payment_mode',
      'amount',
      'iol_name',
      'iol_power',
      'print_notes',
      'print_payment',
      'print_iol',
      'status',
      'case_id'
    ]

    // Build update data with only allowed fields
    const updateData: any = { 
      updated_at: new Date().toISOString() 
    }
    
    // Only set updated_by if it's not the mock bypass user ID
    if (context.user_id !== '00000000-0000-0000-0000-000000000000') {
      updateData.updated_by = context.user_id
    }
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Convert amount to number if provided
    if (updateData.amount && typeof updateData.amount === 'string') {
      updateData.amount = parseFloat(updateData.amount)
    }

    // Check if there's anything to update (besides updated_at and updated_by)
    const baseFieldCount = updateData.updated_by ? 2 : 1 // Count updated_at and optionally updated_by
    if (Object.keys(updateData).length === baseFieldCount) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update. Allowed fields: ' + allowedFields.join(', ')
      }, { status: 400 })
    }

    // Perform update
    const updateResult = await (supabase as any)
      .from('operations')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
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
    
    const { data: operation, error } = updateResult

    if (error) {
      console.error('Operation update error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

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
      message: 'Operation updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in operation PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('operations', 'delete')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation ID format' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS during RBAC bypass mode
    const supabase = createServiceClient()

    // Check if operation exists and is not already deleted
    const { data: existingOperation, error: fetchError } = await (supabase as any)
      .from('operations')
      .select('id, deleted_at')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Operation not found' },
          { status: 404 }
        )
      }
      console.error('Operation fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch operation' },
        { status: 500 }
      )
    }

    if (existingOperation?.deleted_at) {
      return NextResponse.json(
        { success: false, error: 'Operation already deleted' },
        { status: 410 }
      )
    }

    // Soft delete by setting deleted_at timestamp
    const deleteData: Record<string, any> = {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Only set updated_by if it's not the mock bypass user ID
    if (context.user_id !== '00000000-0000-0000-0000-000000000000') {
      deleteData.updated_by = context.user_id
    }
    
    const { error } = await (supabase as any)
      .from('operations')
      .update(deleteData)
      .eq('id', id)
      .is('deleted_at', null) // Only delete if not already deleted

    if (error) {
      console.error('Operation soft deletion error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete operation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Operation deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in operation DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}