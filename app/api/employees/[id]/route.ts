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
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
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
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
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

    // Get existing employee data to check for email changes
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      console.error('Error fetching employee:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
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

    // Validate role if provided
    if (body.role) {
      const validRoles = [
        'super_admin', 'hospital_admin', 'receptionist', 'optometrist', 
        'ophthalmologist', 'technician', 'billing_staff', 'admin', 
        'doctor', 'nurse', 'finance', 'pharmacy_staff', 'pharmacy', 
        'lab_technician', 'manager', 'read_only'
      ]
      if (!validRoles.includes(body.role.toLowerCase())) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // If email is being changed, update it in auth.users too
    if (body.email && body.email !== existingEmployee.email) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        id,
        { email: body.email }
      )
      if (authUpdateError) {
        console.error('Auth email update error:', authUpdateError)
        return NextResponse.json(
          { error: `Failed to update email: ${authUpdateError.message}` },
          { status: 500 }
        )
      }
    }

    // Remove fields that shouldn't be updated
    const {
      id: _id,
      created_at,
      created_by,
      employee_id, // Don't allow changing employee ID
      password, // Don't accept password in update
      confirmPassword, // Don't accept confirmPassword
      ...updateData
    } = body

    // Normalize role to lowercase if provided
    if (updateData.role) {
      updateData.role = updateData.role.toLowerCase()
    }

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

// DELETE /api/employees/[id] - Delete an employee (soft delete for non-super-admin, hard delete for super_admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('employees', 'delete')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params

    // Validate ID parameter
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid employee ID format' }, { status: 400 })
    }

    // Prevent users from deleting themselves
    if (id === context.user_id) {
      return NextResponse.json({ 
        error: 'You cannot delete your own account' 
      }, { status: 400 })
    }

    // Fetch employee to check their role
    const { data: employee, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      console.error('Database error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
    }

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Prevent deleting super_admin accounts (unless the current user is also super_admin)
    if (employee.role === 'super_admin' && context.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Only super administrators can delete super administrator accounts' 
      }, { status: 403 })
    }

    // Super admin can perform hard delete (permanently remove from database)
    if (context.role === 'super_admin') {
      // Delete from auth.users first (will cascade to public.users if CASCADE is set)
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id)
      
      if (authDeleteError) {
        console.error('Auth delete error:', authDeleteError)
        // If auth delete fails, try to delete from public.users directly
        const { error: publicDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', id)

        if (publicDeleteError) {
          console.error('Database delete error:', publicDeleteError)
          return NextResponse.json({ 
            error: 'Failed to delete employee from database' 
          }, { status: 500 })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Employee permanently deleted successfully',
        deleted_employee: {
          id: employee.id,
          email: employee.email,
          role: employee.role
        }
      })
    } else {
      // Other roles can only soft delete (deactivate)
      const { data: updatedEmployee, error } = await supabase
        .from('users')
        .update({
          is_active: false,
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
        data: updatedEmployee,
        message: 'Employee deactivated successfully'
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}