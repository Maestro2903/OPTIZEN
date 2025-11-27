import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

// POST /api/appointment-requests/[id]/reject - Reject appointment request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('bookings', 'edit')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params

    // Get the appointment request
    const { data: appointmentRequest, error: requestError } = await supabase
      .from('appointment_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError || !appointmentRequest) {
      return NextResponse.json(
        { error: 'Appointment request not found' },
        { status: 404 }
      )
    }

    if (appointmentRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${appointmentRequest.status}` },
        { status: 400 }
      )
    }

    // Delete the appointment request
    const { error: deleteError } = await supabase
      .from('appointment_requests')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting appointment request:', deleteError)
      return NextResponse.json(
        { error: 'Failed to reject appointment request', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment request rejected and deleted successfully',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

