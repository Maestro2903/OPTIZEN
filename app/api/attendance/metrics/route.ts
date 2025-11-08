import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole, type UserRoleData } from '@/lib/utils/rbac'

// GET /api/attendance/metrics - Get aggregate attendance statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
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
      console.error('Error fetching user role for attendance metrics', { 
        userId: session.user.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return NextResponse.json({ 
        error: 'Internal Server Error: Unable to fetch user role' 
      }, { status: 500 })
    }
    
    // Fail-closed: Only allow if userRole exists AND (is admin OR has manage_employees permission)
    if (!userRole || (userRole.role !== 'admin' && !userRole.can_manage_employees)) {
      console.log('Access denied: User lacks attendance viewing permission', { 
        userId: session.user.id, 
        role: userRole?.role || 'null',
        can_manage_employees: userRole?.can_manage_employees || false
      })
      return NextResponse.json({ 
        error: 'Forbidden: You do not have permission to view attendance metrics' 
      }, { status: 403 })
    }

    // Build base query (no additional filter needed - attendance is organization-wide for authorized users)
    let query = supabase
      .from('attendance')
      .select('status, attendance_date')

    // Apply date filters
    if (date_from && date_to) {
      query = query.gte('attendance_date', date_from).lte('attendance_date', date_to)
    } else if (date) {
      query = query.eq('attendance_date', date)
    }

    // Fetch all attendance records for aggregation
    const { data: records, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }

    // Calculate status counts
    const statusCounts: Record<string, number> = {
      present: 0,
      absent: 0,
      sick_leave: 0,
      casual_leave: 0,
      half_day: 0
    }

    records?.forEach(record => {
      if (record.status && statusCounts.hasOwnProperty(record.status)) {
        statusCounts[record.status]++
      }
    })

    const totalRecords = records?.length || 0
    const presentCount = statusCounts.present
    const absentCount = statusCounts.absent + statusCounts.sick_leave + statusCounts.casual_leave

    return NextResponse.json({
      success: true,
      data: {
        total_records: totalRecords,
        status_counts: statusCounts,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_rate: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0.0',
        
        // Date info
        date: date || null,
        date_range: {
          from: date_from || null,
          to: date_to || null
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
