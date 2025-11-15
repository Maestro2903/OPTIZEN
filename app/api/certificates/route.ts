import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'

export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('certificates', 'view')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const sortByParam = searchParams.get('sortBy') || 'issue_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate sortBy against whitelist
    const allowedSortColumns = [
      'issue_date',
      'certificate_number',
      'type',
      'purpose',
      'status',
      'created_at',
      'updated_at'
    ]
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : 'issue_date'
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const patient_id = searchParams.get('patient_id')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
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
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      // First, find patient IDs that match the search term
      const { data: matchingPatients } = await supabase
        .from('patients')
        .select('id')
        .ilike('full_name', `%${search}%`)

      const patientIds = matchingPatients?.map(p => p.id) || []

      // Apply search to certificate fields and patient IDs
      if (patientIds.length > 0) {
        query = query.or(`certificate_number.ilike.%${search}%,purpose.ilike.%${search}%,patient_id.in.(${patientIds.join(',')})`)
      } else {
        query = query.or(`certificate_number.ilike.%${search}%,purpose.ilike.%${search}%`)
      }
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: certificates, error, count } = await query

    if (error) {
      console.error('Certificates fetch error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend format
    const transformedCertificates = certificates?.map(cert => ({
      id: cert.certificate_number,
      date: new Date(cert.issue_date).toLocaleDateString('en-GB'),
      patient_name: cert.patients?.full_name || 'Unknown',
      type: cert.type,
      purpose: cert.purpose,
      status: cert.status,
      // Include all fields for detailed view
      ...cert
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: transformedCertificates || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Unexpected error in certificates GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('certificates', 'create')
    if (!authCheck.authorized) return authCheck.response
    const { context } = authCheck

    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.patient_id) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    if (!body.type) {
      return NextResponse.json(
        { success: false, error: 'Certificate type is required' },
        { status: 400 }
      )
    }

    if (!body.purpose) {
      return NextResponse.json(
        { success: false, error: 'Purpose is required' },
        { status: 400 }
      )
    }

    // Validate certificate type
    const allowedTypes = ['Medical Certificate', 'Fitness Certificate', 'Eye Test Certificate', 'Sick Leave', 'Custom']
    if (!allowedTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid certificate type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate certificate number
    const prefix = 'CERT'
    const timestamp = Date.now()
    const certificateNumber = `${prefix}${timestamp}`

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert([
        {
          certificate_number: certificateNumber,
          patient_id: body.patient_id,
          type: body.type,
          purpose: body.purpose,
          issue_date: body.issue_date || new Date().toISOString().split('T')[0],
          status: body.status || 'Issued',
          // Type-specific fields
          exam_date: body.exam_date,
          findings: body.findings,
          diagnosis: body.diagnosis,
          treatment_period: body.treatment_period,
          recommendations: body.recommendations,
          visual_acuity_right: body.visual_acuity_right,
          visual_acuity_left: body.visual_acuity_left,
          color_vision: body.color_vision,
          driving_fitness: body.driving_fitness,
          illness: body.illness,
          leave_from: body.leave_from,
          leave_to: body.leave_to,
          title: body.title,
          content: body.content,
          issued_by: body.issued_by,
          // Hospital and doctor details
          hospital_name: body.hospital_name,
          hospital_address: body.hospital_address,
          doctor_name: body.doctor_name,
          doctor_qualification: body.doctor_qualification,
          doctor_registration_number: body.doctor_registration_number,
          hospital_logo_url: body.hospital_logo_url,
          doctor_signature_url: body.doctor_signature_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
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
      console.error('Certificate creation error:', error)

      // Check for specific error types
      if (error.code === '23503') { // Foreign key constraint violation
        return NextResponse.json(
          { success: false, error: 'Invalid patient ID or referenced data does not exist' },
          { status: 400 }
        )
      } else if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Certificate with this information already exists' },
          { status: 400 }
        )
      } else if (error.message?.includes('validation') || error.message?.includes('constraint')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }

      // Default to 500 for unexpected server errors
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
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
      message: 'Certificate generated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in certificates POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}