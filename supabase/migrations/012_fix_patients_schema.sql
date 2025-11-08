-- Fix Patients Table Schema to Match API Expectations
-- This migration aligns the patients table with the API service layer

-- Drop existing patients table if it has the old schema
-- (Safe because this is a new setup with no production data)
DROP TABLE IF EXISTS patients CASCADE;

-- Recreate patients table with correct schema
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT UNIQUE NOT NULL,  -- Changed from mrn
  full_name TEXT NOT NULL,           -- Changed from first_name/last_name
  email TEXT,
  mobile TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  medical_history TEXT,
  current_medications TEXT,
  allergies TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_mobile ON patients(mobile);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_gender ON patients(gender);
CREATE INDEX idx_patients_state ON patients(state);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to manage patients
CREATE POLICY "Authenticated users can view patients" 
ON patients FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create patients" 
ON patients FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients" 
ON patients FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients" 
ON patients FOR DELETE 
TO authenticated 
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_patients_updated_at 
BEFORE UPDATE ON patients
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE patients IS 'Patient records with demographics and medical history';
COMMENT ON COLUMN patients.patient_id IS 'Unique patient identifier (e.g., PAT-1234567890-ABCD)';
COMMENT ON COLUMN patients.full_name IS 'Patient full name';
COMMENT ON COLUMN patients.mobile IS 'Primary contact number (10 digits with optional country code)';
COMMENT ON COLUMN patients.status IS 'Patient status: active or inactive';
