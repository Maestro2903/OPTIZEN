-- Migration 021: Create Operations Table
-- This migration creates the operations table for surgical operation scheduling and management

-- Create operations table
CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Foreign keys
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  
  -- Operation details
  operation_name VARCHAR(200) NOT NULL,
  operation_date DATE NOT NULL,
  begin_time TIME,
  end_time TIME,
  duration VARCHAR(50),
  
  -- Medical details
  eye VARCHAR(10) CHECK (eye IN ('Left', 'Right', 'Both')),
  sys_diagnosis TEXT,
  anesthesia TEXT,
  operation_notes TEXT,
  
  -- Payment details
  payment_mode VARCHAR(50),
  amount DECIMAL(10, 2),
  
  -- IOL details
  iol_name TEXT,
  iol_power VARCHAR(50),
  
  -- Print options
  print_notes BOOLEAN DEFAULT false,
  print_payment BOOLEAN DEFAULT false,
  print_iol BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  
  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_operations_patient_id ON operations(patient_id);
CREATE INDEX IF NOT EXISTS idx_operations_case_id ON operations(case_id);
CREATE INDEX IF NOT EXISTS idx_operations_operation_date ON operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_deleted_at ON operations(deleted_at) WHERE deleted_at IS NULL;

-- Create composite index for date and status queries
CREATE INDEX IF NOT EXISTS idx_operations_date_status ON operations(operation_date, status) WHERE deleted_at IS NULL;

-- Add comment to table
COMMENT ON TABLE operations IS 'Surgical operations scheduling and management table';

-- Enable Row Level Security
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operations table

CREATE POLICY "Staff can view operations"
  ON operations FOR SELECT
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() IN (
        SELECT id FROM users 
        WHERE role IN (
          'super_admin', 'hospital_admin', 'receptionist',
          'optometrist', 'ophthalmologist', 'technician', 'billing_staff'
        )
        AND is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = operations.patient_id
          AND patients.email IN (
            SELECT email FROM users
            WHERE id = auth.uid()
              AND role = 'patient'
              AND is_active = true
          )
      )
    )
  );

-- Policy: Staff can create operations
CREATE POLICY "Staff can create operations"
  ON operations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN (
        'super_admin', 'hospital_admin', 'receptionist',
        'optometrist', 'ophthalmologist'
      )
      AND is_active = true
    )
  );

-- Policy: Staff can update operations
CREATE POLICY "Staff can update operations"
  ON operations FOR UPDATE
  USING (
    deleted_at IS NULL AND
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN (
        'super_admin', 'hospital_admin',
        'optometrist', 'ophthalmologist'
      )
      AND is_active = true
    )
  )
  WITH CHECK (
    deleted_at IS NULL AND
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN (
        'super_admin', 'hospital_admin',
        'optometrist', 'ophthalmologist'
      )
      AND is_active = true
    )
  );

-- Note: Soft delete is handled via UPDATE (setting deleted_at), so the update policy covers deletion

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_operations_updated_at ON operations;
CREATE TRIGGER trigger_update_operations_updated_at
  BEFORE UPDATE ON operations
  FOR EACH ROW
  EXECUTE FUNCTION update_operations_updated_at();

-- Add comment to trigger function
COMMENT ON FUNCTION update_operations_updated_at() IS 'Automatically updates updated_at timestamp when operations row is updated';

