-- Migration 058: Create blood_advice_records table
-- This table stores blood investigation and advice data extracted from cases

CREATE TABLE IF NOT EXISTS public.blood_advice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  record_time TIME,
  record_number TEXT NOT NULL UNIQUE,
  blood_investigation_data JSONB DEFAULT '{}'::jsonb,
  advice_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blood_advice_records_patient_id ON public.blood_advice_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_blood_advice_records_record_date ON public.blood_advice_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_blood_advice_records_record_number ON public.blood_advice_records(record_number);
CREATE INDEX IF NOT EXISTS idx_blood_advice_records_created_at ON public.blood_advice_records(created_at DESC);

-- Add GIN index for JSONB column
CREATE INDEX IF NOT EXISTS idx_blood_advice_records_blood_investigation_data ON public.blood_advice_records USING gin (blood_investigation_data);

-- Enable Row Level Security
ALTER TABLE public.blood_advice_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy for SELECT: Users can view records they created or have appropriate permissions
CREATE POLICY "Users can view blood advice records"
  ON public.blood_advice_records
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM public.roles
        WHERE name IN ('admin', 'doctor', 'nurse', 'pharmacist', 'receptionist')
      )
    )
  );

-- Policy for INSERT: Users with appropriate roles can create records
CREATE POLICY "Users can create blood advice records"
  ON public.blood_advice_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM public.roles
        WHERE name IN ('admin', 'doctor', 'nurse', 'pharmacist')
      )
    )
  );

-- Policy for UPDATE: Users can update records they created or have appropriate permissions
CREATE POLICY "Users can update blood advice records"
  ON public.blood_advice_records
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM public.roles
        WHERE name IN ('admin', 'doctor', 'nurse', 'pharmacist')
      )
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM public.roles
        WHERE name IN ('admin', 'doctor', 'nurse', 'pharmacist')
      )
    )
  );

-- Policy for DELETE: Only admins and doctors can delete records
CREATE POLICY "Users can delete blood advice records"
  ON public.blood_advice_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM public.roles
        WHERE name IN ('admin', 'doctor')
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.blood_advice_records IS 'Stores blood investigation and advice records extracted from cases';
COMMENT ON COLUMN public.blood_advice_records.blood_investigation_data IS 'Blood investigation data: {blood_sugar?: string, blood_tests?: string[]}';
COMMENT ON COLUMN public.blood_advice_records.advice_remarks IS 'Advice and remarks for the patient';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_blood_advice_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blood_advice_records_updated_at
  BEFORE UPDATE ON public.blood_advice_records
  FOR EACH ROW
  EXECUTE FUNCTION update_blood_advice_records_updated_at();

