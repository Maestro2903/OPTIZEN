import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        )
      `)
      .eq('certificate_number', id)
      .single()

    if (error) {
      console.error('Certificate fetch error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    // Transform data to match frontend format
    const transformedCertificate = {
      id: certificate.certificate_number,
      date: new Date(certificate.issue_date).toLocaleDateString('en-GB'),
      patient_name: certificate.patients?.full_name || 'Unknown',
      type: certificate.type,
      purpose: certificate.purpose,
      status: certificate.status,
      ...certificate
    }

    return NextResponse.json({
      success: true,
      data: transformedCertificate
    })

  } catch (error) {
    console.error('Unexpected error in certificate GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()

    // Get user role from users table (secure authorization)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if certificate exists and get ownership info
    const { data: certAuth, error: fetchError } = await supabase
      .from('certificates')
      .select('user_id')
      .eq('certificate_number', id)
      .single()

    if (fetchError || !certAuth) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Check if user owns the certificate or is admin
    const isAuthorized = certAuth.user_id === user?.id ||
                        userData.role === 'super_admin' ||
                        userData.role === 'hospital_admin'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['type', 'purpose', 'status', 'issue_date', 'patient_id']
    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {})

    const { data: certificate, error } = await supabase
      .from('certificates')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('certificate_number', id)
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        )
      `)
      .single()

    if (error) {
      console.error('Certificate update error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    // Transform data to match frontend format
    const transformedCertificate = {
      id: certificate.certificate_number,
      date: new Date(certificate.issue_date).toLocaleDateString('en-GB'),
      patient_name: certificate.patients?.full_name || 'Unknown',
      type: certificate.type,
      purpose: certificate.purpose,
      status: certificate.status,
      ...certificate
    }

    return NextResponse.json({
      success: true,
      data: transformedCertificate,
      message: 'Certificate updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in certificate PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params

    // Get user role from users table (secure authorization)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization check - verify ownership or admin role
    const { data: certificate, error: fetchError } = await supabase
      .from('certificates')
      .select('user_id')
      .eq('certificate_number', id)
      .single()

    if (fetchError || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Check if user owns the certificate or is admin
    const isAuthorized = certificate.user_id === user?.id ||
                        userData.role === 'super_admin' ||
                        userData.role === 'hospital_admin'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('certificate_number', id)

    if (error) {
      console.error('Certificate deletion error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in certificate DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}