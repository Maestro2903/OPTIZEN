/**
 * API Service Layer - Centralized API calls for EYECARE CRM
 *
 * This service layer provides a clean interface between the frontend components
 * and the backend API endpoints. All API calls go through this layer.
 */

import { createClient } from '@/lib/supabase/client'

// Types for API responses
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Base API service class
class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api'
  }

  async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      // Build headers object with Content-Type first
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Only add Authorization header if token exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Merge with custom headers from options (options.headers override defaults)
      const finalHeaders = {
        ...headers,
        ...options.headers,
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: finalHeaders,
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Generic CRUD methods
  async getList<T>(
    resource: string,
    params: PaginationParams & Record<string, any> = {}
  ): Promise<ApiResponse<T[]>> {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.fetchApi<T[]>(`/${resource}${query}`)
  }

  async getById<T>(resource: string, id: string): Promise<ApiResponse<T>> {
    return this.fetchApi<T>(`/${resource}/${id}`)
  }

  async create<T>(resource: string, data: any): Promise<ApiResponse<T>> {
    return this.fetchApi<T>(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async update<T>(resource: string, id: string, data: any): Promise<ApiResponse<T>> {
    return this.fetchApi<T>(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(resource: string, id: string): Promise<ApiResponse<T>> {
    return this.fetchApi<T>(`/${resource}/${id}`, {
      method: 'DELETE',
    })
  }
}

// Create singleton instance
const apiService = new ApiService()

// ===============================
// PATIENTS API
// ===============================

export interface Patient {
  id: string
  patient_id: string
  full_name: string
  email?: string
  mobile: string
  gender: 'male' | 'female' | 'other'
  date_of_birth?: string
  country?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  emergency_contact?: string
  emergency_phone?: string
  medical_history?: string
  current_medications?: string
  allergies?: string
  insurance_provider?: string
  insurance_number?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface PatientFilters extends PaginationParams {
  status?: string | string[]
  gender?: string | string[]
  state?: string | string[]
}

export const patientsApi = {
  list: (params: PatientFilters = {}) =>
    apiService.getList<Patient>('patients', params),

  getById: (id: string) =>
    apiService.getById<Patient>('patients', id),

  create: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) =>
    apiService.create<Patient>('patients', data),

  update: (id: string, data: Partial<Patient>) =>
    apiService.update<Patient>('patients', id, data),

  delete: (id: string) =>
    apiService.delete<Patient>('patients', id),
}

// ===============================
// CASES API
// ===============================

export interface Case {
  id: string
  case_no: string
  patient_id: string
  encounter_date: string
  visit_type?: string
  chief_complaint?: string
  history_of_present_illness?: string
  past_medical_history?: string
  examination_findings?: string
  diagnosis?: string
  treatment_plan?: string
  medications_prescribed?: string
  follow_up_instructions?: string
  status: 'active' | 'completed' | 'cancelled'
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  created_at: string
  updated_at: string
}

export interface CaseFilters extends PaginationParams {
  status?: string
  patient_id?: string
}

export const casesApi = {
  list: (params: CaseFilters = {}) =>
    apiService.getList<Case>('cases', params),

  getById: (id: string) =>
    apiService.getById<Case>('cases', id),

  create: (data: Omit<Case, 'id' | 'created_at' | 'updated_at' | 'patients'>) =>
    apiService.create<Case>('cases', data),

  update: (id: string, data: Partial<Case>) =>
    apiService.update<Case>('cases', id, data),

  delete: (id: string) =>
    apiService.delete<Case>('cases', id),
}

// ===============================
// APPOINTMENTS API
// ===============================

export interface Appointment {
  id: string
  patient_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: 'consult' | 'follow-up' | 'surgery' | 'refraction' | 'other'
  doctor_id?: string
  reason?: string
  duration_minutes: number
  status: 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  doctors?: Pick<Employee, 'id' | 'employee_id' | 'full_name' | 'role' | 'department'>
  created_at: string
  updated_at: string
}

export interface AppointmentFilters extends PaginationParams {
  status?: string | string[]
  date?: string
  patient_id?: string
}

export const appointmentsApi = {
  list: (params: AppointmentFilters = {}) =>
    apiService.getList<Appointment>('appointments', params),

  getById: (id: string) =>
    apiService.getById<Appointment>('appointments', id),

  create: (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patients'>) =>
    apiService.create<Appointment>('appointments', data),

  update: (id: string, data: Partial<Appointment>) =>
    apiService.update<Appointment>('appointments', id, data),

  delete: (id: string) =>
    apiService.delete<Appointment>('appointments', id),
}

// ===============================
// INVOICES API
// ===============================

export interface InvoiceItem {
  id: string
  item_description: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Invoice {
  id: string
  invoice_number: string
  patient_id: string
  invoice_date: string
  due_date?: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  amount_paid: number
  balance_due: number
  payment_status: 'paid' | 'partial' | 'unpaid'
  payment_method?: string
  notes?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  invoice_items?: InvoiceItem[]
  created_at: string
  updated_at: string
}

export interface InvoiceFilters extends PaginationParams {
  status?: string | string[]
  patient_id?: string
  date_from?: string
  date_to?: string
}

export const invoicesApi = {
  list: (params: InvoiceFilters = {}) =>
    apiService.getList<Invoice>('invoices', params),

  getById: (id: string) =>
    apiService.getById<Invoice>('invoices', id),

  create: (data: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'patients' | 'balance_due' | 'payment_status'> & { items: Omit<InvoiceItem, 'id' | 'total_price'>[] }) =>
    apiService.create<Invoice>('invoices', data),

  update: (id: string, data: Partial<Invoice>) =>
    apiService.update<Invoice>('invoices', id, data),

  delete: (id: string) =>
    apiService.delete<Invoice>('invoices', id),
}

// ===============================
// EMPLOYEES API
// ===============================

export interface Employee {
  id: string
  employee_id: string
  full_name: string
  email: string
  phone: string
  role: string
  department?: string
  hire_date?: string
  salary?: number
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  qualifications?: string
  license_number?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface EmployeeFilters extends PaginationParams {
  status?: string | string[]
  role?: string | string[]
  department?: string | string[]
}

export const employeesApi = {
  list: (params: EmployeeFilters = {}) =>
    apiService.getList<Employee>('employees', params),

  getById: (id: string) =>
    apiService.getById<Employee>('employees', id),

  create: (data: Omit<Employee, 'id' | 'employee_id' | 'created_at' | 'updated_at'>) =>
    apiService.create<Employee>('employees', data),

  update: (id: string, data: Partial<Employee>) =>
    apiService.update<Employee>('employees', id, data),

  delete: (id: string) =>
    apiService.delete<Employee>('employees', id),
}

// ===============================
// MASTER DATA API
// ===============================

export interface MasterDataItem {
  id: string
  category: string
  name: string
  description?: string
  is_active: boolean
  sort_order: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MasterDataFilters extends PaginationParams {
  category?: string
  active_only?: boolean
}

export const masterDataApi = {
  // Get all categories with counts
  getCategories: () =>
    apiService.fetchApi<Record<string, number>>('/master-data'),

  // Get items by category
  list: (params: MasterDataFilters = {}) =>
    apiService.getList<MasterDataItem>('master-data', params),

  getById: (id: string) =>
    apiService.getById<MasterDataItem>('master-data', id),

  create: (data: Omit<MasterDataItem, 'id' | 'created_at' | 'updated_at'>) =>
    apiService.create<MasterDataItem>('master-data', data),

  update: (id: string, data: Partial<MasterDataItem>) =>
    apiService.update<MasterDataItem>('master-data', id, data),

  delete: (id: string, hard: boolean = false) =>
    apiService.fetchApi<MasterDataItem>(`/master-data/${id}${hard ? '?hard=true' : ''}`, {
      method: 'DELETE',
    }),
}

// ===============================
// PHARMACY API
// ===============================

export interface PharmacyItem {
  id: string
  item_name: string
  generic_name?: string
  manufacturer?: string
  category: string
  unit_price: number
  selling_price: number
  current_stock: number
  reorder_level: number
  batch_number?: string
  expiry_date?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface PharmacyFilters extends PaginationParams {
  category?: string
  low_stock?: boolean
}

export const pharmacyApi = {
  list: (params: PharmacyFilters = {}) =>
    apiService.getList<PharmacyItem>('pharmacy', params),

  getById: (id: string) =>
    apiService.getById<PharmacyItem>('pharmacy', id),

  create: (data: Omit<PharmacyItem, 'id' | 'created_at' | 'updated_at'>) =>
    apiService.create<PharmacyItem>('pharmacy', data),

  update: (id: string, data: Partial<PharmacyItem>) =>
    apiService.update<PharmacyItem>('pharmacy', id, data),

  delete: (id: string) =>
    apiService.delete<PharmacyItem>('pharmacy', id),
}

// ===============================
// ATTENDANCE API
// ===============================

export interface AttendanceRecord {
  id: string
  user_id: string
  attendance_date: string
  status: 'present' | 'absent' | 'sick_leave' | 'casual_leave' | 'paid_leave' | 'half_day'
  check_in_time?: string
  check_out_time?: string
  working_hours?: number
  notes?: string
  marked_by?: string
  employees?: Pick<Employee, 'id' | 'employee_id' | 'full_name' | 'role' | 'department'>
  created_at: string
  updated_at: string
}

export interface AttendanceFilters extends PaginationParams {
  status?: string | string[]
  date?: string
  employee_id?: string
  date_from?: string
  date_to?: string
}

export const attendanceApi = {
  list: (params: AttendanceFilters = {}) =>
    apiService.getList<AttendanceRecord>('attendance', params),

  getById: (id: string) =>
    apiService.getById<AttendanceRecord>('attendance', id),

  create: (data: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at' | 'employees'>) =>
    apiService.create<AttendanceRecord>('attendance', data),

  update: (id: string, data: Partial<AttendanceRecord>) =>
    apiService.update<AttendanceRecord>('attendance', id, data),

  delete: (id: string) =>
    apiService.delete<AttendanceRecord>('attendance', id),

  // Bulk operations
  markBulkAttendance: (data: { user_ids: string[]; attendance_date: string; status: string }) =>
    apiService.fetchApi<AttendanceRecord[]>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get attendance summary
  getSummary: (params: { date?: string; month?: string; year?: string } = {}) =>
    apiService.fetchApi<{
      total_staff: number
      present: number
      absent: number
      on_leave: number
      attendance_percentage: number
    }>('/attendance/summary', {
      method: 'GET',
    }),
}

// ===============================
// OPERATIONS API
// ===============================

export interface Operation {
  id: string
  patient_id: string
  case_id?: string
  operation_name: string
  operation_date: string
  begin_time?: string
  end_time?: string
  duration?: string
  eye?: string
  sys_diagnosis?: string
  anesthesia?: string
  operation_notes?: string
  payment_mode?: string
  amount?: number
  iol_name?: string
  iol_power?: string
  print_notes?: boolean
  print_payment?: boolean
  print_iol?: boolean
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  cases?: Pick<Case, 'id' | 'case_no' | 'diagnosis'>
  created_at: string
  updated_at: string
}

export interface OperationFilters extends PaginationParams {
  status?: string | string[]
  patient_id?: string
  case_id?: string
  date_from?: string
  date_to?: string
}

export const operationsApi = {
  list: (params: OperationFilters = {}) =>
    apiService.getList<Operation>('operations', params),

  getById: (id: string) =>
    apiService.getById<Operation>('operations', id),

  create: (data: Omit<Operation, 'id' | 'created_at' | 'updated_at' | 'patients' | 'cases'>) =>
    apiService.create<Operation>('operations', data),

  update: (id: string, data: Partial<Operation>) =>
    apiService.update<Operation>('operations', id, data),

  delete: (id: string) =>
    apiService.delete<Operation>('operations', id),
}

// ===============================
// DISCHARGES API
// ===============================

export interface Discharge {
  id: string
  patient_id: string
  case_id?: string
  admission_date: string
  discharge_date: string
  discharge_type: 'regular' | 'LAMA' | 'transfer' | 'death'
  discharge_summary?: string
  final_diagnosis?: string
  treatment_given?: string
  condition_on_discharge?: string
  instructions?: string
  follow_up_date?: string
  medications?: string
  vitals_at_discharge?: string
  doctor_id?: string
  status: 'completed' | 'pending' | 'cancelled'
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  cases?: Pick<Case, 'id' | 'case_no' | 'diagnosis'>
  created_at: string
  updated_at: string
}

export interface DischargeFilters extends PaginationParams {
  status?: string | string[]
  patient_id?: string
  case_id?: string
  discharge_type?: string
  date_from?: string
  date_to?: string
}

export const dischargesApi = {
  list: (params: DischargeFilters = {}) =>
    apiService.getList<Discharge>('discharges', params),

  getById: (id: string) =>
    apiService.getById<Discharge>('discharges', id),

  create: (data: Omit<Discharge, 'id' | 'created_at' | 'updated_at' | 'patients' | 'cases'>) =>
    apiService.create<Discharge>('discharges', data),

  update: (id: string, data: Partial<Discharge>) =>
    apiService.update<Discharge>('discharges', id, data),

  delete: (id: string) =>
    apiService.delete<Discharge>('discharges', id),
}

// ===============================
// REVENUE/EXPENSES API
// ===============================

export interface RevenueTransaction {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  transaction_date: string
  payment_method?: string
  reference?: string
  notes?: string
  patient_id?: string
  invoice_id?: string
  created_at: string
  updated_at: string
}

export interface RevenueFilters extends PaginationParams {
  type?: 'income' | 'expense'
  category?: string
  date_from?: string
  date_to?: string
}

export interface RevenueSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  incomeByCategory: Record<string, number>
  expensesByCategory: Record<string, number>
  transactionCount: {
    income: number
    expense: number
    total: number
  }
}

export const revenueApi = {
  list: (params: RevenueFilters = {}) =>
    apiService.getList<RevenueTransaction>('revenue', params),

  create: (data: Omit<RevenueTransaction, 'id' | 'created_at' | 'updated_at'>) =>
    apiService.create<RevenueTransaction>('revenue', data),

  getSummary: (params: { month?: string; year?: string; date_from?: string; date_to?: string } = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value))
    })
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<RevenueSummary>(`/revenue/summary${query}`, {
      method: 'GET',
    })
  },
}

// ===============================
// BEDS API
// ===============================

export interface Bed {
  id: string
  bed_number: string
  ward_name: string
  ward_type: 'general' | 'icu' | 'private' | 'semi_private'
  floor_number: number
  room_number?: string
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  daily_rate: number
  description?: string
  created_at: string
  updated_at: string
}

export interface BedAssignment {
  id: string
  bed_id: string
  patient_id: string
  admission_date: string
  discharge_date?: string
  expected_discharge_date?: string
  admission_reason?: string
  doctor_id?: string
  patient_name?: string
  patient_age?: number
  patient_mrn?: string
  doctor_name?: string
  days_in_ward?: number
  surgery_scheduled_time?: string
  surgery_type?: string
}

export interface BedWithAssignment {
  bed: Bed
  assignment: BedAssignment | null
}

export interface BedFilters extends PaginationParams {
  ward_type?: string
  status?: string | string[]
  floor_number?: string
}

export const bedsApi = {
  list: (params: BedFilters = {}) =>
    apiService.getList<BedWithAssignment>('beds', params),

  create: (data: Omit<Bed, 'id' | 'created_at' | 'updated_at'>) =>
    apiService.create<BedWithAssignment>('beds', data),

  update: (id: string, data: Partial<Bed>) =>
    apiService.update<BedWithAssignment>('beds', id, data),

  delete: (id: string) =>
    apiService.delete<Bed>('beds', id),
}

// ===============================
// CERTIFICATES API
// ===============================

export interface Certificate {
  id: string
  certificate_number: string
  patient_id: string
  type: string
  purpose: string
  issue_date: string
  status: string
  // Common fields
  exam_date?: string
  findings?: string
  diagnosis?: string
  treatment_period?: string
  recommendations?: string
  // Eye test specific
  visual_acuity_right?: string
  visual_acuity_left?: string
  color_vision?: string
  driving_fitness?: string
  // Sick leave specific
  illness?: string
  leave_from?: string
  leave_to?: string
  // Custom certificate
  title?: string
  content?: string
  issued_by?: string
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  created_at: string
  updated_at: string
}

export interface CertificateFilters extends PaginationParams {
  type?: string
  status?: string
  patient_id?: string
  date_from?: string
  date_to?: string
}

export const certificatesApi = {
  list: (params: CertificateFilters = {}) =>
    apiService.getList<Certificate>('certificates', params),

  getById: (id: string) =>
    apiService.getById<Certificate>('certificates', id),

  create: (data: Omit<Certificate, 'id' | 'certificate_number' | 'created_at' | 'updated_at' | 'patients'>) =>
    apiService.create<Certificate>('certificates', data),

  update: (id: string, data: Partial<Certificate>) =>
    apiService.update<Certificate>('certificates', id, data),

  delete: (id: string) =>
    apiService.delete<Certificate>('certificates', id),
}

// ===============================
// REAL-TIME SUBSCRIPTIONS
// ===============================

export class RealtimeService {
  private supabase = createClient()

  subscribeToTable<T>(
    tableName: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channelConfig: any = { event: '*', schema: 'public', table: tableName }
    
    // Apply filter if provided (format: "column=eq.value")
    if (filter) {
      channelConfig.filter = filter
    }

    const channel = this.supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', channelConfig, callback)
      .subscribe()

    return channel
  }

  unsubscribe(subscription: any) {
    return this.supabase.removeChannel(subscription)
  }
}

export const realtimeService = new RealtimeService()

// ===============================
// UTILITY FUNCTIONS
// ===============================

export const apiUtils = {
  // Format error messages
  formatError: (error: string | undefined): string => {
    if (!error) return 'An unknown error occurred'

    // Handle common API errors
    if (error.includes('duplicate key')) {
      return 'This record already exists'
    }
    if (error.includes('foreign key')) {
      return 'Cannot delete: record is being used elsewhere'
    }
    if (error.includes('not found')) {
      return 'Record not found'
    }

    return error
  },

  // Build query parameters
  buildQueryParams: (params: Record<string, any>): string => {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })

    return queryParams.toString()
  },

  // Check if response is successful
  isSuccess: <T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } => {
    return response.success && response.data !== undefined
  },
}

// Export everything for easy importing
// Removed self-reexport to fix circular export issue