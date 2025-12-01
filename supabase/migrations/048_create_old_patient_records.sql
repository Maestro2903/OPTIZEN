-- Migration 048: Create Old Patient Records Tables
-- Stores uploaded files from old patient records (printed booklets/paper records)

-- Create old_patient_records table
CREATE TABLE IF NOT EXISTS old_patient_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  old_patient_id TEXT NOT NULL, -- Custom ID from old system
  patient_name TEXT, -- Optional patient name if available
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  notes TEXT -- Additional notes about the records
);

-- Create old_patient_record_files table
CREATE TABLE IF NOT EXISTS old_patient_record_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  old_patient_record_id UUID NOT NULL REFERENCES old_patient_records(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, -- Original filename
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT NOT NULL, -- File size in bytes
  file_type TEXT NOT NULL, -- MIME type
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_old_patient_records_old_patient_id ON old_patient_records(old_patient_id);
CREATE INDEX IF NOT EXISTS idx_old_patient_records_patient_name ON old_patient_records(patient_name);
CREATE INDEX IF NOT EXISTS idx_old_patient_records_upload_date ON old_patient_records(upload_date);
CREATE INDEX IF NOT EXISTS idx_old_patient_record_files_record_id ON old_patient_record_files(old_patient_record_id);
CREATE INDEX IF NOT EXISTS idx_old_patient_record_files_uploaded_by ON old_patient_record_files(uploaded_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_old_patient_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_old_patient_records_updated_at
  BEFORE UPDATE ON old_patient_records
  FOR EACH ROW
  EXECUTE FUNCTION update_old_patient_records_updated_at();

-- Enable Row Level Security
ALTER TABLE old_patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE old_patient_record_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for old_patient_records
CREATE POLICY "Authenticated users can view old patient records"
  ON old_patient_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create old patient records"
  ON old_patient_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update old patient records"
  ON old_patient_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete old patient records"
  ON old_patient_records FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for old_patient_record_files
CREATE POLICY "Authenticated users can view old patient record files"
  ON old_patient_record_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create old patient record files"
  ON old_patient_record_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update old patient record files"
  ON old_patient_record_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete old patient record files"
  ON old_patient_record_files FOR DELETE
  TO authenticated
  USING (true);



