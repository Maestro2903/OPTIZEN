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
   * Get current session
   */
  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession()
    if (error) throw error
    return session
  }

  /**
   * Sign out user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
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

  /**
   * Generic query method with error handling
   */
  async executeQuery<T>(queryBuilder: any): Promise<T> {
    const { data, error } = await queryBuilder
    if (error) {
      console.error('API Client Error:', error)
      throw new Error(error.message)
    }
    return data
  }

  /**
   * Batch operations helper
   */
  async executeBatch(operations: Array<() => Promise<any>>): Promise<any[]> {
    try {
      return await Promise.all(operations.map(op => op()))
    } catch (error) {
      console.error('Batch operation failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export the class for testing
export { ApiClient }