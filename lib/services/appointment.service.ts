import { type Appointment } from './api-client'
import { createClient } from '@/lib/supabase/client'

/**
 * Appointment Service - Handles all appointment-related API operations
 */
export class AppointmentService {
  private supabase = createClient()

  /**
   * Get appointments with optional filtering
   */
  async getAppointments(params?: {
    patientId?: string
    providerId?: string
    startDate?: string
    endDate?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<Appointment[]> {
    let query = this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        provider:users(*)
      `)
      .order('appointment_date', { ascending: true })

    if (params?.patientId) {
      query = query.eq('patient_id', params.patientId)
    }

    if (params?.providerId) {
      query = query.eq('provider_id', params.providerId)
    }

    if (params?.startDate) {
      query = query.gte('appointment_date', params.startDate)
    }

    if (params?.endDate) {
      query = query.lte('appointment_date', params.endDate)
    }

    if (params?.status) {
      query = query.eq('status', params.status)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch appointments: ${error.message}`)
    return data || []
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getAppointments({
      startDate: `${today}T00:00:00.000Z`,
      endDate: `${today}T23:59:59.999Z`
    })
  }

  /**
   * Get upcoming appointments for a patient
   */
  async getUpcomingAppointments(patientId: string, limit = 5): Promise<Appointment[]> {
    const now = new Date().toISOString()
    return this.getAppointments({
      patientId,
      startDate: now,
      limit
    })
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<Appointment | null> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        provider:users(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch appointment: ${error.message}`)
    }
    return data
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        patient:patients(*),
        provider:users(*)
      `)
      .single()

    if (error) throw new Error(`Failed to create appointment: ${error.message}`)
    return data
  }

  /**
   * Update an appointment
   */
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        patient:patients(*),
        provider:users(*)
      `)
      .single()

    if (error) throw new Error(`Failed to update appointment: ${error.message}`)
    return data
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
    })
  }

  /**
   * Check-in a patient for their appointment
   */
  async checkInAppointment(id: string): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'checked-in'
    })
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(id: string): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'completed'
    })
  }

  /**
   * Get available time slots for a provider on a specific date
   */
  async getAvailableTimeSlots(providerId: string, date: string): Promise<string[]> {
    // Get existing appointments for the provider on this date
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const existingAppointments = await this.getAppointments({
      providerId,
      startDate: startOfDay,
      endDate: endOfDay
    })

    // Generate all possible time slots (assuming 9 AM to 5 PM, 30-minute slots)
    const allSlots: string[] = []
    const startHour = 9
    const endHour = 17

    for (let hour = startHour; hour < endHour; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    // Filter out booked slots
    const bookedTimes = existingAppointments.map(apt => {
      const aptDate = new Date(apt.appointment_date)
      return `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`
    })

    return allSlots.filter(slot => !bookedTimes.includes(slot))
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(dateRange?: { start: string; end: string }): Promise<{
    total: number
    scheduled: number
    completed: number
    cancelled: number
    noShows: number
  }> {

    if (dateRange) {
      // Apply date range filter to all queries
      const queries = await Promise.all([
        this.supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_date', dateRange.start).lte('appointment_date', dateRange.end),
        this.supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_date', dateRange.start).lte('appointment_date', dateRange.end).eq('status', 'scheduled'),
        this.supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_date', dateRange.start).lte('appointment_date', dateRange.end).eq('status', 'completed'),
        this.supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_date', dateRange.start).lte('appointment_date', dateRange.end).eq('status', 'cancelled'),
        this.supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_date', dateRange.start).lte('appointment_date', dateRange.end).eq('status', 'no-show')
      ])

      return {
        total: queries[0].count || 0,
        scheduled: queries[1].count || 0,
        completed: queries[2].count || 0,
        cancelled: queries[3].count || 0,
        noShows: queries[4].count || 0,
      }
    }

    const [totalResult, scheduledResult, completedResult, cancelledResult, noShowResult] = await Promise.all([
      this.supabase.from('appointments').select('id', { count: 'exact', head: true }),
      this.supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      this.supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      this.supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      this.supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'no-show')
    ])

    return {
      total: totalResult.count || 0,
      scheduled: scheduledResult.count || 0,
      completed: completedResult.count || 0,
      cancelled: cancelledResult.count || 0,
      noShows: noShowResult.count || 0,
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService()