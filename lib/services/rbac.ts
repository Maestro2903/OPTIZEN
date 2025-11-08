/**
 * Role-Based Access Control (RBAC) Service
 * Comprehensive authorization system for healthcare compliance
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'

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

export class RBACService {
  private supabase

  constructor(isClient = false) {
    this.supabase = isClient ? createClientClient() : createClient()
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await this.supabase
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
      console.error('Error fetching user roles:', error)
      return []
    }

    return data || []
  }

  /**
   * Get all permissions for a user (through their roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const { data, error } = await this.supabase
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
      console.error('Error fetching user permissions:', error)
      return []
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
   */
  async hasPermission(
    userId: string,
    action: string,
    resource: string,
    scope?: { type?: string; id?: string }
  ): Promise<boolean> {
    try {
      // Get user roles with scope consideration
      const { data: userRoles, error } = await this.supabase
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
        console.error('Error checking permission:', error)
        return false
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
    } catch (error) {
      console.error('Error in hasPermission:', error)
      return false
    }
  }

  /**
   * Get comprehensive user authorization data
   */
  async getUserAuthorization(userId: string): Promise<UserPermissions> {
    const [roles, permissions] = await Promise.all([
      this.getUserRoles(userId),
      this.getUserPermissions(userId)
    ])

    return {
      roles,
      permissions,
      hasPermission: async (action: string, resource: string, scope?: { type?: string; id?: string }) => {
        return this.hasPermission(userId, action, resource, scope)
      }
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    scope?: { type?: string; id?: string },
    expiresAt?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: roleId,
          scope_type: scope?.type || 'global',
          scope_id: scope?.id,
          created_by: assignedBy,
          expires_at: expiresAt
        }])
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the role assignment for audit
      await this.logAuditEvent(assignedBy, 'role_assigned', 'user_roles', data.id, {
        target_user_id: userId,
        role_id: roleId,
        scope: scope
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(
    userId: string,
    roleId: string,
    removedBy: string,
    scope?: { type?: string; id?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let query = this.supabase
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
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role:roles!inner(name)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('role.name', roleNames)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (error) {
      console.error('Error checking roles:', error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching roles:', error)
      return []
    }

    return data || []
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await this.supabase
      .from('permissions')
      .select('*')
      .eq('is_active', true)
      .order('resource', { ascending: true })
      .order('action', { ascending: true })

    if (error) {
      console.error('Error fetching permissions:', error)
      return []
    }

    return data || []
  }

  /**
   * Log audit events for RBAC changes
   */
  private async logAuditEvent(
    userId: string,
    action: string,
    table: string,
    recordId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('audit_logs')
        .insert([{
          user_id: userId,
          action,
          table_name: table,
          record_id: recordId,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        }])
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }
}

// Singleton instance for server-side usage
export const rbacService = new RBACService()

// Factory function for client-side usage
export const createRBACService = () => new RBACService(true)

/**
 * Middleware helper for checking permissions in API routes
 */
export async function requirePermission(
  userId: string,
  action: string,
  resource: string,
  scope?: { type?: string; id?: string }
): Promise<{ authorized: boolean; error?: string }> {
  const hasPermission = await rbacService.hasPermission(userId, action, resource, scope)

  if (!hasPermission) {
    return {
      authorized: false,
      error: `Insufficient permissions: ${action} on ${resource}`
    }
  }

  return { authorized: true }
}

/**
 * Helper to check if user has admin access
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return rbacService.hasAnyRole(userId, ['super_admin', 'admin'])
}

/**
 * Helper to check if user has medical professional access
 */
export async function isMedicalProfessional(userId: string): Promise<boolean> {
  return rbacService.hasAnyRole(userId, ['doctor', 'nurse', 'lab_technician'])
}

/**
 * Helper to check if user has financial access
 */
export async function hasFinancialAccess(userId: string): Promise<boolean> {
  return rbacService.hasAnyRole(userId, ['super_admin', 'admin', 'finance', 'manager'])
}