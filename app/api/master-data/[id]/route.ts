import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/master-data/[id] - Get a specific master data item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('master_data', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

    const supabase = createClient()
    const { id } = await params

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
    // RBAC check
    const authCheck = await requirePermission('master_data', 'edit')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

    const supabase = createClient()
    const { id } = await params

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('master_data', 'delete')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

    const supabase = createClient()
    const { id } = await params

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

    // Get query parameter for hard delete
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // For beds category, also delete from beds table if it exists
      if (targetItem.category === 'beds') {
        // Get bed_number from master_data to find corresponding bed in beds table
        const { data: masterBedData } = await supabase
          .from('master_data')
          .select('bed_number, name, metadata')
          .eq('id', id)
          .single()

        if (masterBedData) {
          const bedNumber = masterBedData.bed_number || masterBedData.name
          
          // Find bed in beds table by bed_number
          const { data: bedInBedsTable } = await supabase
            .from('beds')
            .select('id')
            .eq('bed_number', bedNumber)
            .single()

          // Check for active assignments before deleting
          if (bedInBedsTable) {
            const { data: activeAssignments } = await supabase
              .from('bed_assignments')
              .select('id')
              .eq('bed_id', bedInBedsTable.id)
              .eq('status', 'active')

            if (activeAssignments && activeAssignments.length > 0) {
              return NextResponse.json({
                error: 'Cannot delete bed with active patient assignments. Please discharge the patient first.'
              }, { status: 400 })
            }

            // Delete from beds table first (this will cascade delete assignments)
            const { error: bedDeleteError } = await supabase
              .from('beds')
              .delete()
              .eq('id', bedInBedsTable.id)

            if (bedDeleteError) {
              console.error('Error deleting bed from beds table:', bedDeleteError)
              // Continue with master_data deletion even if beds table deletion fails
            }
          }
        }
      }

      // Hard delete - completely remove the item from master_data
      const { error } = await supabase
        .from('master_data')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to delete master data item' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: { id },
        message: 'Master data item deleted permanently'
      })
    } else {
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from('master_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to deactivate master data item' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: { id, is_active: false },
        message: 'Master data item deactivated successfully'
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}