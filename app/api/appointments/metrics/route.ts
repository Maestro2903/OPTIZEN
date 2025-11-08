import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole, type UserRoleData } from '@/lib/utils/rbac'

// GET /api/appointments/metrics - Get aggregate appointment statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate date format
    if (date && isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Check user role and permissions
    let userRole: UserRoleData | null
    
    try {
      userRole = await getUserRole(session.user.id)
    } catch (error) {
      console.error('Error fetching user role for appointments metrics', { 
        userId: session.user.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      // Fail-closed: treat error as no permissions, show only user's own data
      userRole = null
    }
    
    // Build query with authorization filter
    let query = supabase
      .from('appointments')
      .select('status, doctor_id, patient_id, created_by')
      .eq('appointment_date', date)
    
    // Apply authorization filter based on role (fail-closed: treat null as patient-level access)
    if (!userRole || userRole.role === 'patient') {
      // Patients (or users without role) can only see their own appointments
      query = query.or(`patient_id.eq.${session.user.id},doctor_id.eq.${session.user.id},created_by.eq.${session.user.id}`)
    } else if (userRole.role !== 'admin' && !userRole.can_view_all_appointments) {
      // Non-admin staff without view_all permission can only see their own
      query = query.or(`doctor_id.eq.${session.user.id},created_by.eq.${session.user.id}`)
    }
    // Admin or users with can_view_all_appointments see all (no additional filter)

    // Fetch appointments with authorization
    const { data: appointments, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Calculate counts from fetched data
    const totalToday = appointments?.length || 0
    const totalCompleted = appointments?.filter(a => a.status === 'completed').length || 0
    const totalPending = appointments?.filter(a => 
      ['scheduled', 'checked-in', 'in-progress'].includes(a.status)
    ).length || 0
    const totalCancelled = appointments?.filter(a => a.status === 'cancelled').length || 0
    const totalNoShow = appointments?.filter(a => a.status === 'no-show').length || 0

    return NextResponse.json({
      success: true,
      data: {
        date,
        total_today: totalToday || 0,
        total_completed: totalCompleted || 0,
        total_pending: totalPending || 0,
        total_cancelled: totalCancelled || 0,
        total_no_show: totalNoShow || 0,
        completion_rate: totalToday ? ((totalCompleted || 0) / totalToday * 100).toFixed(1) : '0.0'
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
