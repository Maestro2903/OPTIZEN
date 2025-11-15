import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/doctors/[id]/schedule - Get doctor's appointment schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authorization check
  const authCheck = await requirePermission('appointments', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const doctorId = params.id

    // Security: Doctors can only view their own schedule (unless admin)
    const isDoctorRole = ['optometrist', 'ophthalmologist'].includes(context.role)
    const isAdmin = ['super_admin', 'hospital_admin'].includes(context.role)
    
    if (isDoctorRole && context.user_id !== doctorId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own schedule' },
        { status: 403 }
      )
    }

    // Verify doctor exists
    const { data: doctor, error: doctorError } = await supabase
      .from('users')
      .select('id, full_name, email, role, department, phone')
      .eq('id', doctorId)
      .eq('is_active', true)
      .single()

    if (doctorError || !doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Extract query parameters
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || startDate
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    let page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '50')

    // Validate and constrain
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 200)

    // Validate date formats
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const offset = (page - 1) * limit

    // Build query using doctor_schedule_view for enhanced data
    let query = supabase
      .from('doctor_schedule_view')
      .select('*', { count: 'exact' })
      .eq('provider_id', doctorId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    // Apply status filter
    if (status) {
      const statusValues = status.split(',').map(s => s.trim())
      query = query.in('status', statusValues)
    }

    // Apply type filter
    if (type) {
      const typeValues = type.split(',').map(t => t.trim())
      query = query.in('type', typeValues)
    }

    // Sort by date and time
    query = query
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      total: count || 0,
      scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
      completed: appointments?.filter(a => a.status === 'completed').length || 0,
      cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
      noShow: appointments?.filter(a => a.status === 'no-show').length || 0,
      reassigned: appointments?.filter(a => a.is_reassigned).length || 0,
    }

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        doctor: {
          id: doctor.id,
          name: doctor.full_name,
          email: doctor.email,
          role: doctor.role,
          department: doctor.department,
          phone: doctor.phone,
        },
        appointments: appointments || [],
        stats,
      },
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
