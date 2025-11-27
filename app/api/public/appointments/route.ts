import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generatePatientId } from '@/lib/utils/id-generator'

// GET /api/public/appointments - Get appointment by ID (for success page)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!appointments_patient_id_fkey (
          id,
          patient_id,
          full_name,
          email,
          mobile
        )
      `)
      .eq('id', id)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/public/appointments - Create appointment request without authentication
export async function POST(request: NextRequest) {
  try {
    // Handle CORS preflight
    const origin = request.headers.get('origin')
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      corsHeaders['Access-Control-Allow-Origin'] = origin
    }

    const supabase = createServiceClient() // Use service client to bypass RLS
    const body = await request.json()

    // Extract patient information
    const {
      full_name,
      email,
      mobile,
      gender,
      date_of_birth,
      // Appointment information
      appointment_date,
      start_time,
      end_time,
      type,
      provider_id,
      room,
      notes,
      reason,
    } = body

    // Validate required fields
    if (!full_name || !mobile || !gender) {
      return NextResponse.json(
        { error: 'Missing required patient fields: full_name, mobile, gender' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!appointment_date || !start_time || !end_time || !type) {
      return NextResponse.json(
        { error: 'Missing required appointment fields: appointment_date, start_time, end_time, type' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400, headers: corsHeaders }
        )
      }
    }

    // Validate mobile number format
    const mobileRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/
    if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid mobile number format. Expected 10 digits with optional country code' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate gender
    const allowedGenders = ['male', 'female', 'other']
    if (!allowedGenders.includes(gender.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid gender. Allowed values: ${allowedGenders.join(', ')}` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
    if (!timeRegex.test(start_time)) {
      return NextResponse.json({ 
        error: 'Invalid start_time format. Expected HH:MM (24-hour format)' 
      }, { status: 400, headers: corsHeaders })
    }
    if (!timeRegex.test(end_time)) {
      return NextResponse.json({ 
        error: 'Invalid end_time format. Expected HH:MM (24-hour format)' 
      }, { status: 400, headers: corsHeaders })
    }

    // Verify provider exists if provided
    if (provider_id) {
      const { data: provider, error: providerError } = await supabase
        .from('users')
        .select('id')
        .eq('id', provider_id)
        .single()

      if (providerError || !provider) {
        return NextResponse.json(
          { error: 'Selected doctor/provider not found' },
          { status: 404, headers: corsHeaders }
        )
      }
    }

    // Create appointment request (not actual appointment yet)
    const appointmentNotes = notes || reason ? `${notes || ''}${reason ? `\nReason: ${reason}` : ''}`.trim() : null

    const { data: appointmentRequest, error: requestError } = await supabase
      .from('appointment_requests')
      .insert([
        {
          full_name,
          email: email || null,
          mobile,
          gender: gender.toLowerCase(),
          date_of_birth: date_of_birth || null,
          appointment_date,
          start_time,
          end_time,
          type,
          provider_id: provider_id || null,
          reason: reason || null,
          notes: appointmentNotes,
          status: 'pending',
        }
      ])
      .select()
      .single()

    if (requestError) {
      console.error('Database error creating appointment request:', requestError)
      return NextResponse.json({ 
        error: 'Failed to submit appointment request', 
        details: requestError.message,
        code: requestError.code 
      }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({
      success: true,
      data: appointmentRequest,
      message: 'Appointment request submitted successfully. Our team will contact you soon to confirm your appointment.'
    }, { 
      status: 201,
      headers: corsHeaders
    })

  } catch (error) {
    console.error('API error:', error)
    const origin = request.headers.get('origin')
    const errorCorsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      errorCorsHeaders['Access-Control-Allow-Origin'] = origin
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: errorCorsHeaders })
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
  
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

