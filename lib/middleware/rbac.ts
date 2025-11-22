/**
 * Practical RBAC Middleware for Production
 * Works with existing users table structure
 */

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  UserRole, 
  isUserRole, 
  PERMISSIONS, 
  hasPermission, 
  hasModuleAccess, 
  isAdmin,
  isMedicalProfessional,
  hasFinancialAccess
} from '@/lib/rbac-client'

// Re-export for convenience
export type { UserRole }
export { isUserRole, PERMISSIONS, hasPermission, hasModuleAccess, isAdmin, isMedicalProfessional, hasFinancialAccess }

export interface RBACContext {
  user_id: string
  role: UserRole
  email: string
}

/**
 * Get user role from database with runtime validation
 * Uses createAuthenticatedClient to ensure cookie-based authentication works properly
 */
export async function getUserContext(): Promise<RBACContext | null> {
  try {
    const supabase = await createAuthenticatedClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', session.user.id)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      console.error('Error fetching user:', error)
      return null
    }

    // Runtime validation of user role
    if (!isUserRole(user.role)) {
      console.error('Invalid user role from database - session:', session.user.id.substring(0, 8) + '...')
      return null
    }

    return {
      user_id: user.id,
      role: user.role,
      email: user.email
    }
  } catch (error) {
    console.error('Error in getUserContext:', error)
    return null
  }
}

/**
 * Middleware: Check permission and return 403 if not authorized
 * 
 * DEVELOPMENT MODE: When NODE_ENV !== 'production' and no user is authenticated,
 * bypass RBAC checks and use a mock super_admin context for testing.
 */
export async function requirePermission(
  resource: keyof typeof PERMISSIONS[UserRole],
  action: 'view' | 'create' | 'print' | 'edit' | 'delete'
): Promise<{ authorized: true; context: RBACContext } | { authorized: false; response: NextResponse }> {
  const context = await getUserContext()

  // DEVELOPMENT MODE BYPASS: Allow testing without authentication
  // Remove this block when deploying to production!
  if (!context && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  RBAC BYPASS ACTIVE: Using mock super_admin for development testing')
    const mockContext: RBACContext = {
      user_id: 'ad420082-0897-438a-bdf8-93731c09b93f', // Use existing superadmin user for dev
      role: 'super_admin',
      email: 'superadmin@eyecare.local'
    }
    return { authorized: true, context: mockContext }
  }

  if (!context) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Not authenticated' },
        { status: 401 }
      )
    }
  }

  const authorized = hasPermission(context.role, resource, action)

  if (!authorized) {
    return {
      authorized: false,
      response: NextResponse.json(
        { 
          error: `Forbidden: Insufficient permissions to ${action} ${resource}`,
          required_permission: `${resource}:${action}`,
          user_role: context.role
        },
        { status: 403 }
      )
    }
  }

  return { authorized: true, context }
}

/**
 * Ownership check: User can access their own created resources
 */
export function canAccessByOwnership(
  userId: string,
  resourceCreatorId: string | null
): boolean {
  return userId === resourceCreatorId
}

/**
 * Usage in API routes:
 * 
 * // At the start of GET handler
 * const authCheck = await requirePermission('patients', 'view')
 * if (!authCheck.authorized) return authCheck.response
 * const { context } = authCheck
 * 
 * // At the start of POST handler
 * const authCheck = await requirePermission('patients', 'create')
 * if (!authCheck.authorized) return authCheck.response
 * 
 * // At the start of PUT/PATCH handler
 * const authCheck = await requirePermission('patients', 'edit')
 * if (!authCheck.authorized) return authCheck.response
 * 
 * // At the start of DELETE handler  
 * const authCheck = await requirePermission('patients', 'delete')
 * if (!authCheck.authorized) return authCheck.response
 * 
 * // For ownership check
 * if (!isAdmin(context.role) && !canAccessByOwnership(context.user_id, resource.created_by)) {
 *   return NextResponse.json({ error: 'Forbidden: You can only access your own resources' }, { status: 403 })
 * }
 */
