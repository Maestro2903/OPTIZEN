import { apiClient, type User } from './api-client'
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
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<User | null> {
    const authUser = await apiClient.getCurrentUser()
    if (!authUser) return null

    return this.getUserById(authUser.id)
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

  /**
   * Get all providers (doctors, nurses, etc.)
   */
  async getProviders(): Promise<User[]> {
    const providerRoles = ['doctor', 'nurse', 'technician']
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .in('role', providerRoles)
      .eq('is_active', true)
      .order('first_name', { ascending: true })

    if (error) throw new Error(`Failed to fetch providers: ${error.message}`)
    return data || []
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    role: string
    phone?: string
    license_number?: string
    specialization?: string
  }): Promise<User> {
    try {
      // First create auth user
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      })

      if (authError) throw new Error(`Failed to create auth user: ${authError.message}`)

      // Then create user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          phone: userData.phone,
          license_number: userData.license_number,
          specialization: userData.specialization,
          is_active: true
        })
        .select()
        .single()

      if (profileError) throw new Error(`Failed to create user profile: ${profileError.message}`)

      return userProfile
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(id: string): Promise<User> {
    return this.updateUserProfile(id, { is_active: false })
  }

  /**
   * Activate a user
   */
  async activateUser(id: string): Promise<User> {
    return this.updateUserProfile(id, { is_active: true })
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, newRole: User['role']): Promise<User> {
    return this.updateUserProfile(id, { role: newRole })
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number
    active: number
    byRole: Record<string, number>
  }> {
    const [allUsers] = await Promise.all([
      this.supabase.from('users').select('role, is_active')
    ])

    const { data: users, error } = allUsers
    if (error) throw new Error(`Failed to fetch user stats: ${error.message}`)

    const stats = (users || []).reduce((acc, user) => {
      acc.total++
      if (user.is_active) acc.active++

      acc.byRole[user.role] = (acc.byRole[user.role] || 0) + 1

      return acc
    }, {
      total: 0,
      active: 0,
      byRole: {} as Record<string, number>
    })

    return stats
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%, last_name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('first_name', { ascending: true })
      .limit(20)

    if (error) throw new Error(`Failed to search users: ${error.message}`)
    return data || []
  }

  /**
   * Check if user has permission for a specific action
   */
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.getUserById(userId)
    if (!user || !user.is_active) return false

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // Admin has all permissions
      doctor: ['read_patients', 'write_patients', 'read_appointments', 'write_appointments', 'read_clinical', 'write_clinical'],
      nurse: ['read_patients', 'write_patients', 'read_appointments', 'write_appointments'],
      technician: ['read_patients', 'read_appointments'],
      receptionist: ['read_patients', 'write_patients', 'read_appointments', 'write_appointments'],
      billing_staff: ['read_patients', 'read_billing', 'write_billing'],
      pharmacist: ['read_patients', 'read_pharmacy', 'write_pharmacy'],
      patient: ['read_own_data']
    }

    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes('*') || userPermissions.includes(permission)
  }
}

// Export singleton instance
export const userService = new UserService()