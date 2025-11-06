export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          mrn: string
          first_name: string
          last_name: string
          date_of_birth: string
          gender: 'male' | 'female' | 'other'
          phone: string
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          emergency_contact: string | null
          insurance_provider: string | null
          insurance_number: string | null
          allergies: string[] | null
          systemic_conditions: string[] | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string
          provider_id: string
          appointment_date: string
          start_time: string
          end_time: string
          type: 'consult' | 'follow-up' | 'surgery' | 'refraction' | 'other'
          status: 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
          room: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      encounters: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string
          provider_id: string
          appointment_id: string | null
          encounter_date: string
          chief_complaint: string
          va_od: string | null
          va_os: string | null
          iop_od: number | null
          iop_os: number | null
          refraction_od: Json | null
          refraction_os: Json | null
          anterior_segment_od: string | null
          anterior_segment_os: string | null
          fundus_od: string | null
          fundus_os: string | null
          diagnosis: string[] | null
          plan: string | null
          notes: string | null
          signed_by: string | null
          signed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['encounters']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['encounters']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string
          encounter_id: string | null
          invoice_number: string
          invoice_date: string
          due_date: string
          subtotal: number
          tax: number
          discount: number
          total: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          payment_method: string | null
          paid_at: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string
          role: 'super_admin' | 'hospital_admin' | 'receptionist' | 'optometrist' | 'ophthalmologist' | 'technician' | 'billing_staff' | 'patient'
          phone: string | null
          avatar_url: string | null
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

