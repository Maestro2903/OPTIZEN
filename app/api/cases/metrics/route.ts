import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole, type UserRoleData } from '@/lib/utils/rbac'

// GET /api/cases/metrics - Get aggregate case statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Optional filters
    const patient_id = searchParams.get('patient_id') || ''
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role and permissions
    let userRole: UserRoleData | null
    
    try {
      userRole = await getUserRole(session.user.id)
    } catch (error) {
      console.error('Error fetching user role for cases metrics', { 
        userId: session.user.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      // Fail-closed: treat error as no permissions, show only user's own data
      userRole = null
    }

    // Build base query with authorization
    let query = supabase
      .from('encounters')
      .select('status, visit_type, encounter_date, patient_id, created_by')
    
    // Apply authorization filter based on role (fail-closed: treat null as patient-level access)
    if (!userRole || userRole.role === 'patient') {
      // Patients (or users without role) can only see their own cases
      query = query.eq('patient_id', session.user.id)
    } else if (userRole.role !== 'admin' && !userRole.can_view_all_cases) {
      // Non-admin staff without view_all permission can only see cases they created
      query = query.eq('created_by', session.user.id)
    }
    // Admin or users with can_view_all_cases see all (no additional filter)

    // Apply patient_id filter if provided (only for non-patient roles)
    if (patient_id) {
      // Patients already filtered to their own data, so skip this filter for them
      // For staff/admin, allow filtering by specific patient
      if (userRole && userRole.role !== 'patient') {
        query = query.eq('patient_id', patient_id)
      } else if (patient_id !== session.user.id) {
        // Patient trying to filter by different patient_id - reject
        console.log('Patient attempted to query different patient_id', {
          userId: session.user.id,
          requestedPatientId: patient_id
        })
        return NextResponse.json({ 
          error: 'Forbidden: Patients can only view their own cases' 
        }, { status: 403 })
      }
      // If patient_id === session.user.id, the authorization filter already handles it
    }

    // Apply date range if provided
    if (date_from) {
      query = query.gte('encounter_date', date_from)
    }
    if (date_to) {
      query = query.lte('encounter_date', date_to)
    }

    // Fetch all cases for aggregation
    const { data: cases, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    // Calculate aggregates
    const totalCases = cases?.length || 0
    const activeCases = cases?.filter(c => c.status === 'active' || c.status === 'in-progress').length || 0
    const closedCases = cases?.filter(c => c.status === 'closed' || c.status === 'completed').length || 0

    // Count by visit type
    const visitTypes: Record<string, number> = {}
    cases?.forEach(c => {
      if (c.visit_type) {
        visitTypes[c.visit_type] = (visitTypes[c.visit_type] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        total_cases: totalCases,
        active_cases: activeCases,
        closed_cases: closedCases,
        
        // Visit type breakdown
        visit_types: visitTypes,
        
        // Date range (if applied)
        filters: {
          patient_id: patient_id || null,
          date_from: date_from || null,
          date_to: date_to || null
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
