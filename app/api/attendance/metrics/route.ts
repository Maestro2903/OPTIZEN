import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/attendance/metrics - Get aggregate attendance statistics
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const authResult = await requirePermission('attendance', 'view')
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''

    // Build base query - use correct table name 'staff_attendance'
    let query = supabase
      .from('staff_attendance')
      .select('status, attendance_date, working_hours, user_id')

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
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance metrics' },
        { status: 500 }
      )
    }

    // Get total staff count from users table
    const { count: totalStaff } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Calculate status counts
    const statusCounts: Record<string, number> = {
      present: 0,
      absent: 0,
      sick_leave: 0,
      casual_leave: 0,
      paid_leave: 0,
      half_day: 0
    }

    let totalWorkingHours = 0
    let recordsWithHours = 0
    const uniqueUsers = new Set<string>()

    records?.forEach(record => {
      if (record.status && statusCounts.hasOwnProperty(record.status)) {
        statusCounts[record.status]++
      }
      if (record.working_hours) {
        totalWorkingHours += parseFloat(record.working_hours.toString())
        recordsWithHours++
      }
      if (record.user_id) {
        uniqueUsers.add(record.user_id)
      }
    })

    const totalRecords = records?.length || 0
    const presentCount = statusCounts.present + statusCounts.half_day
    const onLeaveCount = statusCounts.sick_leave + statusCounts.casual_leave + statusCounts.paid_leave
    const absentCount = statusCounts.absent
    const averageWorkingHours = recordsWithHours > 0 ? (totalWorkingHours / recordsWithHours).toFixed(2) : '0.00'
    const attendancePercentage = totalStaff && totalStaff > 0 
      ? ((uniqueUsers.size / totalStaff) * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      success: true,
      data: {
        total_staff: totalStaff || 0,
        total_records: totalRecords,
        unique_attendees: uniqueUsers.size,
        status_counts: statusCounts,
        present: presentCount,
        absent: absentCount,
        on_leave: onLeaveCount,
        attendance_percentage: parseFloat(attendancePercentage),
        average_working_hours: parseFloat(averageWorkingHours),
        
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
