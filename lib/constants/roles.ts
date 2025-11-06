export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOSPITAL_ADMIN: 'hospital_admin',
  RECEPTIONIST: 'receptionist',
  OPTOMETRIST: 'optometrist',
  OPHTHALMOLOGIST: 'ophthalmologist',
  TECHNICIAN: 'technician',
  BILLING_STAFF: 'billing_staff',
  PATIENT: 'patient',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

type Permission = 'create' | 'read' | 'update' | 'delete'

type ModulePermissions = {
  patients: Permission[]
  appointments: Permission[]
  clinical: Permission[]
  billing: Permission[]
  optical: Permission[]
  surgery: Permission[]
  analytics: Permission[]
  settings: Permission[]
}

export const ROLE_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  [USER_ROLES.SUPER_ADMIN]: {
    patients: ['create', 'read', 'update', 'delete'],
    appointments: ['create', 'read', 'update', 'delete'],
    clinical: ['create', 'read', 'update', 'delete'],
    billing: ['create', 'read', 'update', 'delete'],
    optical: ['create', 'read', 'update', 'delete'],
    surgery: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    settings: ['create', 'read', 'update', 'delete'],
  },
  [USER_ROLES.HOSPITAL_ADMIN]: {
    patients: ['create', 'read', 'update', 'delete'],
    appointments: ['create', 'read', 'update', 'delete'],
    clinical: ['read'],
    billing: ['create', 'read', 'update', 'delete'],
    optical: ['create', 'read', 'update', 'delete'],
    surgery: ['read'],
    analytics: ['read'],
    settings: ['read', 'update'],
  },
  [USER_ROLES.RECEPTIONIST]: {
    patients: ['create', 'read', 'update'],
    appointments: ['create', 'read', 'update'],
    clinical: [],
    billing: ['read'],
    optical: ['read'],
    surgery: [],
    analytics: [],
    settings: [],
  },
  [USER_ROLES.OPTOMETRIST]: {
    patients: ['read', 'update'],
    appointments: ['read', 'update'],
    clinical: ['create', 'read', 'update'],
    billing: [],
    optical: ['create', 'read', 'update'],
    surgery: [],
    analytics: [],
    settings: [],
  },
  [USER_ROLES.OPHTHALMOLOGIST]: {
    patients: ['read', 'update'],
    appointments: ['read', 'update'],
    clinical: ['create', 'read', 'update'],
    billing: [],
    optical: ['create', 'read', 'update'],
    surgery: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    settings: [],
  },
  [USER_ROLES.TECHNICIAN]: {
    patients: ['read'],
    appointments: ['read'],
    clinical: ['create', 'read', 'update'],
    billing: [],
    optical: [],
    surgery: ['read', 'update'],
    analytics: [],
    settings: [],
  },
  [USER_ROLES.BILLING_STAFF]: {
    patients: ['read'],
    appointments: ['read'],
    clinical: [],
    billing: ['create', 'read', 'update'],
    optical: ['read'],
    surgery: [],
    analytics: ['read'],
    settings: [],
  },
  [USER_ROLES.PATIENT]: {
    patients: ['read'], // own record only
    appointments: ['read'], // own appointments only
    clinical: ['read'], // own records only
    billing: ['read'], // own invoices only
    optical: [],
    surgery: [],
    analytics: [],
    settings: [],
  },
}

export function hasPermission(
  role: UserRole,
  module: keyof ModulePermissions,
  action: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions[module]?.includes(action) ?? false
}

