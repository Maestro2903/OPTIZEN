import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/attendance/[id] - Get single attendance record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requirePermission('attendance', 'view')
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = createClient()
    const { id } = params

    const { data, error } = await supabase
      .from('staff_attendance')
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
        ),
        marked_by_user:marked_by (
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Attendance record not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/attendance/[id] - Update attendance record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requirePermission('attendance', 'edit')
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['present', 'absent', 'sick_leave', 'casual_leave', 'paid_leave', 'half_day']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate attendance date if provided
    if (body.attendance_date) {
      const attendanceDate = new Date(body.attendance_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      attendanceDate.setHours(0, 0, 0, 0)
      
      const leaveStatuses = ['sick_leave', 'casual_leave', 'paid_leave']
      const status = body.status || 'present' // Assume present if not changing status
      
      if (attendanceDate > today && !leaveStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Cannot mark attendance for future dates. Use leave status for future absences.' },
          { status: 400 }
        )
      }
    }

    // Validate times if both provided
    if (body.check_in_time && body.check_out_time) {
      if (body.check_out_time <= body.check_in_time) {
        return NextResponse.json(
          { success: false, error: 'Check-out time must be after check-in time' },
          { status: 400 }
        )
      }
      
      // Calculate working hours to validate
      const checkIn = new Date(`2000-01-01T${body.check_in_time}`)
      const checkOut = new Date(`2000-01-01T${body.check_out_time}`)
      const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      
      if (hoursWorked > 24) {
        return NextResponse.json(
          { success: false, error: 'Working hours cannot exceed 24 hours' },
          { status: 400 }
        )
      }
      
      if (hoursWorked < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid time range' },
          { status: 400 }
        )
      }
    }

    // Allowed fields for update
    const allowedFields = [
      'attendance_date',
      'status',
      'check_in_time',
      'check_out_time',
      'notes',
    ]

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Update record
    const { data, error } = await supabase
      .from('staff_attendance')
      .update(updateData)
      .eq('id', id)
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
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Attendance record not found' },
          { status: 404 }
        )
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Attendance record already exists for this date' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update attendance record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/attendance/[id] - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requirePermission('attendance', 'delete')
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = createClient()
    const { id } = params

    const { error } = await supabase
      .from('staff_attendance')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete attendance record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
