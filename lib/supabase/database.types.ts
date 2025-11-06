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
      pharmacy_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          generic_name: string | null
          category: string
          manufacturer: string | null
          supplier: string | null
          unit_price: number
          mrp: number
          stock_quantity: number
          reorder_level: number
          batch_number: string | null
          expiry_date: string | null
          hsn_code: string | null
          gst_percentage: number | null
          prescription_required: boolean
          dosage_form: string | null
          strength: string | null
          storage_instructions: string | null
          description: string | null
          image_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['pharmacy_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pharmacy_items']['Insert']>
      }
      optical_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          item_type: 'medicine' | 'frames' | 'lenses' | 'accessories' | 'equipment' | 'consumables'
          name: string
          brand: string | null
          model: string | null
          sku: string
          description: string | null
          category: string
          sub_category: string | null
          size: string | null
          color: string | null
          material: string | null
          gender: string | null
          purchase_price: number
          selling_price: number
          mrp: number
          stock_quantity: number
          reorder_level: number
          supplier: string | null
          image_url: string | null
          warranty_months: number | null
          hsn_code: string | null
          gst_percentage: number | null
        }
        Insert: Omit<Database['public']['Tables']['optical_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['optical_items']['Insert']>
      }
      stock_movements: {
        Row: {
          id: string
          created_at: string
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
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>
      }
      staff_attendance: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          attendance_date: string
          status: 'present' | 'absent' | 'sick_leave' | 'casual_leave' | 'paid_leave' | 'half_day'
          check_in_time: string | null
          check_out_time: string | null
          working_hours: number | null
          notes: string | null
          marked_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['staff_attendance']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['staff_attendance']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          expense_date: string
          category: 'salary' | 'utilities' | 'supplies' | 'maintenance' | 'rent' | 'marketing' | 'equipment' | 'other'
          sub_category: string | null
          description: string
          amount: number
          payment_method: string | null
          vendor: string | null
          bill_number: string | null
          approved_by: string | null
          added_by: string | null
          notes: string | null
          receipt_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      prescriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string
          encounter_id: string | null
          prescribed_by: string
          prescription_date: string
          diagnosis: string | null
          notes: string | null
          status: 'active' | 'completed' | 'cancelled'
        }
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
      }
      prescription_items: {
        Row: {
          id: string
          created_at: string
          prescription_id: string
          medicine_name: string
          dosage: string
          frequency: string
          duration: string
          quantity: number | null
          instructions: string | null
          pharmacy_item_id: string | null
          dispensed: boolean
          dispensed_date: string | null
          dispensed_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['prescription_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['prescription_items']['Insert']>
      }
      beds: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          bed_number: string
          ward_name: string
          ward_type: 'general' | 'icu' | 'private' | 'semi_private' | 'emergency'
          bed_type: string
          floor_number: number
          room_number: string | null
          status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning'
          daily_rate: number
          description: string | null
          facilities: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['beds']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['beds']['Insert']>
      }
      bed_assignments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          bed_id: string
          patient_id: string
          admission_date: string
          expected_discharge_date: string | null
          actual_discharge_date: string | null
          surgery_scheduled_time: string | null
          surgery_type: string | null
          admission_reason: string
          assigned_doctor_id: string | null
          notes: string | null
          status: 'active' | 'discharged' | 'transferred'
        }
        Insert: Omit<Database['public']['Tables']['bed_assignments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bed_assignments']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

