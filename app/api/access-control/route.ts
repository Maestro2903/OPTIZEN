import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// Force dynamic rendering to prevent static analysis issues with cookies()
export const dynamic = 'force-dynamic'

/**
 * Type-safe wrappers for database RPC calls not yet in generated types
 */
type RoleResult = { id: string; name: string; description: string | null }
type PermissionResult = { id: string; action: string; resource: string }

async function callGetRoleByName(client: SupabaseClient, roleName: string): Promise<{
  data: RoleResult[] | null
  error: unknown
}> {
  const result = await client.rpc('get_role_by_name', { role_name: roleName })
  return {
    data: result.data as RoleResult[] | null,
    error: result.error
  }
}

async function callGetPermissionByResourceAction(
  client: SupabaseClient, 
  resource: string, 
  action: string
): Promise<{
  data: PermissionResult[] | null
  error: unknown
}> {
  const result = await client.rpc('get_permission_by_resource_action', { 
    p_resource: resource, 
    p_action: action 
  })
  return {
    data: result.data as PermissionResult[] | null,
    error: result.error
  }
}

/**
 * Helper function to fetch and transform permissions for a role
 */
async function fetchAndTransformPermissions(serviceClient: SupabaseClient, roleId: string) {
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
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const roleName = searchParams.get('role')
    logger.info('GET /api/access-control request', {
      request_id: requestId,
      endpoint: '/api/access-control',
      role: roleName
    })
    
    const supabase = await createAuthenticatedClient()
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    logger.debug('Session status check', {
      request_id: requestId,
      endpoint: '/api/access-control',
      has_session: !!session,
      session_error: sessionError?.message
    })
    
    if (!session) {
      logger.warn('No session found for access-control request', {
        request_id: requestId,
        endpoint: '/api/access-control'
      })
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

    logger.debug('User fetched for authorization', {
      request_id: requestId,
      endpoint: '/api/access-control',
      user_email: user?.email,
      user_role: user?.role,
      user_error: userError?.message
    })

    if (userError) {
      logger.error('Error fetching user role', userError, {
        request_id: requestId,
        endpoint: '/api/access-control',
        user_id: session.user.id
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to verify user role', details: userError.message },
        { status: 500 }
      )
    }

    if (!user || user.role !== 'super_admin') {
      logger.warn('Access denied for non-super-admin user', {
        request_id: requestId,
        endpoint: '/api/access-control',
        user_email: user?.email,
        user_role: user?.role
      })
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins can access permission management', userRole: user?.role },
        { status: 403 }
      )
    }
    
    logger.debug('Authorization passed', {
      request_id: requestId,
      endpoint: '/api/access-control',
      user_email: user.email,
      user_id: user.id
    })

    // Validate role parameter
    if (!roleName) {
      logger.warn('Missing role parameter in GET request', {
        request_id: requestId,
        endpoint: '/api/access-control',
        user_id: user.id
      })
      return NextResponse.json(
        { error: 'Role parameter is required', hint: 'Add ?role=<role_name> to the URL' },
        { status: 400 }
      )
    }

    // Fetch role by name using service client to bypass PostgREST cache
    // This is critical for access control to work properly
    const serviceClient = createServiceClient()
    
    type RoleData = {
      id: string
      name: string
      description: string | null
    }
    
    const { data: roleData, error: roleError } = await serviceClient
      .from('roles')
      .select('id, name, description')
      .eq('name', roleName)
      .single<RoleData>()

    if (roleError || !roleData) {
      logger.warn('Role not found in direct query', {
        request_id: requestId,
        endpoint: '/api/access-control',
        user_id: user.id,
        role_name: roleName,
        error: roleError?.message
      })
      
      // Fallback: Try using database function to bypass cache
      const { data: roleFromRpc, error: rpcError } = await callGetRoleByName(serviceClient, roleName)
      
      if (rpcError || !roleFromRpc || roleFromRpc.length === 0) {
        logger.error('RPC fallback also failed', rpcError, {
          request_id: requestId,
          endpoint: '/api/access-control',
          user_id: user.id,
          role_name: roleName,
          available_roles: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'finance', 'pharmacy', 'lab_technician']
        })
        return NextResponse.json(
          { 
            error: 'Role not found in database', 
            roleName,
            availableRoles: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'finance', 'pharmacy', 'lab_technician'],
            hint: 'PostgREST cache may need refresh. Try running: node scripts/reload-postgrest-cache.js'
          },
          { status: 404 }
        )
      }
      
      // Use the role from RPC
      const roleDataFromRpc = roleFromRpc[0]
      logger.debug('Role found via RPC fallback', {
        request_id: requestId,
        endpoint: '/api/access-control',
        user_id: user.id,
        role_name: roleDataFromRpc.name
      })
      
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
    // Use helper function to fetch and transform permissions
    const result = await fetchAndTransformPermissions(serviceClient, roleData.id)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: result.status || 500 }
      )
    }

    const duration = Date.now() - startTime
    logger.requestComplete('GET', '/api/access-control', 200, duration, requestId, {
      user_id: user.id,
      role_name: roleName
    })

    return NextResponse.json({
      role: roleData,
      permissions: result.permissionsMap
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.error('Error in GET /api/access-control', error, {
      request_id: requestId,
      endpoint: '/api/access-control',
      duration_ms: duration
    })
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error?.message,
        hint: 'Check server logs for more details'
      },
      { status: 500 }
    )
  }
}

/**
 * POST: Update role permissions (toggle on/off)
 * SECURITY: Only super_admin can modify - they control who can delete accounts and edit access
 */
export async function POST(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()

  try {
    logger.info('POST /api/access-control request', {
      request_id: requestId,
      endpoint: '/api/access-control',
      url: request.url
    })
    const supabase = await createAuthenticatedClient()
    
    // Parse request body first
    const body = await request.json()
    const { roleName, resource, action, enabled } = body
    logger.info('Access control modification request', {
      request_id: requestId,
      endpoint: '/api/access-control',
      role_name: roleName,
      resource,
      action,
      enabled
    })
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    logger.debug('Session status check', {
      request_id: requestId,
      endpoint: '/api/access-control',
      has_session: !!session,
      session_error: sessionError?.message
    })
    
    if (!session) {
      logger.warn('No session found for POST request', {
        request_id: requestId,
        endpoint: '/api/access-control'
      })
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

    logger.debug('User fetched for authorization', {
      request_id: requestId,
      endpoint: '/api/access-control',
      user_email: user?.email,
      user_role: user?.role
    })

    if (userError) {
      logger.error('Error fetching user role', userError, {
        request_id: requestId,
        endpoint: '/api/access-control',
        user_id: session.user.id
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to verify user role', details: userError.message },
        { status: 500 }
      )
    }

    if (!user || user.role !== 'super_admin') {
      logger.warn('Unauthorized permission modification attempt', {
        request_id: requestId,
        endpoint: '/api/access-control',
        user_email: user?.email,
        user_role: user?.role
      })
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins can modify permissions and access levels', userRole: user?.role },
        { status: 403 }
      )
    }
    
    logger.debug('Authorization passed', {
      request_id: requestId,
      endpoint: '/api/access-control',
      user_email: user.email,
      user_id: user.id
    })

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
    
    // Try direct query first
    type RoleQueryResult = { id: string; name: string }
    const roleResult = await serviceClient
      .from('roles')
      .select('id, name')
      .eq('name', roleName)
      .single<RoleQueryResult>()
    
    let finalRoleData: { id: string; name: string; description?: string | null } | null = null

    if (roleResult.error || !roleResult.data) {
      console.error('❌ Role not found in database (direct query):', roleName)
      console.error('❌ Error details:', roleResult.error)
      
      // Fallback: Try using database function to bypass cache
      console.log('🔄 Trying RPC fallback...')
      const { data: roleFromRpc, error: rpcError } = await callGetRoleByName(serviceClient, roleName)
      
      if (rpcError || !roleFromRpc || roleFromRpc.length === 0) {
        console.error('❌ RPC fallback also failed:', rpcError)
        
        // Provide detailed error for debugging
        console.error('❌ Role not found - requested:', roleName)
        console.error('💡 Available roles: super_admin, admin, doctor, nurse, receptionist, finance, pharmacy, lab_technician')
        const errorDetails = {
          error: 'Role not found in database',
          roleName: roleName,
          postgrestCode: roleResult.error?.code,
          message: roleResult.error?.message,
          hint: 'PostgREST cache may need refresh. Try running: node scripts/reload-postgrest-cache.js',
          availableRoles: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'finance', 'pharmacy', 'lab_technician'],
          troubleshooting: {
            step1: 'Verify the role exists in the database',
            step2: 'Run: node scripts/reload-postgrest-cache.js',
            step3: 'Restart the Next.js development server',
            step4: 'Check Supabase connection and credentials'
          }
        }
        
        return NextResponse.json(errorDetails, { status: 404 })
      }
      
      // Use role from RPC
      finalRoleData = roleFromRpc[0]
      console.log('✅ Role found via RPC fallback:', finalRoleData.name, 'ID:', finalRoleData.id)
    } else {
      finalRoleData = roleResult.data
      console.log('✅ Role found:', finalRoleData.name, 'ID:', finalRoleData.id)
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
      const { data: permFromRpc, error: permRpcError } = await callGetPermissionByResourceAction(
        serviceClient, 
        resource, 
        action
      )
      
      if (permRpcError || !permFromRpc || permFromRpc.length === 0) {
        console.error('❌ Permission RPC fallback failed:', permRpcError)
        console.error('❌ Requested permission:', { resource, action })
        return NextResponse.json(
          { 
            error: 'Permission not found', 
            resource, 
            action, 
            details: permError?.message,
            hint: 'This permission may not exist in the database. Check the permissions table.'
          },
          { status: 404 }
        )
      }
      
      const permDataFromRpc = permFromRpc[0]
      console.log('✅ Permission found via RPC:', permDataFromRpc.resource, permDataFromRpc.action, 'ID:', permDataFromRpc.id)
      
      // Use helper function to toggle permission
      const toggleResult = await togglePermission(
        serviceClient,
        finalRoleData.id,
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
    } else {
      // Handle successful permission lookup (no error)
      // TypeScript type guard: permData is confirmed to exist here
      const confirmedPermData = permData as { id: string; action: string; resource: string }
      console.log('✅ Permission found:', confirmedPermData.resource, confirmedPermData.action, 'ID:', confirmedPermData.id)
      
      // Use helper function to toggle permission
      const toggleResult = await togglePermission(
        serviceClient,
        finalRoleData.id,
        confirmedPermData.id,
        enabled,
        session.user.id
      )

      if (!toggleResult.success) {
        return NextResponse.json(
          { error: `Failed to ${enabled ? 'add' : 'remove'} permission`, details: toggleResult.error?.message },
          { status: 500 }
        )
      }

      const duration = Date.now() - startTime
      logger.requestComplete('POST', '/api/access-control', 200, duration, requestId, {
        user_id: user.id,
        role_name: roleName,
        resource,
        action,
        enabled
      })
      return NextResponse.json({
        success: true,
        message: `Permission ${enabled ? 'added' : 'removed'} successfully`,
        data: { role: roleName, resource, action, enabled }
      })
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.error('Error in POST /api/access-control', error, {
      request_id: requestId,
      endpoint: '/api/access-control',
      duration_ms: duration
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message,
        hint: 'Check server logs for more details. Ensure database connection is working.'
      },
      { status: 500 }
    )
  }
}

