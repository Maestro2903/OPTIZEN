import { createClient } from '@/lib/supabase/client';

export interface AppointmentData {
  full_name: string;
  email?: string;
  mobile: string;
  gender: 'male' | 'female' | 'other';
  appointment_date: string;
  start_time?: string;
  end_time?: string;
  type?: string;
  provider_id?: string;
  reason?: string;
  notes?: string;
  date_of_birth?: string;
}

export async function createAppointment(data: AppointmentData) {
  console.log('[Booking API] Creating appointment request directly in Supabase...');
  
  // Create Supabase client (uses anon key - RLS allows public inserts)
  const supabase = createClient();

  // Prepare the data matching the appointment_requests table schema
  const appointmentRequestData = {
    full_name: data.full_name.trim(),
    email: data.email?.trim() || null,
    mobile: data.mobile,
    gender: data.gender.toLowerCase(),
    date_of_birth: data.date_of_birth || null,
    appointment_date: data.appointment_date,
    // Default time slot: 10:00 AM - 11:00 AM (staff will adjust when accepting)
    start_time: data.start_time || '10:00',
    end_time: data.end_time || '11:00',
    // Default type: consultation
    type: data.type || 'consult',
    provider_id: data.provider_id || null,
    reason: data.reason || null,
    notes: data.notes || null,
    status: 'pending' as const, // Always pending when created from public form
  };

  console.log('[Booking API] Request data:', JSON.stringify(appointmentRequestData, null, 2));

  try {
    // Insert directly into appointment_requests table
    // RLS policy allows public users to insert (see migration 043)
    const { data: appointmentRequest, error } = await supabase
      .from('appointment_requests')
      .insert([appointmentRequestData])
    .select()
    .single();

  if (error) {
      console.error('[Booking API] Supabase error:', error);
      
      // Provide user-friendly error messages
      if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('A booking with these details already exists. Please check your information and try again.');
      } else if (error.code === '23503') {
        // Foreign key violation
        throw new Error('Invalid data provided. Please check all fields and try again.');
      } else if (error.code === 'PGRST116') {
        // No rows returned
        throw new Error('Failed to create booking. Please try again.');
      } else if (error.message.includes('RLS')) {
        throw new Error('Permission denied. Please check your Supabase configuration.');
      }
      
      throw new Error(error.message || 'Failed to create appointment request. Please try again.');
  }

    if (!appointmentRequest) {
      throw new Error('Failed to create appointment request. No data returned.');
    }

    console.log('[Booking API] Appointment request created successfully:', appointmentRequest);
    
    return appointmentRequest;
  } catch (error) {
    console.error('[Booking API] Error creating appointment:', error);
    
    // Re-throw with better error messages
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred while creating your appointment request. Please try again.');
  }
}

