/**
 * Role-Based Access Control (RBAC) Service
 * Comprehensive authorization system for healthcare compliance
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Role {
  id: string
  name: string
  description?: string
  is_active: boolean
}

export interface Permission {
  id: string
  action: string
  resource: string
  description?: string
  is_active: boolean
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  scope_type: string
  scope_id?: string
  is_active: boolean
  expires_at?: string
  role: Role
}

export interface UserPermissions {
  roles: UserRole[]
  permissions: Permission[]
  hasPermission: (action: string, resource: string, scope?: { type?: string; id?: string }) => Promise<boolean>
}

// Valid scope types for role assignments
const VALID_SCOPE_TYPES = ['global', 'hospital', 'department', 'team'] as const
type ScopeType = typeof VALID_SCOPE_TYPES[number]

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validation helpers
 */
function validateUUID(value: string, fieldName: string): void {
  if (!UUID_REGEX.test(value)) {
    throw new Error(`Invalid ${fieldName} format: must be a valid UUID`)
  }
}

function validateRequired(value: any, fieldName: string): void {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new Error(`${fieldName} is required`)
  }
}

function validateScopeType(scopeType: string): void {
  if (!VALID_SCOPE_TYPES.includes(scopeType as ScopeType)) {
    throw new Error(`Invalid scope type: must be one of ${VALID_SCOPE_TYPES.join(', ')}`)
  }
}

/**
 * RBAC Service - No longer stores persistent client
 * Pass Supabase client to each method or use factory
 */
export class RBACService {
  // No persistent client stored
  constructor() {
    // Constructor intentionally empty
  }

  /**
   * Create a Supabase client for this request
   */
  private getClient(isClient = false): SupabaseClient {
    return isClient ? createClientClient() : createClient()
  }

  /**
   * Get all roles for a user
   * @throws Error if database query fails or validation fails
   */
  async getUserRoles(userId: string, isClient = false): Promise<UserRole[]> {
    // Validate input
    validateRequired(userId, 'userId')
    validateUUID(userId, 'userId')

    const supabase = this.getClient(isClient)
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles (
          id,
          name,
          description,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (error) {
      throw new Error(`Failed to fetch user roles: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all permissions for a user (through their roles)
   * @throws Error if database query fails or validation fails
   */
  async getUserPermissions(userId: string, isClient = false): Promise<Permission[]> {
    // Validate input
    validateRequired(userId, 'userId')
    validateUUID(userId, 'userId')

    const supabase = this.getClient(isClient)
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_permissions (
          permission:permissions (
            id,
            action,
            resource,
            description,
            is_active
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (error) {
      throw new Error(`Failed to fetch user permissions: ${error.message}`)
    }

    // Flatten the permissions array
    const permissions: Permission[] = []
    data?.forEach(userRole => {
      userRole.role_permissions?.forEach((rp: any) => {
        if (rp.permission && rp.permission.is_active) {
          permissions.push(rp.permission)
        }
      })
    })

    // Remove duplicates
    const uniquePermissions = permissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    )

    return uniquePermissions
  }

  /**
   * Check if user has specific permission
   * @throws Error if database query fails or validation fails
   * Returns false only for legitimate permission denials, not errors
   */
  async hasPermission(
    userId: string,
    action: string,
    resource: string,
    scope?: { type?: string; id?: string },
    isClient = false
  ): Promise<boolean> {
    // Validate inputs
    validateRequired(userId, 'userId')
    validateUUID(userId, 'userId')
    validateRequired(action, 'action')
    validateRequired(resource, 'resource')

    if (scope?.type) {
      validateScopeType(scope.type)
      if (scope.id) {
        validateUUID(scope.id, 'scope.id')
      }
    }

    const supabase = this.getClient(isClient)
    
    // Get user roles with scope consideration
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles!inner (
          id,
          name,
          is_active,
          role_permissions!inner (
            permission:permissions!inner (
              action,
              resource,
              is_active
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('role.is_active', true)
      .eq('role.role_permissions.permission.action', action)
      .eq('role.role_permissions.permission.resource', resource)
      .eq('role.role_permissions.permission.is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (error) {
      throw new Error(`Failed to check permission: ${error.message}`)
    }

    if (!userRoles || userRoles.length === 0) {
      return false
    }

    // If scope is specified, check scope matching
    if (scope?.type) {
      const hasMatchingScope = userRoles.some(userRole =>
        userRole.scope_type === scope.type &&
        (scope.id ? userRole.scope_id === scope.id : true)
      )
      if (!hasMatchingScope) {
        return false
      }
    }

    return true
  }

  /**
   * Get comprehensive user authorization data
   * @throws Error if database query fails or validation fails
   */
  async getUserAuthorization(userId: string, isClient = false): Promise<UserPermissions> {
    // Validate input
    validateRequired(userId, 'userId')
    validateUUID(userId, 'userId')

    const [roles, permissions] = await Promise.all([
      this.getUserRoles(userId, isClient),
      this.getUserPermissions(userId, isClient)
    ])

    return {
      roles,
      permissions,
      hasPermission: async (action: string, resource: string, scope?: { type?: string; id?: string }) => {
        return this.hasPermission(userId, action, resource, scope, isClient)
      }
    }
  }

  /**
   * Assign role to user with comprehensive validation
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    scope?: { type?: string; id?: string },
    expiresAt?: string,
    isClient = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      validateRequired(userId, 'userId')
      validateRequired(roleId, 'roleId')
      validateRequired(assignedBy, 'assignedBy')
      validateUUID(userId, 'userId')
      validateUUID(roleId, 'roleId')
      validateUUID(assignedBy, 'assignedBy')

      const scopeType = scope?.type || 'global'
      validateScopeType(scopeType)

      if (scope?.id) {
        validateUUID(scope.id, 'scope.id')
      }

      const supabase = this.getClient(isClient)

      // Pre-insert validation: Check if role exists and is active
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id, is_active')
        .eq('id', roleId)
        .single()

      if (roleError || !roleData) {
        return { success: false, error: 'Role not found' }
      }

      if (!roleData.is_active) {
        return { success: false, error: 'Cannot assign inactive role' }
      }

      // Check for existing assignment
      const { data: existingAssignment } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('scope_type', scopeType)
        .eq('is_active', true)
        .maybeSingle()

      if (existingAssignment) {
        return { success: false, error: 'Role already assigned to user with this scope' }
      }

      // Insert the role assignment
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: roleId,
          scope_type: scopeType,
          scope_id: scope?.id,
          created_by: assignedBy,
          expires_at: expiresAt
        }])
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the role assignment for audit (after successful insert)
      await this.logAuditEvent(assignedBy, 'role_assigned', 'user_roles', data.id, {
        target_user_id: userId,
        role_id: roleId,
        scope: scope
      }, isClient)

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Remove role from user with validation
   */
  async removeRole(
    userId: string,
    roleId: string,
    removedBy: string,
    scope?: { type?: string; id?: string },
    isClient = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      validateRequired(userId, 'userId')
      validateRequired(roleId, 'roleId')
      validateRequired(removedBy, 'removedBy')
      validateUUID(userId, 'userId')
      validateUUID(roleId, 'roleId')
      validateUUID(removedBy, 'removedBy')

      if (scope?.type) {
        validateScopeType(scope.type)
        if (scope.id) {
          validateUUID(scope.id, 'scope.id')
        }
      }

      const supabase = this.getClient(isClient)
      let query = supabase
        .from('user_roles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('role_id', roleId)

      if (scope?.type) {
        query = query.eq('scope_type', scope.type)
        if (scope.id) {
          query = query.eq('scope_id', scope.id)
        }
      }

      const { data, error } = await query.select().single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the role removal for audit
      await this.logAuditEvent(removedBy, 'role_removed', 'user_roles', data.id, {
        target_user_id: userId,
        role_id: roleId,
        scope: scope
      }, isClient)

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Check if user has any of the specified roles
   * @throws Error if database query fails or validation fails
   */
  async hasAnyRole(userId: string, roleNames: string[], isClient = false): Promise<boolean> {
    // Validate inputs
    validateRequired(userId, 'userId')
    validateUUID(userId, 'userId')
    
    if (!roleNames || roleNames.length === 0) {
      throw new Error('roleNames array cannot be empty')
    }

    const supabase = this.getClient(isClient)
    const { data, error } = await supabase
      .from('user_roles')
      .select('role:roles!inner(name)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('role.name', roleNames)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (error) {
      throw new Error(`Failed to check roles: ${error.message}`)
    }

    return data && data.length > 0
  }

  /**
   * Get all available roles
   * @throws Error if database query fails
   */
  async getAllRoles(isClient = false): Promise<Role[]> {
    const supabase = this.getClient(isClient)
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all available permissions
   * @throws Error if database query fails
   */
  async getAllPermissions(isClient = false): Promise<Permission[]> {
    const supabase = this.getClient(isClient)
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('is_active', true)
      .order('resource', { ascending: true })
      .order('action', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Log audit events for RBAC changes
   * @throws Error if audit logging fails (critical for compliance)
   */
  private async logAuditEvent(
    userId: string,
    action: string,
    table: string,
    recordId: string,
    metadata?: any,
    isClient = false
  ): Promise<void> {
    const supabase = this.getClient(isClient)
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action,
        table_name: table,
        record_id: recordId,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      }])

    if (error) {
      // Audit logging failures are critical - rethrow
      throw new Error(`Critical: Failed to log audit event: ${error.message}`)
    }
  }
}

/**
 * Factory function to create RBAC service instance
 * No singleton - create per request for proper Next.js isolation
 */
export function createRBACService(): RBACService {
  return new RBACService()
}

// For backward compatibility, export a default instance
// WARNING: For production, use createRBACService() per request instead
export const rbacService = createRBACService()

/**
 * Middleware helper for checking permissions in API routes
 */
export async function requirePermission(
  userId: string,
  action: string,
  resource: string,
  scope?: { type?: string; id?: string }
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const service = createRBACService()
    const hasPermission = await service.hasPermission(userId, action, resource, scope)

    if (!hasPermission) {
      return {
        authorized: false,
        error: `Insufficient permissions: ${action} on ${resource}`
      }
    }

    return { authorized: true }
  } catch (error) {
    // Propagate DB errors as authorization failures
    return {
      authorized: false,
      error: `Authorization check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Helper to check if user has admin access
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const service = createRBACService()
    return await service.hasAnyRole(userId, ['super_admin', 'admin'])
  } catch {
    return false
  }
}

/**
 * Helper to check if user has medical professional access
 */
export async function isMedicalProfessional(userId: string): Promise<boolean> {
  try {
    const service = createRBACService()
    return await service.hasAnyRole(userId, ['doctor', 'nurse', 'lab_technician'])
  } catch {
    return false
  }
}

/**
 * Helper to check if user has financial access
 */
export async function hasFinancialAccess(userId: string): Promise<boolean> {
  try {
    const service = createRBACService()
    return await service.hasAnyRole(userId, ['super_admin', 'admin', 'finance', 'manager'])
  } catch {
    return false
  }
}