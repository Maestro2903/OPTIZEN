import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

const allowedGenders = ['male', 'female', 'other'] as const
const allowedTypes = ['consult', 'follow-up', 'surgery', 'refraction', 'other'] as const

type Gender = (typeof allowedGenders)[number]
type AppointmentType = (typeof allowedTypes)[number]

const getCorsHeaders = (request: NextRequest) => {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

const normalizeTime = (value: string) => (value.length === 5 ? `${value}:00` : value)

const validateTime = (value: string) => /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/.test(value)
const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const validateMobile = (value: string) => /^(\+\d{1,3}[- ]?)?\d{10}$/.test(value.replace(/\s/g, ''))

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  })
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  const { searchParams } = new URL(request.url)
  const appointmentId = searchParams.get('id')

  if (!appointmentId) {
    return NextResponse.json(
      { error: 'Appointment ID is required' },
      { status: 400, headers: corsHeaders }
    )
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
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
      .eq('id', appointmentId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[Public Appointments][GET] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch appointment details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)

  try {
    const body = await request.json()
    const {
      full_name,
      email,
      mobile,
      gender,
      date_of_birth,
      appointment_date,
      start_time,
      end_time,
      type,
      provider_id,
      reason,
      notes,
    } = body as Record<string, string | null>

    if (!full_name || full_name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!mobile || !validateMobile(mobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format. Expected 10 digits with optional country code' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!gender || !allowedGenders.includes(gender.toLowerCase() as Gender)) {
      return NextResponse.json(
        { error: `Invalid gender. Allowed values: ${allowedGenders.join(', ')}` },
        { status: 400, headers: corsHeaders }
      )
    }

    if (email && email.trim() !== '' && !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!appointment_date || isNaN(Date.parse(appointment_date))) {
      return NextResponse.json(
        { error: 'Invalid appointment_date. Expected YYYY-MM-DD format' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!start_time || !validateTime(start_time)) {
      return NextResponse.json(
        { error: 'Invalid start_time format. Expected HH:MM (24-hour format)' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!end_time || !validateTime(end_time)) {
      return NextResponse.json(
        { error: 'Invalid end_time format. Expected HH:MM (24-hour format)' },
        { status: 400, headers: corsHeaders }
      )
    }

    const startMinutes = parseInt(start_time.slice(0, 2)) * 60 + parseInt(start_time.slice(3, 5))
    const endMinutes = parseInt(end_time.slice(0, 2)) * 60 + parseInt(end_time.slice(3, 5))

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { error: 'end_time must be after start_time' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!type || !allowedTypes.includes(type.toLowerCase() as AppointmentType)) {
      return NextResponse.json(
        { error: `Invalid appointment type. Allowed values: ${allowedTypes.join(', ')}` },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createServiceClient()

    if (provider_id) {
      const { data: provider, error: providerError } = await supabase
        .from('users')
        .select('id')
        .eq('id', provider_id)
        .eq('is_active', true)
        .single()

      if (providerError || !provider) {
        return NextResponse.json(
          { error: 'Selected doctor/provider not found' },
          { status: 404, headers: corsHeaders }
        )
      }
    }

    const normalizedGender = gender.toLowerCase() as 'male' | 'female' | 'other'
    const normalizedType = type.toLowerCase() as 'consult' | 'follow-up' | 'surgery' | 'refraction' | 'other'

    const requestPayload = {
      full_name: full_name.trim(),
      email: email?.trim() || null,
      mobile,
      gender: normalizedGender,
      date_of_birth: date_of_birth || null,
      appointment_date,
      start_time: normalizeTime(start_time),
      end_time: normalizeTime(end_time),
      type: normalizedType,
      provider_id: provider_id || null,
      reason: reason || null,
      notes: notes || null,
      status: 'pending' as const,
    }

    const { data, error } = await supabase
      .from('appointment_requests')
      .insert(requestPayload as any)
      .select('*')
      .single()

    if (error) {
      console.error('[Public Appointments][POST] Database error:', error)
      return NextResponse.json(
        {
          error: 'Failed to submit appointment request',
          details: error.message,
          code: error.code,
        },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: 'Appointment request submitted successfully. Our team will contact you soon to confirm your appointment.',
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('[Public Appointments][POST] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit appointment request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

