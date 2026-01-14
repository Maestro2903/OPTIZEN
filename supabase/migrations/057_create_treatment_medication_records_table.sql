-- Migration 057: Create treatment_medication_records table
-- This table stores treatments and medications data extracted from cases

CREATE TABLE IF NOT EXISTS public.treatment_medication_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  record_time TIME,
  record_number TEXT NOT NULL UNIQUE,
  medications_data JSONB DEFAULT '{}'::jsonb,
  past_medications_data JSONB DEFAULT '{}'::jsonb,
  past_treatments_data JSONB DEFAULT '{}'::jsonb,
  surgeries_data JSONB DEFAULT '{}'::jsonb,
  treatments_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_patient_id ON public.treatment_medication_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_record_date ON public.treatment_medication_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_record_number ON public.treatment_medication_records(record_number);
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_created_at ON public.treatment_medication_records(created_at DESC);

-- Add GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_medications_data ON public.treatment_medication_records USING gin (medications_data);
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_past_medications_data ON public.treatment_medication_records USING gin (past_medications_data);
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_past_treatments_data ON public.treatment_medication_records USING gin (past_treatments_data);
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_surgeries_data ON public.treatment_medication_records USING gin (surgeries_data);
CREATE INDEX IF NOT EXISTS idx_treatment_medication_records_treatments_data ON public.treatment_medication_records USING gin (treatments_data);

-- Enable Row Level Security
ALTER TABLE public.treatment_medication_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy for SELECT: Users can view records they created or have appropriate permissions
CREATE POLICY "Users can view treatment medication records"
  ON public.treatment_medication_records
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
CREATE POLICY "Users can create treatment medication records"
  ON public.treatment_medication_records
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
CREATE POLICY "Users can update treatment medication records"
  ON public.treatment_medication_records
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
CREATE POLICY "Users can delete treatment medication records"
  ON public.treatment_medication_records
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
COMMENT ON TABLE public.treatment_medication_records IS 'Stores treatments and medications records extracted from cases';
COMMENT ON COLUMN public.treatment_medication_records.medications_data IS 'Current medications: {medications: [{drug_id: uuid, eye?: uuid, dosage_id?: uuid, route_id?: uuid, duration?: string, quantity?: string}]}';
COMMENT ON COLUMN public.treatment_medication_records.past_medications_data IS 'Past history medications: {medications: [{medicine_id?: uuid, medicine_name: string, type?: string, advice?: string, duration?: string, eye?: uuid}]}';
COMMENT ON COLUMN public.treatment_medication_records.past_treatments_data IS 'Past history treatments: {treatments: [{treatment: string, years: string}]}';
COMMENT ON COLUMN public.treatment_medication_records.surgeries_data IS 'Surgeries: {surgeries: [{eye: uuid, surgery_name: uuid, anesthesia: uuid}]}';
COMMENT ON COLUMN public.treatment_medication_records.treatments_data IS 'General treatments: {treatments: string[]}';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_treatment_medication_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER treatment_medication_records_updated_at
  BEFORE UPDATE ON public.treatment_medication_records
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_medication_records_updated_at();











