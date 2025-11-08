import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'issue_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
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
      query = query.or(`certificate_number.ilike.%${search}%, patients.full_name.ilike.%${search}%, purpose.ilike.%${search}%`)
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
    const supabase = createClient()
    const body = await request.json()

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
      return NextResponse.json(
        { success: false, error: error.message },
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