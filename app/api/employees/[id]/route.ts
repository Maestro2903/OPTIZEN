import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/employees/[id] - Get a specific employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate and sanitize ID parameter
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid employee ID format' }, { status: 400 })
    }

    // Authorization check - allow if user is accessing their own record, admin, or manager
    const isOwnRecord = session.user.id === id
    const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role
    const isAdmin = userRole === 'admin'
    const isManager = userRole === 'manager'

    if (!isOwnRecord && !isAdmin && !isManager) {
      // For managers, check if they manage this employee (if employee table has manager_id field)
      if (userRole === 'manager') {
        const { data: employeeCheck } = await supabase
          .from('employees')
          .select('manager_id')
          .eq('id', id)
          .single()

        if (employeeCheck?.manager_id !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Fetch employee by ID
    const { data: employee, error } = await supabase
      .from('employees')
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
  try {
    const supabase = createClient()
    const { id } = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update employee
    const { data: employee, error } = await supabase
      .from('employees')
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
  try {
    const supabase = createClient()
    const { id } = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch employee first for authorization check
    const { data: targetEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('id, status, employee_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      console.error('Error fetching employee:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
    }

    // Authorization check - only admins, managers, or self-deactivation allowed
    const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role
    const isAdmin = userRole === 'admin'
    const isManager = userRole === 'manager'
    const isSelfDeactivation = String(session.user.id) === String(id)

    if (!isAdmin && !isManager && !isSelfDeactivation) {
      return NextResponse.json({
        error: 'Forbidden: You do not have permission to deactivate this employee'
      }, { status: 403 })
    }

    // For non-admins/non-managers, only allow self-deactivation
    if (!isAdmin && !isManager && !isSelfDeactivation) {
      return NextResponse.json({
        error: 'Forbidden: You can only deactivate your own account'
      }, { status: 403 })
    }

    // Soft delete by updating status to inactive
    const { data: employee, error } = await supabase
      .from('employees')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
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