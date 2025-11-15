import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('certificates', 'view')
    if (!authCheck.authorized) return authCheck.response
    
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
    // RBAC check
    const authCheck = await requirePermission('certificates', 'edit')
    if (!authCheck.authorized) return authCheck.response
    
    const supabase = createClient()
    const { id } = await params
    const body = await request.json()

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'type', 'purpose', 'status', 'issue_date', 'patient_id',
      'exam_date', 'findings', 'diagnosis', 'treatment_period',
      'recommendations', 'visual_acuity_right', 'visual_acuity_left',
      'color_vision', 'driving_fitness', 'illness', 'leave_from',
      'leave_to', 'title', 'content', 'issued_by', 'hospital_name',
      'hospital_address', 'doctor_name', 'doctor_qualification',
      'doctor_registration_number', 'hospital_logo_url', 'doctor_signature_url'
    ]
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
    // RBAC check
    const authCheck = await requirePermission('certificates', 'delete')
    if (!authCheck.authorized) return authCheck.response
    
    const supabase = createClient()
    const { id } = await params

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