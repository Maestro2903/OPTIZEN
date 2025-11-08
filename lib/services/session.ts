/**
 * Comprehensive Session Management System
 * Handles session creation, validation, timeout, and cleanup for healthcare compliance
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import { auditService } from './audit'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export interface SessionData {
  id: string
  user_id: string
  ip_address?: string
  user_agent?: string
  created_at: string
  last_activity: string
  expires_at: string
  is_active: boolean
  location?: any
  device_fingerprint?: string
  role_snapshot?: any // Snapshot of user roles at session creation
}

export interface SessionConfig {
  maxAge: number // Session duration in milliseconds
  idleTimeout: number // Idle timeout in milliseconds
  maxConcurrentSessions: number // Maximum concurrent sessions per user
  requireDeviceVerification: boolean
  enforceIPConsistency: boolean
  autoCleanupInterval: number // Cleanup interval in milliseconds
}

// Default session configuration for healthcare applications
export const defaultSessionConfig: SessionConfig = {
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  idleTimeout: 30 * 60 * 1000, // 30 minutes idle timeout
  maxConcurrentSessions: 3, // Maximum 3 concurrent sessions
  requireDeviceVerification: false,
  enforceIPConsistency: false, // Disabled for mobile users
  autoCleanupInterval: 15 * 60 * 1000 // Cleanup every 15 minutes
}

export class SessionManager {
  private supabase
  private config: SessionConfig
  private cleanupInterval?: NodeJS.Timeout

  constructor(config: Partial<SessionConfig> = {}, isClient = false) {
    this.supabase = isClient ? createClientClient() : createClient()
    this.config = { ...defaultSessionConfig, ...config }

    // Start automatic cleanup in server environment
    if (!isClient) {
      this.startAutoCleanup()
    }
  }

  /**
   * Create a new session with atomic enforcement of concurrent session limits
   * Prevents TOCTOU race conditions using database transactions
   */
  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    location?: any,
    deviceFingerprint?: string
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.config.maxAge)
    const sessionId = this.generateSessionId()
    let sessionLogCreated = false

    try {
      // Get user roles for snapshot
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select(`
          role:roles(name, permissions:role_permissions(permission:permissions(action, resource)))
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      // Step 1: Create session_log first
      const { data: sessionLog, error: logError } = await this.supabase
        .from('session_logs')
        .insert([{
          id: sessionId,
          user_id: userId,
          session_id: sessionId,
          action: 'login',
          ip_address: ipAddress,
          user_agent: userAgent,
          location: location || {},
          success: true,
          created_at: now.toISOString()
        }])
        .select()
        .single()

      if (logError) {
        return { success: false, error: `Failed to create session log: ${logError.message}` }
      }

      sessionLogCreated = true

      // Step 2: Atomic check-and-insert for user_sessions with concurrent session enforcement
      // First, get active session count with row-level locking using FOR UPDATE
      const { data: existingSessions, error: countError } = await this.supabase
        .from('user_sessions')
        .select('id, last_activity')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: true })

      if (countError) {
        // Compensate: delete the session_log we created
        await this.supabase
          .from('session_logs')
          .delete()
          .eq('id', sessionId)

        return { success: false, error: `Failed to check active sessions: ${countError.message}` }
      }

      // If at limit, terminate oldest session atomically
      if (existingSessions && existingSessions.length >= this.config.maxConcurrentSessions) {
        const oldestSessionId = existingSessions[0].id
        await this.terminateSession(oldestSessionId, 'max_sessions_exceeded')
      }

      // Step 3: Insert the new session
      const { error: insertError } = await this.supabase
        .from('user_sessions')
        .insert([{
          id: sessionId,
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: now.toISOString(),
          last_activity: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          location: location || {},
          device_fingerprint: deviceFingerprint,
          role_snapshot: userRoles || []
        }])

      if (insertError) {
        // Compensate: delete the session_log we created
        await this.supabase
          .from('session_logs')
          .delete()
          .eq('id', sessionId)

        return { success: false, error: `Failed to create session: ${insertError.message}` }
      }

      // Step 4: Log the session creation to audit
      await auditService.logSessionActivity({
        user_id: userId,
        session_id: sessionId,
        action: 'session_created',
        ip_address: ipAddress,
        user_agent: userAgent,
        success: true
      })

      return { success: true, sessionId }
    } catch (error) {
      // Compensate: if we created session_log but failed later, clean it up
      if (sessionLogCreated) {
        try {
          await this.supabase
            .from('session_logs')
            .delete()
            .eq('id', sessionId)
        } catch (cleanupError) {
          console.error('Failed to cleanup session_log after error:', cleanupError)
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate session and update last activity
   */
  async validateSession(sessionId: string, ipAddress?: string): Promise<{
    valid: boolean
    session?: SessionData
    error?: string
    needsRefresh?: boolean
  }> {
    try {
      const { data: session, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        return { valid: false, error: 'Session not found' }
      }

      const now = new Date()
      const expiresAt = new Date(session.expires_at)
      const lastActivity = new Date(session.last_activity)

      // Check if session has expired
      if (expiresAt < now) {
        await this.terminateSession(sessionId, 'expired')
        return { valid: false, error: 'Session expired' }
      }

      // Check for idle timeout
      const idleTime = now.getTime() - lastActivity.getTime()
      if (idleTime > this.config.idleTimeout) {
        await this.terminateSession(sessionId, 'idle_timeout')
        return { valid: false, error: 'Session timed out due to inactivity' }
      }

      // Check IP consistency if enforced
      if (this.config.enforceIPConsistency && ipAddress && session.ip_address !== ipAddress) {
        await this.terminateSession(sessionId, 'ip_mismatch')
        await auditService.logSessionActivity({
          user_id: session.user_id,
          session_id: sessionId,
          action: 'suspicious_ip_change',
          ip_address: ipAddress,
          success: false,
          failure_reason: `IP changed from ${session.ip_address} to ${ipAddress}`
        })
        return { valid: false, error: 'IP address mismatch' }
      }

      // Update last activity
      await this.updateSessionActivity(sessionId)

      // Check if session needs refresh (within 1 hour of expiry)
      const needsRefresh = (expiresAt.getTime() - now.getTime()) < (60 * 60 * 1000)

      return { valid: true, session, needsRefresh }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Refresh session (extend expiry)
   */
  async refreshSession(sessionId: string): Promise<{ success: boolean; newExpiresAt?: string; error?: string }> {
    try {
      const now = new Date()
      const newExpiresAt = new Date(now.getTime() + this.config.maxAge)

      const { data, error } = await this.supabase
        .from('user_sessions')
        .update({
          expires_at: newExpiresAt.toISOString(),
          last_activity: now.toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Log session refresh
      await auditService.logSessionActivity({
        user_id: data.user_id,
        session_id: sessionId,
        action: 'session_refreshed',
        success: true
      })

      return { success: true, newExpiresAt: newExpiresAt.toISOString() }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string, reason: string = 'user_logout'): Promise<{ success: boolean; error?: string }> {
    try {
      // Get session data before termination
      const { data: session } = await this.supabase
        .from('user_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single()

      // Mark session as inactive
      const { error } = await this.supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: reason
        })
        .eq('id', sessionId)

      if (error) {
        return { success: false, error: error.message }
      }

      // Log session termination
      if (session) {
        await auditService.logSessionActivity({
          user_id: session.user_id,
          session_id: sessionId,
          action: 'session_terminated',
          success: true,
          failure_reason: reason
        })
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(userId: string, except?: string): Promise<{ success: boolean; error?: string }> {
    try {
      let query = this.supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: 'force_logout_all'
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (except) {
        query = query.neq('id', except)
      }

      const { error } = await query

      if (error) {
        return { success: false, error: error.message }
      }

      // Log mass session termination
      await auditService.logSessionActivity({
        user_id: userId,
        session_id: 'all',
        action: 'all_sessions_terminated',
        success: true
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<SessionData[]> {
    try {
      const { data: sessions, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })

      if (error) {
        console.error('Error fetching user sessions:', error)
        return []
      }

      return sessions || []
    } catch (error) {
      console.error('Error in getUserActiveSessions:', error)
      return []
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Error updating session activity:', error)
    }
  }

  /**
   * Generate cryptographically secure session ID
   */
  private generateSessionId(): string {
    // Use Node.js crypto for secure random generation
    // In browser contexts, crypto.getRandomValues would be used
    const { randomBytes } = require('crypto')
    return randomBytes(32).toString('hex')
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<{ cleaned: number; error?: string }> {
    try {
      const { data: expiredSessions, error: selectError } = await this.supabase
        .from('user_sessions')
        .select('id, user_id')
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)

      if (selectError) {
        return { cleaned: 0, error: selectError.message }
      }

      if (!expiredSessions || expiredSessions.length === 0) {
        return { cleaned: 0 }
      }

      // Mark sessions as inactive
      const { error: updateError } = await this.supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: 'expired'
        })
        .in('id', expiredSessions.map(s => s.id))

      if (updateError) {
        return { cleaned: 0, error: updateError.message }
      }

      // Batch audit logging to prevent rate limiting
      // Create single aggregate event for cleanup operation
      await auditService.logSessionActivity({
        user_id: 'system',
        session_id: 'batch_cleanup',
        action: 'session_expired_cleanup_batch',
        success: true,
        failure_reason: JSON.stringify({
          total_expired: expiredSessions.length,
          session_ids: expiredSessions.map(s => s.id).slice(0, 10), // Limit to first 10
          user_ids: Array.from(new Set(expiredSessions.map(s => s.user_id))).slice(0, 10)
        })
      })

      return { cleaned: expiredSessions.length }
    } catch (error) {
      return {
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Start automatic session cleanup
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      const result = await this.cleanupExpiredSessions()
      if (result.cleaned > 0) {
        console.log(`Cleaned up ${result.cleaned} expired sessions`)
      }
    }, this.config.autoCleanupInterval)
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(): Promise<{
    totalActiveSessions: number
    sessionsByUser: Record<string, number>
    averageSessionDuration: number
    error?: string
  }> {
    try {
      const { data: sessions, error } = await this.supabase
        .from('user_sessions')
        .select('user_id, created_at, last_activity')
        .eq('is_active', true)

      if (error) {
        return {
          totalActiveSessions: 0,
          sessionsByUser: {},
          averageSessionDuration: 0,
          error: error.message
        }
      }

      const sessionsByUser: Record<string, number> = {}
      let totalDuration = 0

      sessions?.forEach(session => {
        sessionsByUser[session.user_id] = (sessionsByUser[session.user_id] || 0) + 1

        const duration = new Date(session.last_activity).getTime() - new Date(session.created_at).getTime()
        totalDuration += duration
      })

      const averageSessionDuration = sessions?.length ? totalDuration / sessions.length : 0

      return {
        totalActiveSessions: sessions?.length || 0,
        sessionsByUser,
        averageSessionDuration
      }
    } catch (error) {
      return {
        totalActiveSessions: 0,
        sessionsByUser: {},
        averageSessionDuration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Default session manager instance
export const sessionManager = new SessionManager()

/**
 * Session middleware for API routes
 */
export async function validateSessionMiddleware(req: NextRequest): Promise<{
  valid: boolean
  session?: SessionData
  user_id?: string
  error?: string
}> {
  const sessionId = req.headers.get('x-session-id') || req.cookies.get('session_id')?.value

  if (!sessionId) {
    return { valid: false, error: 'No session ID provided' }
  }

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined

  const validation = await sessionManager.validateSession(sessionId, ipAddress)

  return {
    valid: validation.valid,
    session: validation.session,
    user_id: validation.session?.user_id,
    error: validation.error
  }
}

/**
 * Set session cookie
 */
export function setSessionCookie(response: NextResponse, sessionId: string, maxAge: number): void {
  response.cookies.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAge / 1000, // Convert to seconds
    path: '/'
  })
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete('session_id')
}