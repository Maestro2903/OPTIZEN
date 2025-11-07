import { type Patient } from './api-client'
import { createClient } from '@/lib/supabase/client'

/**
 * Patient Service - Handles all patient-related API operations
 */
export class PatientService {
  private supabase = createClient()

  /**
   * Get all patients with optional filtering and pagination
   */
  async getPatients(params?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<Patient[]> {
    let query = this.supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (params?.search) {
      query = query.or(`first_name.ilike.%${params.search}%, last_name.ilike.%${params.search}%, mrn.ilike.%${params.search}%, phone.ilike.%${params.search}%, email.ilike.%${params.search}%`)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch patients: ${error.message}`)
    return data || []
  }

  /**
   * Get a single patient by ID
   */
  async getPatientById(id: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch patient: ${error.message}`)
    }
    return data
  }

  /**
   * Get patient by MRN (Medical Record Number)
   */
  async getPatientByMRN(mrn: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('mrn', mrn)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch patient by MRN: ${error.message}`)
    }
    return data
  }

  /**
   * Create a new patient
   */
  async createPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const { data, error } = await this.supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()

    if (error) throw new Error(`Failed to create patient: ${error.message}`)
    return data
  }

  /**
   * Update a patient
   */
  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const { data, error } = await this.supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update patient: ${error.message}`)
    return data
  }

  /**
   * Delete a patient (soft delete by setting status to inactive)
   */
  async deletePatient(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('patients')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete patient: ${error.message}`)
    return true
  }

  /**
   * Search patients by various criteria
   */
  async searchPatients(searchTerm: string): Promise<Patient[]> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%, last_name.ilike.%${searchTerm}%, mrn.ilike.%${searchTerm}%, phone.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(`Failed to search patients: ${error.message}`)
    return data || []
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<{
    total: number
    active: number
    newThisMonth: number
  }> {
    const [totalResult, activeResult, newThisMonthResult] = await Promise.all([
      this.supabase.from('patients').select('id', { count: 'exact', head: true }),
      this.supabase.from('patients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      this.supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      newThisMonth: newThisMonthResult.count || 0,
    }
  }
}

// Export singleton instance
export const patientService = new PatientService()