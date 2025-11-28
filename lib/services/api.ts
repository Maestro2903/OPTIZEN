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

      // Build headers object
      const headers: Record<string, string> = {}

      // Only set Content-Type for non-FormData requests
      // FormData needs the browser to set Content-Type with boundary automatically
      const isFormData = options.body instanceof FormData
      if (!isFormData) {
        headers['Content-Type'] = 'application/json'
      }

      // Only add Authorization header if token exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Merge with custom headers from options (options.headers override defaults)
      // Filter out undefined values to allow removing headers
      const customHeaders = options.headers ? 
        Object.fromEntries(
          Object.entries(options.headers).filter(([_, v]) => v !== undefined)
        ) : {}
      
      const finalHeaders = {
        ...headers,
        ...customHeaders,
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: finalHeaders,
      })

      const data = await response.json()

      if (!response.ok) {
        // Preserve error details from API response
        const errorMessage = data.details
          ? Array.isArray(data.details)
            ? data.details.join(', ')
            : typeof data.details === 'string'
            ? data.details
            : data.error || `HTTP ${response.status}`
          : data.error || `HTTP ${response.status}`
        throw new Error(errorMessage)
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

export interface PatientRecords {
  patient: Patient | null
  oldPatientId?: string
  oldRecords?: OldPatientRecord[]
  cases: Case[]
  appointments: Appointment[]
  invoices: Invoice[]
  prescriptions: any[] // Prescription with items
  certificates: Certificate[]
  operations: Operation[]
  discharges: Discharge[]
  bedAssignments: any[] // BedAssignment with bed info
  opticalOrders: any[] // OpticalOrder with frame info
  summary: {
    totalCases: number
    totalAppointments: number
    totalInvoices: number
    totalPrescriptions: number
    totalCertificates: number
    totalOperations: number
    totalDischarges: number
    totalBedAssignments: number
    totalOpticalOrders: number
    totalOldRecords?: number
  }
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

  getPatientRecords: (id: string) =>
    apiService.fetchApi<PatientRecords>(`/patients/${id}/records`),
}

// ===============================
// CASES API
// ===============================

// JSONB field types for Case
export interface CaseComplaint {
  categoryId?: string | null
  complaintId: string
  duration?: string
  eye?: string
  notes?: string
}

export interface CaseTreatment {
  drug_id: string
  dosage_id?: string
  route_id?: string
  duration?: string
  eye?: string
  quantity?: string
  drug_name?: string
  dosage_name?: string
  route_name?: string
}

export interface CaseDiagnosticTest {
  test_id: string
  eye?: string
  type?: string
  problem?: string
  notes?: string
}

export interface VisionData {
  unaided?: {
    right?: string
    left?: string
  }
  pinhole?: {
    right?: string
    left?: string
  }
  aided?: {
    right?: string
    left?: string
  }
  near?: {
    right?: string
    left?: string
  }
}

export interface ExaminationData {
  refraction?: any
  anterior_segment?: any
  posterior_segment?: any
  tests?: {
    iop?: {
      right?: { id: string; value: string }
      left?: { id: string; value: string }
    }
    sac_test?: {
      right?: string
      left?: string
    } | string // Support both new structure (object with right/left) and legacy (string)
  }
  blood_investigation?: {
    blood_pressure?: string
    blood_sugar?: string
    blood_tests?: string[]
  }
  surgeries?: Array<{
    eye: string
    surgery_name: string
    anesthesia: string
  }>
  diagrams?: {
    right?: string
    left?: string
  }
  remarks?: string
}

export interface PastMedication {
  medicine_id?: string
  medicine_name: string
  type?: string
  dosage?: string
  frequency?: string
  duration?: string
  notes?: string
}

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
  diagnosis?: string | string[]
  treatment_plan?: string
  medications_prescribed?: string
  follow_up_instructions?: string
  advice_remarks?: string  // ✅ Added missing field
  status: 'active' | 'completed' | 'cancelled' | 'pending'
  complaints?: CaseComplaint[]
  treatments?: CaseTreatment[]
  diagnostic_tests?: CaseDiagnosticTest[]
  past_medications?: PastMedication[]
  vision_data?: VisionData
  examination_data?: ExaminationData
  created_by?: string
  provider_id?: string
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender' | 'date_of_birth' | 'state'>
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
  provider_id: string
  appointment_date: string
  start_time: string
  end_time: string
  type: 'consult' | 'follow-up' | 'surgery' | 'refraction' | 'other'
  status: 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  room?: string
  notes?: string
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  users?: Pick<Employee, 'id' | 'full_name' | 'email' | 'role'> // Provider/doctor joined from users table
  created_at: string
  updated_at: string
  updated_by?: string
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
// APPOINTMENT REQUESTS API
// ===============================

export interface AppointmentRequest {
  id: string
  full_name: string
  email: string | null
  mobile: string
  gender: string
  date_of_birth: string | null
  appointment_date: string
  start_time: string
  end_time: string
  type: string
  provider_id: string | null
  reason: string | null
  notes: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  processed_by: string | null
  processed_at: string | null
  patient_id: string | null
  appointment_id: string | null
}

export interface AppointmentRequestFilters extends PaginationParams {
  status?: string
  search?: string
}

export const appointmentRequestsApi = {
  list: (params: AppointmentRequestFilters = {}) =>
    apiService.getList<AppointmentRequest>('appointment-requests', params),

  getById: (id: string) =>
    apiService.getById<AppointmentRequest>('appointment-requests', id),

  accept: (id: string, patientData: any) =>
    apiService.fetchApi<{ patient: any; appointment: any; request: AppointmentRequest }>(
      `/appointment-requests/${id}/accept`,
      {
        method: 'POST',
        body: JSON.stringify(patientData),
      }
    ),

  reject: (id: string, reason?: string) =>
    apiService.fetchApi<AppointmentRequest>(
      `/appointment-requests/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    ),
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
  payment_status: 'paid' | 'partial' | 'unpaid' | 'overdue'
  payment_method?: string
  notes?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  items?: Array<{
    service: string
    description?: string
    quantity: number
    rate: number
    amount: number
  }>
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

export interface InvoiceMetrics {
  total_invoices: number
  total_revenue: number
  paid_amount: number
  pending_amount: number
  payment_status: {
    paid: number
    unpaid: number
    partial: number
  }
  invoice_status: {
    draft: number
    sent: number
    overdue: number
  }
  collection_rate: string
  average_invoice_value: string
  date_range: {
    from: string | null
    to: string | null
  }
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

  metrics: (params: { date_from?: string; date_to?: string } = {}): Promise<ApiResponse<InvoiceMetrics>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value))
    })
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<InvoiceMetrics>(`/invoices/metrics${query}`)
  },
}

// ===============================
// EMPLOYEES API
// ===============================

export interface Employee {
  id: string
  employee_id?: string
  full_name: string
  email: string
  phone: string
  role: string
  department?: string
  position?: string
  hire_date?: string
  salary?: number
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  qualifications?: string
  license_number?: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
  marital_status?: string
  experience?: string
  is_active: boolean // Primary status field (boolean in DB)
  avatar_url?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
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

  create: (data: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) =>
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
  bed_number?: string
  status?: string
  bed_type?: string
  floor_number?: number
  room_number?: string
  daily_rate?: number
  facilities?: string | string[]
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
  name: string
  generic_name?: string
  manufacturer?: string
  category: string
  supplier?: string
  unit_price: number
  mrp: number
  stock_quantity: number
  reorder_level: number
  batch_number?: string
  expiry_date?: string
  hsn_code?: string
  gst_percentage?: number
  prescription_required?: boolean
  dosage_form?: string
  strength?: string
  storage_instructions?: string
  description?: string
  image_url?: string
  is_low_stock?: boolean
  created_at: string
  updated_at: string
}

export interface PharmacyFilters extends PaginationParams {
  category?: string
  low_stock?: boolean
}

export interface PharmacyMetrics {
  total_items: number
  low_stock_count: number
  out_of_stock_count: number
  total_inventory_value: number
  average_unit_price: number
  low_stock_by_computed: number
  items_above_reorder: number
}

export const pharmacyApi = {
  list: (params: PharmacyFilters = {}) =>
    apiService.getList<PharmacyItem>('pharmacy', params),

  getById: (id: string) =>
    apiService.getById<PharmacyItem>('pharmacy', id),

  create: (data: Omit<PharmacyItem, 'id' | 'created_at' | 'updated_at' | 'is_low_stock'>) =>
    apiService.create<PharmacyItem>('pharmacy', data),

  update: (id: string, data: Partial<PharmacyItem>) =>
    apiService.update<PharmacyItem>('pharmacy', id, data),

  delete: (id: string) =>
    apiService.delete<PharmacyItem>('pharmacy', id),

  metrics: (): Promise<ApiResponse<PharmacyMetrics>> => {
    return apiService.fetchApi<PharmacyMetrics>('/pharmacy/metrics')
  },
}

// ===============================
// OPTICAL PLAN API
// ===============================

export interface OpticalItem {
  id: string
  item_type: 'medicine' | 'frames' | 'lenses' | 'accessories' | 'equipment' | 'consumables'
  name: string
  brand?: string
  model?: string
  sku: string
  description?: string
  category: string
  sub_category?: string
  size?: string
  color?: string
  material?: string
  gender?: string
  purchase_price: number
  selling_price: number
  mrp: number
  stock_quantity: number
  reorder_level: number
  supplier?: string
  image_url?: string
  warranty_months?: number
  hsn_code?: string
  gst_percentage?: number
  created_at: string
  updated_at: string
}

export interface OpticalFilters extends PaginationParams {
  category?: string
  item_type?: string
  low_stock?: boolean
}

export interface OpticalMetrics {
  total_items: number
  low_stock_count: number
  out_of_stock_count: number
  total_inventory_value: number
  total_potential_revenue: number
  average_purchase_price: number
  items_above_reorder: number
}

export const opticalPlanApi = {
  list: (params: OpticalFilters = {}) =>
    apiService.getList<OpticalItem>('optical-plan', params),

  getById: (id: string) =>
    apiService.getById<OpticalItem>('optical-plan', id),

  create: (data: Omit<OpticalItem, 'id' | 'created_at' | 'updated_at'>) =>
    apiService.create<OpticalItem>('optical-plan', data),

  update: (id: string, data: Partial<OpticalItem>) =>
    apiService.update<OpticalItem>('optical-plan', id, data),

  delete: (id: string) =>
    apiService.delete<OpticalItem>('optical-plan', id),

  metrics: (): Promise<ApiResponse<OpticalMetrics>> => {
    return apiService.fetchApi<OpticalMetrics>('/optical-plan/metrics')
  },
}

// ===============================
// STOCK MOVEMENTS API
// ===============================

export interface StockMovement {
  id: string
  movement_date: string
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'expired' | 'damaged'
  item_type: 'pharmacy' | 'optical'
  item_id: string
  item_name: string
  quantity: number
  unit_price: number | null
  total_value: number | null
  batch_number: string | null
  reference_number: string | null
  supplier: string | null
  customer_name: string | null
  invoice_id: string | null
  user_id: string | null
  notes: string | null
  previous_stock: number | null
  new_stock: number | null
  created_at: string
}

export interface StockMovementFilters extends PaginationParams {
  item_type?: 'pharmacy' | 'optical'
  item_id?: string
  movement_type?: 'purchase' | 'sale' | 'adjustment' | 'return' | 'expired' | 'damaged'
  date_from?: string
  date_to?: string
}

export const stockMovementsApi = {
  list: (params: StockMovementFilters = {}) =>
    apiService.getList<StockMovement>('stock-movements', params),

  getById: (id: string) =>
    apiService.getById<StockMovement>('stock-movements', id),

  create: (data: Omit<StockMovement, 'id' | 'created_at' | 'previous_stock' | 'new_stock'>) =>
    apiService.create<StockMovement>('stock-movements', data),

  update: (id: string, data: Partial<StockMovement>) =>
    apiService.update<StockMovement>('stock-movements', id, data),

  delete: (id: string) =>
    apiService.delete<StockMovement>('stock-movements', id),
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

  // Get attendance summary/metrics
  getSummary: (params: { date?: string; date_from?: string; date_to?: string } = {}) => {
    const queryParams = new URLSearchParams()
    if (params.date) queryParams.append('date', params.date)
    if (params.date_from) queryParams.append('date_from', params.date_from)
    if (params.date_to) queryParams.append('date_to', params.date_to)
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<{
      total_staff: number
      present: number
      absent: number
      on_leave: number
      attendance_percentage: number
      average_working_hours: number
    }>(`/attendance/metrics${query}`, {
      method: 'GET',
    })
  },
  // Bulk create attendance records
  bulkCreate: (data: { attendance_date: string; default_status: string; employees: any[] }) =>
    apiService.fetchApi<AttendanceRecord[]>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
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
  follow_up_date?: string
  follow_up_visit_type?: string
  follow_up_notes?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  patients?: Pick<Patient, 'id' | 'patient_id' | 'full_name' | 'email' | 'mobile' | 'gender'>
  encounters?: {
    id: string
    encounter_date?: string
    diagnosis?: string | string[]
    chief_complaint?: string
  }
  cases?: {
    id: string
    case_no?: string
    diagnosis?: string | string[]
  } // Keep for backward compatibility
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  deleted_at?: string
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
  final_diagnosis?: {
    ids: string[]
    labels: string[]
  } | string | null // Support JSONB object, legacy string, or null
  treatment_given?: {
    ids: string[]
    labels: string[]
  } | string | null // Support JSONB object, legacy string, or null
  condition_on_discharge?: string
  instructions?: string
  follow_up_date?: string
  medications?: {
    medicines: {
      ids: string[]
      labels: string[]
    }
    dosages: {
      ids: string[]
      labels: string[]
    }
  } | string | null // Support JSONB object, legacy string, or null
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
  bed_type: string
  floor_number: number
  room_number?: string
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning'
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
// EXPENSES API
// ===============================

export interface Expense {
  id: string
  expense_date: string
  category: string
  sub_category?: string
  description: string
  amount: number
  payment_method?: string
  vendor?: string
  bill_number?: string
  approved_by?: string
  added_by?: string
  notes?: string
  receipt_url?: string
  created_at: string
  updated_at: string
}

export interface ExpenseFilters extends PaginationParams {
  category?: string
  date_from?: string
  date_to?: string
}

export interface ExpenseMetrics {
  total_expenses: number
  this_month_expenses: number
  last_month_expenses: number
  expenses_change: number
  total_expense_entries: number
  average_expense_per_entry: number
  expenses_by_category: Record<string, number>
  expenses_by_payment_method: Record<string, number>
  this_month_expenses_by_category: Record<string, number>
  date_range: {
    from: string | null
    to: string | null
  }
}

export const expensesApi = {
  list: (params: ExpenseFilters = {}) =>
    apiService.getList<Expense>('expenses', params),

  getById: (id: string) =>
    apiService.getById<Expense>('expenses', id),

  create: (data: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'added_by'>) =>
    apiService.create<Expense>('expenses', data),

  update: (id: string, data: Partial<Expense>) =>
    apiService.update<Expense>('expenses', id, data),

  delete: (id: string) =>
    apiService.delete<Expense>('expenses', id),

  metrics: (params: { date_from?: string; date_to?: string } = {}): Promise<ApiResponse<ExpenseMetrics>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value))
    })
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<ExpenseMetrics>(`/expenses/metrics${query}`)
  },
}

// ===============================
// FINANCE DASHBOARD API
// ===============================

export interface FinanceDashboard {
  summary: {
    totalRevenue: number
    totalPaid: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    totalOutstanding: number
  }
  comparison: {
    revenueChange: number
    expenseChange: number
    profitChange: number
  }
  invoiceStats: {
    total: number
    paid: number
    unpaid: number
    partial: number
    byStatus: {
      draft: number
      sent: number
      paid: number
      overdue: number
      cancelled: number
    }
  }
  expenseStats: {
    total: number
    totalAmount: number
    byCategory: Record<string, number>
  }
  recentTransactions: Array<{
    id: any
    date: string
    type: string
    amount: number
    status: string
  }>
  dateRange: {
    from: string
    to: string
  }
}

export const financeApi = {
  getDashboard: (params: { date_from?: string; date_to?: string } = {}): Promise<ApiResponse<FinanceDashboard>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value))
    })
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<FinanceDashboard>(`/finance/dashboard${query}`)
  },
}

// ===============================
// FINANCE REVENUE API
// ===============================

export interface FinanceRevenue {
  id: string
  entry_date: string
  revenue_type: 'consultation' | 'surgery' | 'pharmacy' | 'diagnostic' | 'lab' | 'other'
  description: string
  amount: number
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'other'
  payment_status: 'received' | 'pending' | 'partial'
  paid_amount: number
  patient_id?: string
  patient_name?: string
  invoice_reference?: string
  category?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FinanceRevenueMetrics {
  total_revenue: number
  this_month_revenue: number
  last_month_revenue: number
  revenue_change: number
  received_revenue: number
  pending_revenue: number
  total_entries: number
  payment_status: {
    received: number
    pending: number
    partial: number
  }
  average_revenue_per_entry: number
  date_range: {
    from: string | null
    to: string | null
  }
}

export const financeRevenueApi = {
  list: (params: PaginationParams & Record<string, any> = {}): Promise<ApiResponse<FinanceRevenue[]>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<FinanceRevenue[]>(`/finance-revenue${query}`)
  },
  
  getById: (id: string): Promise<ApiResponse<FinanceRevenue>> =>
    apiService.fetchApi<FinanceRevenue>(`/finance-revenue/${id}`),
  
  create: (data: Partial<FinanceRevenue>): Promise<ApiResponse<FinanceRevenue>> =>
    apiService.fetchApi<FinanceRevenue>('/finance-revenue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<FinanceRevenue>): Promise<ApiResponse<FinanceRevenue>> =>
    apiService.fetchApi<FinanceRevenue>(`/finance-revenue/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string): Promise<ApiResponse<FinanceRevenue>> =>
    apiService.fetchApi<FinanceRevenue>(`/finance-revenue/${id}`, {
      method: 'DELETE',
    }),

  metrics: (params: { date_from?: string; date_to?: string } = {}): Promise<ApiResponse<FinanceRevenueMetrics>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value))
    })
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<FinanceRevenueMetrics>(`/finance-revenue/metrics${query}`)
  },
}

// ===============================
// OLD PATIENT RECORDS API
// ===============================

export interface OldPatientRecordFile {
  id: string
  old_patient_record_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  file_url?: string // Signed URL for access
  uploaded_by: string
  created_at: string
}

export interface OldPatientRecord {
  id: string
  old_patient_id: string
  patient_name?: string
  uploaded_by: string
  upload_date: string
  notes?: string
  old_patient_record_files?: OldPatientRecordFile[]
  file_count?: number
  created_at: string
  updated_at: string
}

export interface OldPatientRecordFilters extends PaginationParams {
  search?: string
  old_patient_id?: string
}

export const oldPatientRecordsApi = {
  list: (params: OldPatientRecordFilters = {}) =>
    apiService.getList<OldPatientRecord>('old-patient-records', params),

  getByOldId: (oldPatientId: string) =>
    apiService.fetchApi<OldPatientRecord[]>(`/old-patient-records/${oldPatientId}`),

  upload: async (data: {
    old_patient_id: string
    patient_name?: string
    notes?: string
    files: File[]
  }): Promise<ApiResponse<OldPatientRecord>> => {
    const formData = new FormData()
    formData.append('old_patient_id', data.old_patient_id)
    if (data.patient_name) {
      formData.append('patient_name', data.patient_name)
    }
    if (data.notes) {
      formData.append('notes', data.notes)
    }
    
    // Append all files
    data.files.forEach((file) => {
      formData.append('files', file)
    })

    // FormData will be handled correctly by fetchApi (it won't set Content-Type)
    return apiService.fetchApi<OldPatientRecord>('/old-patient-records', {
      method: 'POST',
      body: formData,
    })
  },

  deleteRecord: (recordId: string) =>
    apiService.fetchApi(`/old-patient-records/record/${recordId}`, {
      method: 'DELETE',
    }),

  addFiles: async (recordId: string, files: File[]): Promise<ApiResponse<OldPatientRecord>> => {
    const formData = new FormData()
    
    // Append all files
    files.forEach((file) => {
      formData.append('files', file)
    })

    return apiService.fetchApi<OldPatientRecord>(`/old-patient-records/record/${recordId}/files`, {
      method: 'POST',
      body: formData,
    })
  },

  delete: (oldPatientId: string) =>
    apiService.fetchApi<{ success: boolean; message: string }>(
      `/old-patient-records/${oldPatientId}`,
      { method: 'DELETE' }
    ),
}

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