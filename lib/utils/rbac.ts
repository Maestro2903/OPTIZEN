// Role-Based Access Control Utilities
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist' | 'patient'

export interface UserRoleData {
  user_id: string
  role: UserRole
  can_view_all_patients: boolean
  can_edit_all_patients: boolean
  can_delete_patients: boolean
  can_view_all_appointments: boolean
  can_edit_all_appointments: boolean
  can_cancel_appointments: boolean
  can_view_all_cases: boolean
  can_edit_all_cases: boolean
  can_edit_master_data: boolean
  can_delete_master_data: boolean
  can_manage_employees: boolean
  can_delete_employees: boolean
  can_view_financial_data: boolean
  can_edit_invoices: boolean
  can_manage_pharmacy: boolean
  permissions: Record<string, any>
}

/**
 * Get user role and permissions
 */
export async function getUserRole(userId: string): Promise<UserRoleData | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // User has no role assigned, treat as patient by default
        return null
      }
      console.error('Error fetching user role:', error)
      return null
    }

    return data as UserRoleData
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role?.role === 'admin'
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: keyof Omit<UserRoleData, 'user_id' | 'role' | 'permissions'>
): Promise<boolean> {
  const role = await getUserRole(userId)
  if (!role) return false
  
  // Admins have all permissions
  if (role.role === 'admin') return true
  
  // Check specific permission
  return role[permission] === true
}

/**
 * Check if user can access resource based on ownership
 */
export function canAccessByOwnership(
  userId: string,
  resourceCreatorId: string | null,
  resourcePatientId?: string | null,
  resourceDoctorId?: string | null
): boolean {
  return (
    userId === resourceCreatorId ||
    userId === resourcePatientId ||
    userId === resourceDoctorId
  )
}

/**
 * Check if user can access appointment
 */
export async function canAccessAppointment(
  userId: string,
  appointment: {
    created_by: string | null
    patient_id: string | null
    doctor_id: string | null
  }
): Promise<boolean> {
  // Check ownership first
  if (canAccessByOwnership(
    userId,
    appointment.created_by,
    appointment.patient_id,
    appointment.doctor_id
  )) {
    return true
  }

  // Check if user is admin or has view_all_appointments permission
  const role = await getUserRole(userId)
  if (role?.role === 'admin' || role?.can_view_all_appointments) {
    return true
  }

  return false
}

/**
 * Check if user can edit appointment
 */
export async function canEditAppointment(
  userId: string,
  appointment: {
    created_by: string | null
    patient_id: string | null
    doctor_id: string | null
  }
): Promise<boolean> {
  // Check ownership first
  if (canAccessByOwnership(
    userId,
    appointment.created_by,
    appointment.patient_id,
    appointment.doctor_id
  )) {
    return true
  }

  // Check if user has permission
  return await hasPermission(userId, 'can_edit_all_appointments')
}

/**
 * Check if user can access patient
 */
export async function canAccessPatient(
  userId: string,
  patientCreatorId: string | null
): Promise<boolean> {
  // Check ownership
  if (userId === patientCreatorId) {
    return true
  }

  // Check permissions
  const role = await getUserRole(userId)
  if (role?.role === 'admin' || role?.can_view_all_patients) {
    return true
  }

  // Check if user is a doctor/nurse (can view patients)
  if (role?.role === 'doctor' || role?.role === 'nurse') {
    return true
  }

  return false
}

/**
 * Check if user can edit patient
 */
export async function canEditPatient(
  userId: string,
  patientCreatorId: string | null
): Promise<boolean> {
  // Check ownership
  if (userId === patientCreatorId) {
    return true
  }

  // Check permissions
  return await hasPermission(userId, 'can_edit_all_patients')
}

/**
 * Check if user can access case
 */
export async function canAccessCase(
  userId: string,
  caseCreatorId: string | null
): Promise<boolean> {
  // Check ownership
  if (userId === caseCreatorId) {
    return true
  }

  // Check permissions
  return await hasPermission(userId, 'can_view_all_cases')
}

/**
 * Check if user can edit case
 */
export async function canEditCase(
  userId: string,
  caseCreatorId: string | null
): Promise<boolean> {
  // Check ownership
  if (userId === caseCreatorId) {
    return true
  }

  // Check permissions
  return await hasPermission(userId, 'can_edit_all_cases')
}

/**
 * Default role permissions
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Partial<UserRoleData>> = {
  admin: {
    role: 'admin',
    can_view_all_patients: true,
    can_edit_all_patients: true,
    can_delete_patients: true,
    can_view_all_appointments: true,
    can_edit_all_appointments: true,
    can_cancel_appointments: true,
    can_view_all_cases: true,
    can_edit_all_cases: true,
    can_edit_master_data: true,
    can_delete_master_data: true,
    can_manage_employees: true,
    can_delete_employees: true,
    can_view_financial_data: true,
    can_edit_invoices: true,
    can_manage_pharmacy: true,
  },
  doctor: {
    role: 'doctor',
    can_view_all_patients: true,
    can_edit_all_patients: true,
    can_view_all_appointments: true,
    can_edit_all_appointments: true,
    can_view_all_cases: true,
    can_edit_all_cases: true,
  },
  nurse: {
    role: 'nurse',
    can_view_all_patients: true,
    can_edit_all_patients: true,
    can_view_all_appointments: true,
    can_view_all_cases: true,
  },
  receptionist: {
    role: 'receptionist',
    can_view_all_patients: true,
    can_view_all_appointments: true,
    can_edit_all_appointments: true,
    can_view_financial_data: true,
  },
  pharmacist: {
    role: 'pharmacist',
    can_manage_pharmacy: true,
  },
  patient: {
    role: 'patient',
    // Patients can only access their own resources (via ownership checks)
  },
}
