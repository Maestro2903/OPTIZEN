import { type User } from './api-client'
import { createClient } from '@/lib/supabase/client'

/**
 * User Service - Handles all user and authentication-related API operations
 */
export class UserService {
  private supabase = createClient()

  /**
   * Get all users with optional filtering
   */
  async getUsers(params?: {
    role?: string
    active?: boolean
    limit?: number
    offset?: number
  }): Promise<User[]> {
    let query = this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (params?.role) {
      query = query.eq('role', params.role)
    }

    if (params?.active !== undefined) {
      query = query.eq('is_active', params.active)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch users: ${error.message}`)
    return data || []
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch user: ${error.message}`)
    }
    return data
  }

  /**
   * Update user profile
   */
  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update user profile: ${error.message}`)
    return data
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    return this.getUsers({ role, active: true })
  }
}

// Export singleton instance
export const userService = new UserService()