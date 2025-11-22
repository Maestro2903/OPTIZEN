import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

// Type definitions for better type safety
export type Patient = Database['public']['Tables']['patients']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']

/**
 * Centralized API client for Supabase operations
 * This provides a clean abstraction layer over Supabase client
 */
class ApiClient {
  private supabase = createClient()

  /**
   * Get current user session
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error) throw error
    return user
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export the class for testing
export { ApiClient }