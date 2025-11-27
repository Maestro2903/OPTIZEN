-- Create appointment_requests table for public booking workflow
-- This table stores pending appointment requests from the public landing page
-- Staff can accept (create patient + appointment) or reject these requests

CREATE TYPE request_status AS ENUM (
  'pending',
  'accepted',
  'rejected'
);

CREATE TABLE appointment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Basic contact information from public form
  full_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  
  -- Appointment preferences
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consult', 'follow-up', 'surgery', 'refraction', 'other')),
  provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  notes TEXT,
  
  -- Status tracking
  status request_status NOT NULL DEFAULT 'pending',
  
  -- Tracking
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Links to created records (after acceptance)
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX idx_appointment_requests_created_at ON appointment_requests(created_at DESC);
CREATE INDEX idx_appointment_requests_appointment_date ON appointment_requests(appointment_date);
CREATE INDEX idx_appointment_requests_mobile ON appointment_requests(mobile);
CREATE INDEX idx_appointment_requests_email ON appointment_requests(email);

-- Enable Row Level Security
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to view and manage requests
CREATE POLICY "Authenticated users can view appointment requests" 
ON appointment_requests FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create appointment requests" 
ON appointment_requests FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointment requests" 
ON appointment_requests FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER appointment_requests_updated_at
  BEFORE UPDATE ON appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_requests_updated_at();

