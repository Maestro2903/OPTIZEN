import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

// POST /api/attendance/bulk - Bulk mark attendance for multiple employees
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('attendance', 'create')
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = createClient()
    const body = await request.json()

    // Validate request body
    if (!body.attendance_date) {
      return NextResponse.json(
        { success: false, error: 'attendance_date is required' },
        { status: 400 }
      )
    }

    if (!body.employees || !Array.isArray(body.employees) || body.employees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'employees array is required and must not be empty' },
        { status: 400 }
      )
    }

    const { attendance_date, employees, default_status = 'present' } = body

    // Validate status
    const validStatuses = ['present', 'absent', 'sick_leave', 'casual_leave', 'paid_leave', 'half_day']
    if (!validStatuses.includes(default_status)) {
      return NextResponse.json(
        { success: false, error: `Invalid default_status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate attendance date
    const attendanceDateObj = new Date(attendance_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    attendanceDateObj.setHours(0, 0, 0, 0)
    
    const leaveStatuses = ['sick_leave', 'casual_leave', 'paid_leave']
    if (attendanceDateObj > today && !leaveStatuses.includes(default_status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot mark attendance for future dates. Use leave status for future absences.' },
        { status: 400 }
      )
    }

    // Get existing attendance records for this date to avoid duplicates
    const { data: existingRecords } = await supabase
      .from('staff_attendance')
      .select('user_id')
      .eq('attendance_date', attendance_date)
      .in('user_id', employees.map((e: any) => e.user_id))

    const existingUserIds = new Set(existingRecords?.map(r => r.user_id) || [])

    // Prepare bulk insert data
    const insertData = employees
      .filter((emp: any) => !existingUserIds.has(emp.user_id)) // Skip existing records
      .map((emp: any) => ({
        user_id: emp.user_id,
        attendance_date,
        status: emp.status || default_status,
        check_in_time: emp.check_in_time || null,
        check_out_time: emp.check_out_time || null,
        notes: emp.notes || null,
        marked_by: authResult.context?.user_id,
      }))

    if (insertData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'All employees already have attendance marked for this date',
        skipped: employees.length,
        created: 0
      })
    }

    // Bulk insert
    const { data, error } = await supabase
      .from('staff_attendance')
      .insert(insertData)
      .select(`
        *,
        employees:user_id (
          id,
          employee_id,
          full_name,
          email,
          phone,
          role,
          department
        )
      `)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create bulk attendance records' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Successfully marked attendance for ${insertData.length} employee(s)`,
      created: insertData.length,
      skipped: employees.length - insertData.length
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
