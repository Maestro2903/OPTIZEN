import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Helper function to fetch and transform permissions for a role
 */
async function fetchAndTransformPermissions(serviceClient: any, roleId: string) {
  const { data: permissions, error: permError } = await serviceClient
    .from('role_permissions')
    .select(`
      permission_id,
      permissions (
        id,
        action,
        resource,
        description
      )
    `)
    .eq('role_id', roleId)

  if (permError) {
    console.error('Error fetching permissions:', permError)
    return {
      error: permError,
      status: 500
    }
  }

  // Transform permissions into a structured format
  const permissionsMap: Record<string, Record<string, boolean>> = {}
  
  if (permissions) {
    permissions.forEach((rp: any) => {
      const perm = rp.permissions
      if (perm) {
        if (!permissionsMap[perm.resource]) {
          permissionsMap[perm.resource] = {}
        }
        permissionsMap[perm.resource][perm.action] = true
      }
    })
  }

  return { permissionsMap }
}

/**
 * Helper function to toggle (insert/delete) a permission
 */
async function togglePermission(
  serviceClient: any,
  roleId: string,
  permissionId: string,
  enabled: boolean,
  userId: string
) {
  if (enabled) {
    // Add permission
    console.log('➕ Adding permission to database...')
    const { data: insertData, error: insertError } = await serviceClient
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId,
        created_by: userId
      })
      .select()

    if (insertError && insertError.code !== '23505') { // Ignore unique constraint errors
      console.error('❌ Error adding permission:', insertError)
      return {
        error: insertError,
        success: false
      }
    }
    console.log('✅ Permission added successfully:', insertData)
  } else {
    // Remove permission
    console.log('➖ Removing permission from database...')
    const { data: deleteData, error: deleteError } = await serviceClient
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)
      .select()

    if (deleteError) {
      console.error('❌ Error removing permission:', deleteError)
      return {
        error: deleteError,
        success: false
      }
    }
    console.log('✅ Permission removed successfully:', deleteData)
  }

  return { success: true }
}

/**
 * GET: Fetch all role permissions for a specific role
 * SECURITY: Only super_admin can access - they have full control to view/edit all permissions
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/access-control - Request received')
    const supabase = await createAuthenticatedClient()
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔑 Session status:', session ? 'Active' : 'None', sessionError ? `Error: ${sessionError.message}` : '')
    
    if (!session) {
      console.warn('❌ No session found')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in', details: 'No active session' },
        { status: 401 }
      )
    }

    // AUTHORIZATION: Check if user is super_admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', session.user.id)
      .single()

    console.log('👤 User fetched:', user?.email, 'Role:', user?.role, userError ? `Error: ${userError.message}` : '')

    if (userError) {
      console.error('❌ Error fetching user role:', userError)
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to verify user role', details: userError.message },
        { status: 500 }
      )
    }

    if (!user || user.role !== 'super_admin') {
      console.warn(`🚫 Access denied for user ${user?.email} with role ${user?.role}`)
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins can access permission management', userRole: user?.role },
        { status: 403 }
      )
    }
    
    console.log('✅ Authorization passed for', user.email)

    // Get role from query params
    const { searchParams } = new URL(request.url)
    const roleName = searchParams.get('role')

    if (!roleName) {
      return NextResponse.json(
        { error: 'Role parameter is required' },
        { status: 400 }
      )
    }

    // Fetch role by name using service client to bypass PostgREST cache
    // This is critical for access control to work properly
    const serviceClient = createServiceClient()
    const { data: roleData, error: roleError } = await serviceClient
      .from('roles')
      .select('id, name, description')
      .eq('name', roleName)
      .single()

    if (roleError || !roleData) {
      console.error('❌ Role not found:', roleName, roleError)
      
      // Fallback: Try using database function to bypass cache
      const { data: roleFromRpc, error: rpcError } = await serviceClient
        .rpc('get_role_by_name', { role_name: roleName } as any)
      
      if (rpcError || !roleFromRpc || roleFromRpc.length === 0) {
        console.error('❌ RPC fallback also failed:', rpcError)
        return NextResponse.json(
          { 
            error: 'Role not found in database', 
            roleName,
            hint: 'PostgREST cache may need refresh. Try running: node scripts/reload-postgrest-cache.js'
          },
          { status: 404 }
        )
      }
      
      // Use the role from RPC
      const roleDataFromRpc = roleFromRpc[0]
      console.log('✅ Role found via RPC fallback:', roleDataFromRpc.name)
      
      // Use helper function to fetch and transform permissions
      const result = await fetchAndTransformPermissions(serviceClient, roleDataFromRpc.id)
      
      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to fetch permissions' },
          { status: result.status || 500 }
        )
      }

      return NextResponse.json({
        role: roleDataFromRpc,
        permissions: result.permissionsMap
      })
    }

    // Fetch all permissions for this role using the role ID
    // This connects the Permission Matrix UI to the actual database role IDs
    // Use service client for consistent cache-free access and helper function
    const result = await fetchAndTransformPermissions(serviceClient, roleData.id)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: result.status || 500 }
      )
    }

    return NextResponse.json({
      role: roleData,
      permissions: result.permissionsMap
    })
  } catch (error) {
    console.error('Error in GET /api/access-control:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST: Update role permissions (toggle on/off)
 * SECURITY: Only super_admin can modify - they control who can delete accounts and edit access
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/access-control - Request received')
    const supabase = await createAuthenticatedClient()
    
    // Parse request body first
    const body = await request.json()
    const { roleName, resource, action, enabled } = body
    console.log('📝 Request body:', { roleName, resource, action, enabled })
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔑 Session status:', session ? 'Active' : 'None', sessionError ? `Error: ${sessionError.message}` : '')
    
    if (!session) {
      console.warn('❌ No session found for POST request')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in', details: 'No active session' },
        { status: 401 }
      )
    }

    // AUTHORIZATION: Check if user is super_admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', session.user.id)
      .single()

    console.log('👤 User fetched:', user?.email, 'Role:', user?.role)

    if (userError) {
      console.error('❌ Error fetching user role:', userError)
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to verify user role', details: userError.message },
        { status: 500 }
      )
    }

    if (!user || user.role !== 'super_admin') {
      console.warn(`🚫 Unauthorized permission modification by ${user?.email} with role ${user?.role}`)
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins can modify permissions and access levels', userRole: user?.role },
        { status: 403 }
      )
    }
    
    console.log('✅ Authorization passed for', user.email)

    // Validate request body
    if (!roleName || !resource || !action || typeof enabled !== 'boolean') {
      console.error('❌ Invalid request body:', { roleName, resource, action, enabled })
      return NextResponse.json(
        { error: 'Invalid request body. Required: roleName, resource, action, enabled' },
        { status: 400 }
      )
    }

    // Get role ID from database by name using service client to bypass cache
    console.log('🔍 Looking up role:', roleName)
    const serviceClient = createServiceClient()
    let roleData = null
    let roleError = null
    
    // Try direct query first
    const roleResult = await serviceClient
      .from('roles')
      .select('id, name')
      .eq('name', roleName)
      .single()
    
    roleData = roleResult.data
    roleError = roleResult.error

    if (roleError || !roleData) {
      console.error('❌ Role not found in database (direct query):', roleName)
      console.error('❌ Error details:', roleError)
      
      // Fallback: Try using database function to bypass cache
      console.log('🔄 Trying RPC fallback...')
      const { data: roleFromRpc, error: rpcError } = await serviceClient
        .rpc('get_role_by_name', { role_name: roleName })
      
      if (rpcError || !roleFromRpc || roleFromRpc.length === 0) {
        console.error('❌ RPC fallback also failed:', rpcError)
        
        // Provide detailed error for debugging
        const errorDetails = {
          error: 'Role not found in database',
          roleName: roleName,
          postgrestCode: roleError?.code,
          message: roleError?.message,
          hint: 'PostgREST cache may need refresh. Try running: node scripts/reload-postgrest-cache.js',
          availableRoles: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'finance', 'pharmacy', 'lab_technician']
        }
        
        return NextResponse.json(errorDetails, { status: 404 })
      }
      
      // Use role from RPC
      roleData = roleFromRpc[0]
      console.log('✅ Role found via RPC fallback:', roleData.name, 'ID:', roleData.id)
    } else {
      console.log('✅ Role found:', roleData.name, 'ID:', roleData.id)
    }

    // Get permission ID from database by action and resource using service client
    console.log('🔍 Looking up permission:', resource, action)
    const { data: permData, error: permError } = await serviceClient
      .from('permissions')
      .select('id, action, resource')
      .eq('action', action)
      .eq('resource', resource)
      .single()

    if (permError || !permData) {
      console.error('❌ Permission not found:', resource, action, permError)
      
      // Try RPC fallback
      const { data: permFromRpc, error: permRpcError } = await serviceClient
        .rpc('get_permission_by_resource_action', { p_resource: resource, p_action: action })
      
      if (permRpcError || !permFromRpc || permFromRpc.length === 0) {
        console.error('❌ Permission RPC fallback failed:', permRpcError)
        return NextResponse.json(
          { error: 'Permission not found', resource, action, details: permError?.message },
          { status: 404 }
        )
      }
      
      const permDataFromRpc = permFromRpc[0]
      console.log('✅ Permission found via RPC:', permDataFromRpc.resource, permDataFromRpc.action, 'ID:', permDataFromRpc.id)
      
      // Use helper function to toggle permission
      const toggleResult = await togglePermission(
        serviceClient,
        roleData.id,
        permDataFromRpc.id,
        enabled,
        session.user.id
      )

      if (!toggleResult.success) {
        return NextResponse.json(
          { error: `Failed to ${enabled ? 'add' : 'remove'} permission`, details: toggleResult.error?.message },
          { status: 500 }
        )
      }

      console.log('✅ Operation completed successfully')
      return NextResponse.json({
        success: true,
        message: `Permission ${enabled ? 'added' : 'removed'} successfully`,
        data: { role: roleName, resource, action, enabled }
      })
    }
    console.log('✅ Permission found:', permData.resource, permData.action, 'ID:', permData.id)

    // Use helper function to toggle permission
    const toggleResult = await togglePermission(
      serviceClient,
      roleData.id,
      permData.id,
      enabled,
      session.user.id
    )

    if (!toggleResult.success) {
      return NextResponse.json(
        { error: `Failed to ${enabled ? 'add' : 'remove'} permission`, details: toggleResult.error?.message },
        { status: 500 }
      )
    }

    console.log('✅ Operation completed successfully')
    return NextResponse.json({
      success: true,
      message: `Permission ${enabled ? 'added' : 'removed'} successfully`,
      data: { role: roleName, resource, action, enabled }
    })
  } catch (error) {
    console.error('Error in POST /api/access-control:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

