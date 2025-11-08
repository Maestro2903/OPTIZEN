import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/master-data/[id] - Get a specific master data item by ID
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

    // Fetch master data item by ID
    const { data: item, error } = await supabase
      .from('master_data')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Master data item not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch master data item' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: item
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/master-data/[id] - Update a master data item
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

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 })
    }

    // Authorization check
    // TODO: Implement role-based access control for editing master data
    // Check if user has can_edit_master_data permission or is admin
    // For now, all authenticated users can edit (add proper RBAC when available)
    // Example:
    // const { data: userRole } = await supabase
    //   .from('user_roles')
    //   .select('can_edit_master_data')
    //   .eq('user_id', session.user.id)
    //   .single()
    // if (!userRole?.can_edit_master_data) {
    //   return NextResponse.json({ error: 'Forbidden: Insufficient permissions to edit master data' }, { status: 403 })
    // }

    // Define allowed fields that can be updated
    const allowedFields = ['name', 'description', 'value', 'is_active', 'sort_order', 'metadata']
    
    // Build update data with only allowed fields
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: 'No valid fields to update. Allowed fields: ' + allowedFields.join(', ')
      }, { status: 400 })
    }

    // Validate field values
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
        return NextResponse.json({
          error: 'name must be a non-empty string'
        }, { status: 400 })
      }
    }

    if (updateData.description !== undefined) {
      if (typeof updateData.description !== 'string') {
        return NextResponse.json({
          error: 'description must be a string'
        }, { status: 400 })
      }
    }

    if (updateData.sort_order !== undefined) {
      if (typeof updateData.sort_order !== 'number' || updateData.sort_order < 0 || !Number.isInteger(updateData.sort_order)) {
        return NextResponse.json({
          error: 'sort_order must be a non-negative integer'
        }, { status: 400 })
      }
    }

    if (updateData.is_active !== undefined) {
      if (typeof updateData.is_active !== 'boolean') {
        return NextResponse.json({
          error: 'is_active must be a boolean'
        }, { status: 400 })
      }
    }

    if (updateData.metadata !== undefined) {
      if (updateData.metadata !== null && (typeof updateData.metadata !== 'object' || Array.isArray(updateData.metadata))) {
        return NextResponse.json({
          error: 'metadata must be an object or null'
        }, { status: 400 })
      }
    }

    if (updateData.value !== undefined) {
      if (typeof updateData.value !== 'string' && typeof updateData.value !== 'number') {
        return NextResponse.json({
          error: 'value must be a string or number'
        }, { status: 400 })
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update master data item
    const { data: item, error } = await supabase
      .from('master_data')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Master data item not found' }, { status: 404 })
      }
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'An item with this name already exists in this category'
        }, { status: 409 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update master data item' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Master data item updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/master-data/[id] - Delete/deactivate a master data item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch item first for authorization check
    const { data: targetItem, error: fetchError } = await supabase
      .from('master_data')
      .select('id, category, is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Master data item not found' }, { status: 404 })
      }
      console.error('Error fetching master data item:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch master data item' }, { status: 500 })
    }

    if (!targetItem) {
      return NextResponse.json({ error: 'Master data item not found' }, { status: 404 })
    }

    // Authorization check - DELETE requires stricter permissions than PUT
    // TODO: Implement role-based access control for deleting master data
    // Only admins or users with explicit delete permissions should be allowed
    // For now, all authenticated users can delete (add proper RBAC when available)
    // Example:
    // const { data: userRole } = await supabase
    //   .from('user_roles')
    //   .select('role, can_delete_master_data')
    //   .eq('user_id', session.user.id)
    //   .single()
    // if (!userRole?.can_delete_master_data && userRole?.role !== 'admin') {
    //   return NextResponse.json({ 
    //     error: 'Forbidden: Insufficient permissions to delete master data. Contact an administrator.' 
    //   }, { status: 403 })
    // }

    // Get query parameter for hard delete
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - completely remove the item
      const { data: item, error } = await supabase
        .from('master_data')
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return NextResponse.json({ error: 'Master data item not found' }, { status: 404 })
        }
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to delete master data item' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: item,
        message: 'Master data item deleted permanently'
      })
    } else {
      // Soft delete - mark as inactive
      const { data: item, error } = await supabase
        .from('master_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return NextResponse.json({ error: 'Master data item not found' }, { status: 404 })
        }
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to deactivate master data item' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: item,
        message: 'Master data item deactivated successfully'
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}