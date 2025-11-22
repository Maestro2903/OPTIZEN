"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole, hasPermission, hasModuleAccess, PERMISSIONS } from '@/lib/rbac-client'
import type { User } from '@supabase/supabase-js'

interface UserData {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
  is_active: boolean
}

interface UserContextType {
  user: UserData | null
  session: User | null
  loading: boolean
  hasPermission: (
    resource: keyof typeof PERMISSIONS[UserRole],
    action: 'view' | 'create' | 'print' | 'edit' | 'delete'
  ) => boolean
  hasModuleAccess: (resource: keyof typeof PERMISSIONS[UserRole]) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [session, setSession] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      
      if (!authSession) {
        setUser(null)
        setSession(null)
        return
      }

      setSession(authSession.user)

      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, phone, avatar_url, is_active')
        .eq('id', authSession.user.id)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
        setUser(null)
        setSession(null)
        return
      }

      // Check if user is active
      if (!userData.is_active) {
        console.warn('User account is inactive')
        setUser(null)
        setSession(null)
        // Sign out inactive user
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.error('Error signing out inactive user:', signOutError)
        }
        return
      }

      // Validate role before type assertion
      const validRoles: UserRole[] = [
        'super_admin',
        'hospital_admin',
        'receptionist',
        'optometrist',
        'ophthalmologist',
        'technician',
        'billing_staff',
        'patient',
        'doctor', // Legacy/alias role - treated as ophthalmologist
        'admin',
        'nurse',
        'finance',
        'pharmacy_staff',
        'pharmacy', // Alias for pharmacy_staff
        'lab_technician',
        'manager',
        'read_only'
      ]
      
      if (!validRoles.includes(userData.role as UserRole)) {
        console.error('Invalid user role from database:', userData.role)
        setUser(null)
        setSession(null)
        return
      }

      setUser(userData as UserData)
    } catch (error) {
      console.error('Error in fetchUser:', error)
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, authSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUser, supabase])

  const contextHasPermission = useCallback((
    resource: keyof typeof PERMISSIONS[UserRole],
    action: 'view' | 'create' | 'print' | 'edit' | 'delete'
  ): boolean => {
    if (!user) return false
    return hasPermission(user.role, resource, action)
  }, [user])

  const contextHasModuleAccess = useCallback((
    resource: keyof typeof PERMISSIONS[UserRole]
  ): boolean => {
    if (!user) return false
    return hasModuleAccess(user.role, resource)
  }, [user])

  const isAdmin = useCallback((): boolean => {
    if (!user) return false
    return user.role === 'super_admin' || user.role === 'hospital_admin'
  }, [user])

  const isSuperAdmin = useCallback((): boolean => {
    if (!user) return false
    return user.role === 'super_admin'
  }, [user])

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      hasPermission: contextHasPermission,
      hasModuleAccess: contextHasModuleAccess,
      isAdmin,
      isSuperAdmin,
      refreshUser,
    }),
    [user, session, loading, contextHasPermission, contextHasModuleAccess, isAdmin, isSuperAdmin, refreshUser]
  )

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

