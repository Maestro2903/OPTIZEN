import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/employees/[id] - Get a specific employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('employees', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params

    // Validate and sanitize ID parameter
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid employee ID format' }, { status: 400 })
    }

    // Fetch employee by ID
    const { data: employee, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: employee
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/employees/[id] - Update an employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('employees', 'edit')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params

    // Validate ID parameter
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid employee ID format' }, { status: 400 })
    }

    const body = await request.json()

    // Basic request body validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate required fields if provided
    if (body.email && typeof body.email !== 'string') {
      return NextResponse.json(
        { error: 'Email must be a string' },
        { status: 400 }
      )
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (body.phone && typeof body.phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone must be a string' },
        { status: 400 }
      )
    }

    // Remove fields that shouldn't be updated
    const {
      id: _id,
      created_at,
      created_by,
      employee_id, // Don't allow changing employee ID
      ...updateData
    } = body

    // Add audit fields
    updateData.updated_at = new Date().toISOString()
    updateData.updated_by = context.user_id

    // Update employee
    const { data: employee, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      if (error.code === '23505') { // Unique constraint violation
        // Parse error to determine which field caused the violation
        let conflictField = 'Resource'
        if ((error as any).constraint?.includes('email') || (error as any).detail?.includes('email')) {
          conflictField = 'Email'
        } else if ((error as any).constraint?.includes('username') || (error as any).detail?.includes('username')) {
          conflictField = 'Username'
        } else if ((error as any).constraint?.includes('employee_id') || (error as any).detail?.includes('employee_id')) {
          conflictField = 'Employee ID'
        }
        return NextResponse.json({
          error: `${conflictField} already exists`
        }, { status: 409 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/employees/[id] - Deactivate an employee (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('employees', 'delete')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params

    // Soft delete by updating status to inactive
    const { data: employee, error } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
        updated_by: context.user_id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to deactivate employee' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee deactivated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}