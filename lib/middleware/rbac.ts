/**
 * Practical RBAC Middleware for Production
 * Works with existing users table structure
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// User roles from migration 001_initial_schema.sql
export type UserRole = 
  | 'super_admin'
  | 'hospital_admin'
  | 'receptionist'
  | 'optometrist'
  | 'ophthalmologist'
  | 'technician'
  | 'billing_staff'
  | 'patient'

export interface RBACContext {
  user_id: string
  role: UserRole
  email: string
}

/**
 * Role permission matrix
 */
export const PERMISSIONS: Record<UserRole, {
  patients: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  appointments: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  cases: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  invoices: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  pharmacy: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  employees: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  master_data: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  operations: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  beds: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  certificates: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  discharges: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  revenue: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  attendance: { view: boolean; create: boolean; edit: boolean; delete: boolean }
}> = {
  super_admin: {
    patients: { view: true, create: true, edit: true, delete: true },
    appointments: { view: true, create: true, edit: true, delete: true },
    cases: { view: true, create: true, edit: true, delete: true },
    invoices: { view: true, create: true, edit: true, delete: true },
    pharmacy: { view: true, create: true, edit: true, delete: true },
    employees: { view: true, create: true, edit: true, delete: true },
    master_data: { view: true, create: true, edit: true, delete: true },
    operations: { view: true, create: true, edit: true, delete: true },
    beds: { view: true, create: true, edit: true, delete: true },
    certificates: { view: true, create: true, edit: true, delete: true },
    discharges: { view: true, create: true, edit: true, delete: true },
    revenue: { view: true, create: true, edit: true, delete: true },
    attendance: { view: true, create: true, edit: true, delete: true },
  },
  hospital_admin: {
    patients: { view: true, create: true, edit: true, delete: true },
    appointments: { view: true, create: true, edit: true, delete: true },
    cases: { view: true, create: true, edit: true, delete: true },
    invoices: { view: true, create: true, edit: true, delete: true },
    pharmacy: { view: true, create: true, edit: true, delete: true },
    employees: { view: true, create: true, edit: true, delete: false },
    master_data: { view: true, create: true, edit: true, delete: true },
    operations: { view: true, create: true, edit: true, delete: true },
    beds: { view: true, create: true, edit: true, delete: true },
    certificates: { view: true, create: true, edit: true, delete: true },
    discharges: { view: true, create: true, edit: true, delete: true },
    revenue: { view: true, create: true, edit: true, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
  },
  receptionist: {
    patients: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: false },
    cases: { view: true, create: false, edit: false, delete: false },
    invoices: { view: true, create: true, edit: true, delete: false },
    pharmacy: { view: true, create: false, edit: false, delete: false },
    employees: { view: true, create: false, edit: false, delete: false },
    master_data: { view: true, create: false, edit: false, delete: false },
    operations: { view: true, create: false, edit: false, delete: false },
    beds: { view: true, create: true, edit: true, delete: false },
    certificates: { view: true, create: true, edit: false, delete: false },
    discharges: { view: true, create: false, edit: false, delete: false },
    revenue: { view: false, create: false, edit: false, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
  },
  optometrist: {
    patients: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: false },
    cases: { view: true, create: true, edit: true, delete: false },
    invoices: { view: true, create: false, edit: false, delete: false },
    pharmacy: { view: true, create: false, edit: false, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    master_data: { view: true, create: false, edit: false, delete: false },
    operations: { view: true, create: false, edit: false, delete: false },
    beds: { view: true, create: false, edit: false, delete: false },
    certificates: { view: true, create: true, edit: true, delete: false },
    discharges: { view: true, create: false, edit: false, delete: false },
    revenue: { view: false, create: false, edit: false, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
  },
  ophthalmologist: {
    patients: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: false },
    cases: { view: true, create: true, edit: true, delete: false },
    invoices: { view: true, create: true, edit: true, delete: false },
    pharmacy: { view: true, create: false, edit: false, delete: false },
    employees: { view: true, create: false, edit: false, delete: false },
    master_data: { view: true, create: true, edit: true, delete: false },
    operations: { view: true, create: true, edit: true, delete: false },
    beds: { view: true, create: true, edit: true, delete: false },
    certificates: { view: true, create: true, edit: true, delete: false },
    discharges: { view: true, create: true, edit: true, delete: false },
    revenue: { view: false, create: false, edit: false, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
  },
  technician: {
    patients: { view: true, create: false, edit: false, delete: false },
    appointments: { view: true, create: false, edit: false, delete: false },
    cases: { view: true, create: false, edit: true, delete: false },
    invoices: { view: false, create: false, edit: false, delete: false },
    pharmacy: { view: true, create: false, edit: false, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    master_data: { view: true, create: false, edit: false, delete: false },
    operations: { view: true, create: false, edit: false, delete: false },
    beds: { view: true, create: false, edit: false, delete: false },
    certificates: { view: false, create: false, edit: false, delete: false },
    discharges: { view: false, create: false, edit: false, delete: false },
    revenue: { view: false, create: false, edit: false, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
  },
  billing_staff: {
    patients: { view: true, create: false, edit: false, delete: false },
    appointments: { view: true, create: false, edit: false, delete: false },
    cases: { view: true, create: false, edit: false, delete: false },
    invoices: { view: true, create: true, edit: true, delete: false },
    pharmacy: { view: true, create: false, edit: true, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    master_data: { view: true, create: false, edit: false, delete: false },
    operations: { view: false, create: false, edit: false, delete: false },
    beds: { view: true, create: false, edit: false, delete: false },
    certificates: { view: false, create: false, edit: false, delete: false },
    discharges: { view: false, create: false, edit: false, delete: false },
    revenue: { view: true, create: true, edit: true, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
  },
  patient: {
    patients: { view: false, create: false, edit: false, delete: false },
    appointments: { view: false, create: false, edit: false, delete: false },
    cases: { view: false, create: false, edit: false, delete: false },
    invoices: { view: false, create: false, edit: false, delete: false },
    pharmacy: { view: false, create: false, edit: false, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    master_data: { view: false, create: false, edit: false, delete: false },
    operations: { view: false, create: false, edit: false, delete: false },
    beds: { view: false, create: false, edit: false, delete: false },
    certificates: { view: false, create: false, edit: false, delete: false },
    discharges: { view: false, create: false, edit: false, delete: false },
    revenue: { view: false, create: false, edit: false, delete: false },
    attendance: { view: false, create: false, edit: false, delete: false },
  },
}

/**
 * Get user role from database
 */
export async function getUserContext(): Promise<RBACContext | null> {
  try {
    const supabase = createClient()
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

    return {
      user_id: user.id,
      role: user.role as UserRole,
      email: user.email
    }
  } catch (error) {
    console.error('Error in getUserContext:', error)
    return null
  }
}

/**
 * Check if user has permission for resource and action
 */
export function hasPermission(
  role: UserRole,
  resource: keyof typeof PERMISSIONS[UserRole],
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  const permissions = PERMISSIONS[role]
  if (!permissions || !permissions[resource]) {
    return false
  }
  return permissions[resource][action]
}

/**
 * Middleware: Check permission and return 403 if not authorized
 */
export async function requirePermission(
  resource: keyof typeof PERMISSIONS[UserRole],
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<{ authorized: true; context: RBACContext } | { authorized: false; response: NextResponse }> {
  const context = await getUserContext()

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
 * Helper: Check if user is admin (super_admin or hospital_admin)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'super_admin' || role === 'hospital_admin'
}

/**
 * Helper: Check if user is medical professional
 */
export function isMedicalProfessional(role: UserRole): boolean {
  return ['optometrist', 'ophthalmologist', 'technician'].includes(role)
}

/**
 * Helper: Check if user has financial access
 */
export function hasFinancialAccess(role: UserRole): boolean {
  return ['super_admin', 'hospital_admin', 'billing_staff'].includes(role)
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
