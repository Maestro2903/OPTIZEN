/**
 * Client-safe RBAC utilities
 * Can be used in both client and server components
 */

// User roles from migration 001_initial_schema.sql
// Note: Some roles are accepted by API but not in DB enum - they are mapped to appropriate permissions
export type UserRole = 
  | 'super_admin'
  | 'hospital_admin'
  | 'receptionist'
  | 'optometrist'
  | 'ophthalmologist'
  | 'technician'
  | 'billing_staff'
  | 'patient'
  | 'doctor' // Legacy/alias role - treated as ophthalmologist
  | 'admin' // Administrative role - similar to hospital_admin
  | 'nurse' // Nursing staff - patient care and bed management
  | 'finance' // Financial operations
  | 'pharmacy_staff' // Pharmacy staff
  | 'pharmacy' // Alias for pharmacy_staff
  | 'lab_technician' // Laboratory staff
  | 'manager' // Department/clinic management
  | 'read_only' // View-only access

// Valid user roles for runtime validation
const VALID_USER_ROLES: readonly UserRole[] = [
  'super_admin',
  'hospital_admin',
  'receptionist',
  'optometrist',
  'ophthalmologist',
  'technician',
  'billing_staff',
  'patient',
  'doctor', // Legacy/alias role
  'admin',
  'nurse',
  'finance',
  'pharmacy_staff',
  'pharmacy', // Alias for pharmacy_staff
  'lab_technician',
  'manager',
  'read_only'
] as const

/**
 * Type guard to validate user role at runtime
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (VALID_USER_ROLES as readonly string[]).includes(value)
}

/**
 * Permission actions type
 */
type PermissionActions = { 
  view: boolean; 
  create: boolean; 
  print: boolean; 
  edit: boolean; 
  delete: boolean 
}

/**
 * Role permission matrix with all modules
 */
export const PERMISSIONS: Record<UserRole, {
  patients: PermissionActions
  appointments: PermissionActions
  bookings: PermissionActions
  doctor_schedule: PermissionActions
  cases: PermissionActions
  invoices: PermissionActions
  pharmacy: PermissionActions
  employees: PermissionActions
  master_data: PermissionActions
  operations: PermissionActions
  beds: PermissionActions
  certificates: PermissionActions
  discharges: PermissionActions
  revenue: PermissionActions
  expenses: PermissionActions
  finance: PermissionActions
  attendance: PermissionActions
  lens: PermissionActions
  complaint: PermissionActions
  treatment: PermissionActions
  medicine: PermissionActions
  dosage: PermissionActions
  surgery: PermissionActions
  blood_investigation: PermissionActions
  diagnosis: PermissionActions
  roles: PermissionActions
}> = {
  super_admin: {
    patients: { view: true, create: true, print: true, edit: true, delete: true },
    appointments: { view: true, create: true, print: true, edit: true, delete: true },
    bookings: { view: true, create: true, print: true, edit: true, delete: true },
    doctor_schedule: { view: true, create: true, print: true, edit: true, delete: true },
    cases: { view: true, create: true, print: true, edit: true, delete: true },
    invoices: { view: true, create: true, print: true, edit: true, delete: true },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: true },
    employees: { view: true, create: true, print: true, edit: true, delete: true },
    master_data: { view: true, create: true, print: true, edit: true, delete: true },
    operations: { view: true, create: true, print: true, edit: true, delete: true },
    beds: { view: true, create: true, print: true, edit: true, delete: true },
    certificates: { view: true, create: true, print: true, edit: true, delete: true },
    discharges: { view: true, create: true, print: true, edit: true, delete: true },
    revenue: { view: true, create: true, print: true, edit: true, delete: true },
    expenses: { view: true, create: true, print: true, edit: true, delete: true },
    finance: { view: true, create: true, print: true, edit: true, delete: true },
    attendance: { view: true, create: true, print: true, edit: true, delete: true },
    lens: { view: true, create: true, print: true, edit: true, delete: true },
    complaint: { view: true, create: true, print: true, edit: true, delete: true },
    treatment: { view: true, create: true, print: true, edit: true, delete: true },
    medicine: { view: true, create: true, print: true, edit: true, delete: true },
    dosage: { view: true, create: true, print: true, edit: true, delete: true },
    surgery: { view: true, create: true, print: true, edit: true, delete: true },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: true },
    diagnosis: { view: true, create: true, print: true, edit: true, delete: true },
    roles: { view: true, create: true, print: true, edit: true, delete: true },
  },
  hospital_admin: {
    patients: { view: true, create: true, print: true, edit: true, delete: true },
    appointments: { view: true, create: true, print: true, edit: true, delete: true },
    bookings: { view: true, create: true, print: true, edit: true, delete: true },
    doctor_schedule: { view: true, create: true, print: true, edit: true, delete: true },
    cases: { view: true, create: true, print: true, edit: true, delete: true },
    invoices: { view: true, create: true, print: true, edit: true, delete: true },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: true },
    employees: { view: true, create: true, print: true, edit: true, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: true },
    operations: { view: true, create: true, print: true, edit: true, delete: true },
    beds: { view: true, create: true, print: true, edit: true, delete: true },
    certificates: { view: true, create: true, print: true, edit: true, delete: true },
    discharges: { view: true, create: true, print: true, edit: true, delete: true },
    revenue: { view: true, create: true, print: true, edit: true, delete: false },
    expenses: { view: true, create: true, print: true, edit: true, delete: true },
    finance: { view: true, create: true, print: true, edit: true, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: true, print: true, edit: true, delete: true },
    complaint: { view: true, create: true, print: true, edit: true, delete: true },
    treatment: { view: true, create: true, print: true, edit: true, delete: true },
    medicine: { view: true, create: true, print: true, edit: true, delete: true },
    dosage: { view: true, create: true, print: true, edit: true, delete: true },
    surgery: { view: true, create: true, print: true, edit: true, delete: true },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: true },
    diagnosis: { view: true, create: true, print: true, edit: true, delete: true },
    roles: { view: true, create: false, print: false, edit: false, delete: false },
  },
  receptionist: {
    patients: { view: true, create: true, print: true, edit: true, delete: false },
    appointments: { view: true, create: true, print: true, edit: true, delete: false },
    bookings: { view: true, create: true, print: true, edit: true, delete: false },
    doctor_schedule: { view: true, create: false, print: true, edit: false, delete: false },
    cases: { view: true, create: false, print: false, edit: false, delete: false },
    invoices: { view: true, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: true, create: false, print: false, edit: false, delete: false },
    employees: { view: true, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: false, print: false, edit: false, delete: false },
    operations: { view: true, create: false, print: false, edit: false, delete: false },
    beds: { view: true, create: true, print: true, edit: true, delete: false },
    certificates: { view: true, create: true, print: true, edit: false, delete: false },
    discharges: { view: true, create: false, print: false, edit: false, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: false, print: false, edit: false, delete: false },
    complaint: { view: true, create: false, print: false, edit: false, delete: false },
    treatment: { view: true, create: false, print: false, edit: false, delete: false },
    medicine: { view: true, create: false, print: false, edit: false, delete: false },
    dosage: { view: true, create: false, print: false, edit: false, delete: false },
    surgery: { view: true, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: true, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: true, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  optometrist: {
    patients: { view: true, create: true, print: true, edit: true, delete: false },
    appointments: { view: true, create: true, print: true, edit: true, delete: false },
    bookings: { view: true, create: false, print: true, edit: true, delete: false },
    doctor_schedule: { view: true, create: true, print: true, edit: true, delete: false },
    cases: { view: true, create: true, print: true, edit: true, delete: false },
    invoices: { view: true, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: false },
    employees: { view: false, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: false },
    operations: { view: true, create: true, print: true, edit: true, delete: false },
    beds: { view: true, create: false, print: false, edit: false, delete: false },
    certificates: { view: true, create: true, print: true, edit: true, delete: false },
    discharges: { view: true, create: true, print: true, edit: true, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: true, print: true, edit: true, delete: false },
    complaint: { view: true, create: true, print: true, edit: true, delete: false },
    treatment: { view: true, create: true, print: true, edit: true, delete: false },
    medicine: { view: true, create: true, print: true, edit: true, delete: false },
    dosage: { view: true, create: true, print: true, edit: true, delete: false },
    surgery: { view: true, create: true, print: true, edit: true, delete: false },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: false },
    diagnosis: { view: true, create: true, print: true, edit: true, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  ophthalmologist: {
    patients: { view: true, create: true, print: true, edit: true, delete: false },
    appointments: { view: true, create: true, print: true, edit: true, delete: false },
    bookings: { view: true, create: false, print: true, edit: true, delete: false },
    doctor_schedule: { view: true, create: true, print: true, edit: true, delete: false },
    cases: { view: true, create: true, print: true, edit: true, delete: false },
    invoices: { view: true, create: true, print: true, edit: true, delete: false },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: false },
    employees: { view: true, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: false },
    operations: { view: true, create: true, print: true, edit: true, delete: false },
    beds: { view: true, create: true, print: true, edit: true, delete: false },
    certificates: { view: true, create: true, print: true, edit: true, delete: false },
    discharges: { view: true, create: true, print: true, edit: true, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: true, print: true, edit: true, delete: false },
    complaint: { view: true, create: true, print: true, edit: true, delete: false },
    treatment: { view: true, create: true, print: true, edit: true, delete: false },
    medicine: { view: true, create: true, print: true, edit: true, delete: false },
    dosage: { view: true, create: true, print: true, edit: true, delete: false },
    surgery: { view: true, create: true, print: true, edit: true, delete: false },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: false },
    diagnosis: { view: true, create: true, print: true, edit: true, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  technician: {
    patients: { view: true, create: false, print: false, edit: false, delete: false },
    appointments: { view: true, create: false, print: false, edit: false, delete: false },
    bookings: { view: true, create: false, print: false, edit: false, delete: false },
    doctor_schedule: { view: false, create: false, print: false, edit: false, delete: false },
    cases: { view: true, create: false, print: true, edit: true, delete: false },
    invoices: { view: false, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: true, create: false, print: false, edit: false, delete: false },
    employees: { view: false, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: false, print: false, edit: false, delete: false },
    operations: { view: true, create: false, print: false, edit: false, delete: false },
    beds: { view: true, create: false, print: false, edit: false, delete: false },
    certificates: { view: false, create: false, print: false, edit: false, delete: false },
    discharges: { view: false, create: false, print: false, edit: false, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: false, print: false, edit: false, delete: false },
    complaint: { view: true, create: false, print: false, edit: false, delete: false },
    treatment: { view: true, create: false, print: false, edit: false, delete: false },
    medicine: { view: true, create: false, print: false, edit: false, delete: false },
    dosage: { view: true, create: false, print: false, edit: false, delete: false },
    surgery: { view: true, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: true, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: true, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  billing_staff: {
    patients: { view: true, create: false, print: false, edit: false, delete: false },
    appointments: { view: true, create: false, print: false, edit: false, delete: false },
    bookings: { view: true, create: false, print: false, edit: false, delete: false },
    doctor_schedule: { view: false, create: false, print: false, edit: false, delete: false },
    cases: { view: true, create: false, print: false, edit: false, delete: false },
    invoices: { view: true, create: true, print: true, edit: true, delete: false },
    pharmacy: { view: true, create: false, print: false, edit: true, delete: false },
    employees: { view: false, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: false, print: false, edit: false, delete: false },
    operations: { view: false, create: false, print: false, edit: false, delete: false },
    beds: { view: true, create: false, print: false, edit: false, delete: false },
    certificates: { view: false, create: false, print: false, edit: false, delete: false },
    discharges: { view: false, create: false, print: false, edit: false, delete: false },
    revenue: { view: true, create: true, print: true, edit: true, delete: false },
    expenses: { view: true, create: true, print: true, edit: true, delete: false },
    finance: { view: true, create: false, print: true, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: false, create: false, print: false, edit: false, delete: false },
    complaint: { view: false, create: false, print: false, edit: false, delete: false },
    treatment: { view: false, create: false, print: false, edit: false, delete: false },
    medicine: { view: false, create: false, print: false, edit: false, delete: false },
    dosage: { view: false, create: false, print: false, edit: false, delete: false },
    surgery: { view: false, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: false, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: false, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  patient: {
    patients: { view: false, create: false, print: false, edit: false, delete: false },
    appointments: { view: false, create: false, print: false, edit: false, delete: false },
    bookings: { view: false, create: false, print: false, edit: false, delete: false },
    doctor_schedule: { view: false, create: false, print: false, edit: false, delete: false },
    cases: { view: false, create: false, print: false, edit: false, delete: false },
    invoices: { view: false, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: false, create: false, print: false, edit: false, delete: false },
    employees: { view: false, create: false, print: false, edit: false, delete: false },
    master_data: { view: false, create: false, print: false, edit: false, delete: false },
    operations: { view: false, create: false, print: false, edit: false, delete: false },
    beds: { view: false, create: false, print: false, edit: false, delete: false },
    certificates: { view: false, create: false, print: false, edit: false, delete: false },
    discharges: { view: false, create: false, print: false, edit: false, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: false, create: false, print: false, edit: false, delete: false },
    lens: { view: false, create: false, print: false, edit: false, delete: false },
    complaint: { view: false, create: false, print: false, edit: false, delete: false },
    treatment: { view: false, create: false, print: false, edit: false, delete: false },
    medicine: { view: false, create: false, print: false, edit: false, delete: false },
    dosage: { view: false, create: false, print: false, edit: false, delete: false },
    surgery: { view: false, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: false, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: false, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'doctor' is a legacy/alias role - map to ophthalmologist permissions
  doctor: {
    patients: { view: true, create: true, print: true, edit: true, delete: false },
    appointments: { view: true, create: true, print: true, edit: true, delete: false },
    bookings: { view: true, create: false, print: true, edit: true, delete: false },
    doctor_schedule: { view: true, create: true, print: true, edit: true, delete: false },
    cases: { view: true, create: true, print: true, edit: true, delete: false },
    invoices: { view: true, create: true, print: true, edit: true, delete: false },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: false },
    employees: { view: true, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: false },
    operations: { view: true, create: true, print: true, edit: true, delete: false },
    beds: { view: true, create: true, print: true, edit: true, delete: false },
    certificates: { view: true, create: true, print: true, edit: true, delete: false },
    discharges: { view: true, create: true, print: true, edit: true, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: true, print: true, edit: true, delete: false },
    complaint: { view: true, create: true, print: true, edit: true, delete: false },
    treatment: { view: true, create: true, print: true, edit: true, delete: false },
    medicine: { view: true, create: true, print: true, edit: true, delete: false },
    dosage: { view: true, create: true, print: true, edit: true, delete: false },
    surgery: { view: true, create: true, print: true, edit: true, delete: false },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: false },
    diagnosis: { view: true, create: true, print: true, edit: true, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'admin' - Administrative role similar to hospital_admin
  admin: {
    patients: { view: true, create: true, print: true, edit: true, delete: true },
    appointments: { view: true, create: true, print: true, edit: true, delete: true },
    bookings: { view: true, create: true, print: true, edit: true, delete: true },
    doctor_schedule: { view: true, create: true, print: true, edit: true, delete: true },
    cases: { view: true, create: true, print: true, edit: true, delete: true },
    invoices: { view: true, create: true, print: true, edit: true, delete: true },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: true },
    employees: { view: true, create: true, print: true, edit: true, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: true },
    operations: { view: true, create: true, print: true, edit: true, delete: true },
    beds: { view: true, create: true, print: true, edit: true, delete: true },
    certificates: { view: true, create: true, print: true, edit: true, delete: true },
    discharges: { view: true, create: true, print: true, edit: true, delete: true },
    revenue: { view: true, create: true, print: true, edit: true, delete: false },
    expenses: { view: true, create: true, print: true, edit: true, delete: true },
    finance: { view: true, create: true, print: true, edit: true, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: true, print: true, edit: true, delete: true },
    complaint: { view: true, create: true, print: true, edit: true, delete: true },
    treatment: { view: true, create: true, print: true, edit: true, delete: true },
    medicine: { view: true, create: true, print: true, edit: true, delete: true },
    dosage: { view: true, create: true, print: true, edit: true, delete: true },
    surgery: { view: true, create: true, print: true, edit: true, delete: true },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: true },
    diagnosis: { view: true, create: true, print: true, edit: true, delete: true },
    roles: { view: true, create: false, print: false, edit: false, delete: false },
  },
  // 'nurse' - Nursing staff with patient care and bed management
  nurse: {
    patients: { view: true, create: true, print: true, edit: true, delete: false },
    appointments: { view: true, create: true, print: true, edit: true, delete: false },
    bookings: { view: true, create: false, print: true, edit: true, delete: false },
    doctor_schedule: { view: true, create: false, print: true, edit: false, delete: false },
    cases: { view: true, create: false, print: true, edit: true, delete: false },
    invoices: { view: true, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: true, create: false, print: false, edit: false, delete: false },
    employees: { view: true, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: false, print: false, edit: false, delete: false },
    operations: { view: true, create: false, print: false, edit: false, delete: false },
    beds: { view: true, create: true, print: true, edit: true, delete: false },
    certificates: { view: true, create: false, print: true, edit: false, delete: false },
    discharges: { view: true, create: true, print: true, edit: true, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: false, print: false, edit: false, delete: false },
    complaint: { view: true, create: false, print: false, edit: false, delete: false },
    treatment: { view: true, create: false, print: false, edit: false, delete: false },
    medicine: { view: true, create: false, print: false, edit: false, delete: false },
    dosage: { view: true, create: false, print: false, edit: false, delete: false },
    surgery: { view: true, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: true, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: true, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'finance' - Financial operations and billing management
  finance: {
    patients: { view: true, create: false, print: false, edit: false, delete: false },
    appointments: { view: true, create: false, print: false, edit: false, delete: false },
    bookings: { view: true, create: false, print: false, edit: false, delete: false },
    doctor_schedule: { view: false, create: false, print: false, edit: false, delete: false },
    cases: { view: true, create: false, print: false, edit: false, delete: false },
    invoices: { view: true, create: true, print: true, edit: true, delete: false },
    pharmacy: { view: true, create: false, print: false, edit: false, delete: false },
    employees: { view: true, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: false, print: false, edit: false, delete: false },
    operations: { view: false, create: false, print: false, edit: false, delete: false },
    beds: { view: true, create: false, print: false, edit: false, delete: false },
    certificates: { view: false, create: false, print: false, edit: false, delete: false },
    discharges: { view: false, create: false, print: false, edit: false, delete: false },
    revenue: { view: true, create: true, print: true, edit: true, delete: false },
    expenses: { view: true, create: true, print: true, edit: true, delete: false },
    finance: { view: true, create: true, print: true, edit: true, delete: false },
    attendance: { view: true, create: false, print: false, edit: false, delete: false },
    lens: { view: false, create: false, print: false, edit: false, delete: false },
    complaint: { view: false, create: false, print: false, edit: false, delete: false },
    treatment: { view: false, create: false, print: false, edit: false, delete: false },
    medicine: { view: false, create: false, print: false, edit: false, delete: false },
    dosage: { view: false, create: false, print: false, edit: false, delete: false },
    surgery: { view: false, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: false, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: false, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'pharmacy_staff' - Pharmacy and medication management
  pharmacy_staff: {
    patients: { view: true, create: false, print: false, edit: false, delete: false },
    appointments: { view: true, create: false, print: false, edit: false, delete: false },
    bookings: { view: true, create: false, print: false, edit: false, delete: false },
    doctor_schedule: { view: false, create: false, print: false, edit: false, delete: false },
    cases: { view: true, create: false, print: false, edit: false, delete: false },
    invoices: { view: true, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: false },
    employees: { view: false, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: false },
    operations: { view: false, create: false, print: false, edit: false, delete: false },
    beds: { view: false, create: false, print: false, edit: false, delete: false },
    certificates: { view: false, create: false, print: false, edit: false, delete: false },
    discharges: { view: false, create: false, print: false, edit: false, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: false, create: false, print: false, edit: false, delete: false },
    complaint: { view: true, create: false, print: false, edit: false, delete: false },
    treatment: { view: true, create: false, print: false, edit: false, delete: false },
    medicine: { view: true, create: true, print: true, edit: true, delete: false },
    dosage: { view: true, create: true, print: true, edit: true, delete: false },
    surgery: { view: false, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: false, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: false, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'pharmacy' - Alias for pharmacy_staff
  pharmacy: {
    patients: { view: true, create: false, print: false, edit: false, delete: false },
    appointments: { view: true, create: false, print: false, edit: false, delete: false },
    bookings: { view: true, create: false, print: false, edit: false, delete: false },
    doctor_schedule: { view: false, create: false, print: false, edit: false, delete: false },
    cases: { view: true, create: false, print: false, edit: false, delete: false },
    invoices: { view: true, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: false },
    employees: { view: false, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: false },
    operations: { view: false, create: false, print: false, edit: false, delete: false },
    beds: { view: false, create: false, print: false, edit: false, delete: false },
    certificates: { view: false, create: false, print: false, edit: false, delete: false },
    discharges: { view: false, create: false, print: false, edit: false, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: false, create: false, print: false, edit: false, delete: false },
    complaint: { view: true, create: false, print: false, edit: false, delete: false },
    treatment: { view: true, create: false, print: false, edit: false, delete: false },
    medicine: { view: true, create: true, print: true, edit: true, delete: false },
    dosage: { view: true, create: true, print: true, edit: true, delete: false },
    surgery: { view: false, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: false, create: false, print: false, edit: false, delete: false },
    diagnosis: { view: false, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'lab_technician' - Laboratory and diagnostic permissions
  lab_technician: {
    patients: { view: true, create: false, print: false, edit: false, delete: false },
    appointments: { view: true, create: false, print: false, edit: false, delete: false },
    bookings: { view: true, create: false, print: false, edit: false, delete: false },
    doctor_schedule: { view: false, create: false, print: false, edit: false, delete: false },
    cases: { view: true, create: false, print: true, edit: true, delete: false },
    invoices: { view: false, create: false, print: false, edit: false, delete: false },
    pharmacy: { view: true, create: false, print: false, edit: false, delete: false },
    employees: { view: false, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: false, print: false, edit: false, delete: false },
    operations: { view: true, create: false, print: false, edit: false, delete: false },
    beds: { view: true, create: false, print: false, edit: false, delete: false },
    certificates: { view: false, create: false, print: false, edit: false, delete: false },
    discharges: { view: false, create: false, print: false, edit: false, delete: false },
    revenue: { view: false, create: false, print: false, edit: false, delete: false },
    expenses: { view: false, create: false, print: false, edit: false, delete: false },
    finance: { view: false, create: false, print: false, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: false, print: false, edit: false, delete: false },
    complaint: { view: true, create: false, print: false, edit: false, delete: false },
    treatment: { view: true, create: false, print: false, edit: false, delete: false },
    medicine: { view: true, create: false, print: false, edit: false, delete: false },
    dosage: { view: true, create: false, print: false, edit: false, delete: false },
    surgery: { view: true, create: false, print: false, edit: false, delete: false },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: false },
    diagnosis: { view: true, create: false, print: false, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'manager' - Department or clinic management permissions
  manager: {
    patients: { view: true, create: true, print: true, edit: true, delete: false },
    appointments: { view: true, create: true, print: true, edit: true, delete: false },
    bookings: { view: true, create: true, print: true, edit: true, delete: false },
    doctor_schedule: { view: true, create: true, print: true, edit: true, delete: false },
    cases: { view: true, create: true, print: true, edit: true, delete: false },
    invoices: { view: true, create: true, print: true, edit: true, delete: false },
    pharmacy: { view: true, create: true, print: true, edit: true, delete: false },
    employees: { view: true, create: false, print: false, edit: true, delete: false },
    master_data: { view: true, create: true, print: true, edit: true, delete: false },
    operations: { view: true, create: true, print: true, edit: true, delete: false },
    beds: { view: true, create: true, print: true, edit: true, delete: false },
    certificates: { view: true, create: true, print: true, edit: true, delete: false },
    discharges: { view: true, create: true, print: true, edit: true, delete: false },
    revenue: { view: true, create: false, print: true, edit: false, delete: false },
    expenses: { view: true, create: true, print: true, edit: true, delete: false },
    finance: { view: true, create: false, print: true, edit: false, delete: false },
    attendance: { view: true, create: true, print: true, edit: true, delete: false },
    lens: { view: true, create: true, print: true, edit: true, delete: false },
    complaint: { view: true, create: true, print: true, edit: true, delete: false },
    treatment: { view: true, create: true, print: true, edit: true, delete: false },
    medicine: { view: true, create: true, print: true, edit: true, delete: false },
    dosage: { view: true, create: true, print: true, edit: true, delete: false },
    surgery: { view: true, create: true, print: true, edit: true, delete: false },
    blood_investigation: { view: true, create: true, print: true, edit: true, delete: false },
    diagnosis: { view: true, create: true, print: true, edit: true, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
  // 'read_only' - View-only access for reports and monitoring
  read_only: {
    patients: { view: true, create: false, print: true, edit: false, delete: false },
    appointments: { view: true, create: false, print: true, edit: false, delete: false },
    bookings: { view: true, create: false, print: true, edit: false, delete: false },
    doctor_schedule: { view: true, create: false, print: true, edit: false, delete: false },
    cases: { view: true, create: false, print: true, edit: false, delete: false },
    invoices: { view: true, create: false, print: true, edit: false, delete: false },
    pharmacy: { view: true, create: false, print: true, edit: false, delete: false },
    employees: { view: true, create: false, print: false, edit: false, delete: false },
    master_data: { view: true, create: false, print: false, edit: false, delete: false },
    operations: { view: true, create: false, print: true, edit: false, delete: false },
    beds: { view: true, create: false, print: true, edit: false, delete: false },
    certificates: { view: true, create: false, print: true, edit: false, delete: false },
    discharges: { view: true, create: false, print: true, edit: false, delete: false },
    revenue: { view: true, create: false, print: true, edit: false, delete: false },
    expenses: { view: true, create: false, print: true, edit: false, delete: false },
    finance: { view: true, create: false, print: true, edit: false, delete: false },
    attendance: { view: true, create: false, print: true, edit: false, delete: false },
    lens: { view: true, create: false, print: true, edit: false, delete: false },
    complaint: { view: true, create: false, print: true, edit: false, delete: false },
    treatment: { view: true, create: false, print: true, edit: false, delete: false },
    medicine: { view: true, create: false, print: true, edit: false, delete: false },
    dosage: { view: true, create: false, print: true, edit: false, delete: false },
    surgery: { view: true, create: false, print: true, edit: false, delete: false },
    blood_investigation: { view: true, create: false, print: true, edit: false, delete: false },
    diagnosis: { view: true, create: false, print: true, edit: false, delete: false },
    roles: { view: false, create: false, print: false, edit: false, delete: false },
  },
}

/**
 * Check if user has permission for resource and action
 */
export function hasPermission(
  role: UserRole,
  resource: keyof typeof PERMISSIONS[UserRole],
  action: 'view' | 'create' | 'print' | 'edit' | 'delete'
): boolean {
  // Map alias roles to their primary role
  let effectiveRole: UserRole = role
  if (role === 'doctor') {
    effectiveRole = 'ophthalmologist' // doctor maps to ophthalmologist
  } else if (role === 'pharmacy') {
    effectiveRole = 'pharmacy_staff' // pharmacy maps to pharmacy_staff
  }
  
  const permissions = PERMISSIONS[effectiveRole]
  if (!permissions || !permissions[resource]) {
    return false
  }
  return permissions[resource][action]
}

/**
 * Check if user has any access to a module (at least view permission)
 */
export function hasModuleAccess(
  role: UserRole,
  resource: keyof typeof PERMISSIONS[UserRole]
): boolean {
  return hasPermission(role, resource, 'view')
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
  return ['optometrist', 'ophthalmologist', 'technician', 'doctor', 'nurse', 'lab_technician'].includes(role)
}

/**
 * Helper: Check if user has financial access
 */
export function hasFinancialAccess(role: UserRole): boolean {
  return ['super_admin', 'hospital_admin', 'billing_staff', 'finance', 'admin', 'manager'].includes(role)
}
