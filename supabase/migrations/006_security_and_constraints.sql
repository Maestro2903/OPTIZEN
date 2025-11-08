-- Migration 006: Security Enhancements and Data Integrity Constraints
-- Purpose: Add RBAC, prevent appointment conflicts, fix foreign keys

-- =============================================================================
-- 1. USER ROLES AND PERMISSIONS TABLE
-- =============================================================================

-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient')),
  
  -- Permission flags
  can_view_all_patients BOOLEAN DEFAULT FALSE,
  can_edit_all_patients BOOLEAN DEFAULT FALSE,
  can_delete_patients BOOLEAN DEFAULT FALSE,
  
  can_view_all_appointments BOOLEAN DEFAULT FALSE,
  can_edit_all_appointments BOOLEAN DEFAULT FALSE,
  can_cancel_appointments BOOLEAN DEFAULT FALSE,
  
  can_view_all_cases BOOLEAN DEFAULT FALSE,
  can_edit_all_cases BOOLEAN DEFAULT FALSE,
  
  can_edit_master_data BOOLEAN DEFAULT FALSE,
  can_delete_master_data BOOLEAN DEFAULT FALSE,
  
  can_manage_employees BOOLEAN DEFAULT FALSE,
  can_delete_employees BOOLEAN DEFAULT FALSE,
  
  can_view_financial_data BOOLEAN DEFAULT FALSE,
  can_edit_invoices BOOLEAN DEFAULT FALSE,
  
  can_manage_pharmacy BOOLEAN DEFAULT FALSE,
  
  -- Additional metadata for future extensions
  permissions JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Ensure one role per user
  UNIQUE(user_id)
);

-- Create index for fast role lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Create trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin role
-- Note: Update this with actual admin user ID after initial deployment
-- INSERT INTO user_roles (user_id, role, 
--   can_view_all_patients, can_edit_all_patients, can_delete_patients,
--   can_view_all_appointments, can_edit_all_appointments, can_cancel_appointments,
--   can_view_all_cases, can_edit_all_cases,
--   can_edit_master_data, can_delete_master_data,
--   can_manage_employees, can_delete_employees,
--   can_view_financial_data, can_edit_invoices,
--   can_manage_pharmacy
-- ) VALUES (
--   'YOUR_ADMIN_USER_ID', 
--   'admin',
--   true, true, true, -- patients
--   true, true, true, -- appointments
--   true, true,       -- cases
--   true, true,       -- master_data
--   true, true,       -- employees
--   true, true,       -- financial
--   true              -- pharmacy
-- );

-- =============================================================================
-- 2. APPOINTMENT CONFLICT PREVENTION (CRITICAL - TOCTOU FIX)
-- =============================================================================

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping appointments
-- This prevents race conditions at the database level
ALTER TABLE appointments 
ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING gist (
  doctor_id WITH =,
  daterange(appointment_date, appointment_date, '[]') WITH &&,
  -- Convert time to interval for overlap comparison
  tsrange(
    (appointment_date + appointment_time::time)::timestamp,
    (appointment_date + appointment_time::time + INTERVAL '1 minute' * COALESCE(duration_minutes, 30))::timestamp,
    '[)'
  ) WITH &&
)
WHERE (status != 'cancelled' AND status != 'no-show');

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT no_overlapping_appointments ON appointments IS 
'Prevents overlapping appointments for the same doctor. Excludes cancelled and no-show appointments.';

-- =============================================================================
-- 3. FIX FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Fix master_data.created_by foreign key to handle user deletions
-- Drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'master_data_created_by_fkey' 
    AND table_name = 'master_data'
  ) THEN
    ALTER TABLE master_data DROP CONSTRAINT master_data_created_by_fkey;
  END IF;
END $$;

-- Recreate with ON DELETE SET NULL
ALTER TABLE master_data
ADD CONSTRAINT master_data_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =============================================================================
-- 4. ENSURE MASTER DATA IDEMPOTENCY
-- =============================================================================

-- Verify that 005_master_data.sql has been applied and includes ON CONFLICT clause
-- This migration can be run independently as it doesn't re-insert master data
-- If running migrations out of order, ensure 005 is applied first

DO $$
BEGIN
  -- Check if master_data table exists (indicates 005 was run)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_data') THEN
    RAISE EXCEPTION 'Migration 005_master_data.sql must be run before 006. Table master_data does not exist.';
  END IF;
  
  -- Verify the table has the expected structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'master_data' AND column_name = 'category'
  ) THEN
    RAISE EXCEPTION 'Migration 005_master_data.sql may not have completed correctly. Required columns missing.';
  END IF;
END $$;

COMMENT ON TABLE master_data IS 'Master data table created in migration 005. Migration 006 depends on this table existing.';

-- =============================================================================
-- 5. ADD AUDIT FIELDS TO EXISTING TABLES
-- =============================================================================

-- Add updated_by field to track who made the last change
DO $$ 
BEGIN
  -- Add updated_by to patients if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE patients ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add updated_by to appointments if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE appointments ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add updated_by to encounters if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'encounters' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE encounters ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- 6. CREATE HELPER FUNCTIONS FOR RBAC
-- =============================================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
  v_perm_value JSONB;
BEGIN
  -- Check if user is admin (has all permissions)
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Safely check specific permission in JSONB
  -- Use text comparison to avoid casting errors
  SELECT permissions->p_permission INTO v_perm_value
  FROM user_roles 
  WHERE user_id = p_user_id;
  
  -- Check if value exists and equals true (as string or boolean)
  IF v_perm_value IS NOT NULL THEN
    -- Handle both boolean and string representations
    IF jsonb_typeof(v_perm_value) = 'boolean' THEN
      RETURN v_perm_value::boolean;
    ELSIF jsonb_typeof(v_perm_value) = 'string' THEN
      RETURN v_perm_value::text = '"true"';
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================================
-- 7. CREATE COMPUTED COLUMN FOR PHARMACY LOW STOCK
-- =============================================================================

-- Add computed column for low stock items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pharmacy_items' AND column_name = 'is_low_stock'
  ) THEN
    ALTER TABLE pharmacy_items 
    ADD COLUMN is_low_stock BOOLEAN 
    GENERATED ALWAYS AS (current_stock < reorder_level) STORED;
    
    CREATE INDEX idx_pharmacy_low_stock ON pharmacy_items(is_low_stock) 
    WHERE is_low_stock = true;
  END IF;
END $$;

-- =============================================================================
-- 8. ADD INDEXES FOR PERFORMANCE
-- =============================================================================

-- Appointments indexes for conflict checks
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_time 
ON appointments(doctor_id, appointment_date, appointment_time) 
WHERE status NOT IN ('cancelled', 'no-show');

-- Patients indexes for search
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Cases indexes
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_created_by ON encounters(created_by);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE user_roles IS 'Role-based access control (RBAC) for users with granular permissions';
COMMENT ON COLUMN user_roles.role IS 'Primary role: admin, doctor, nurse, receptionist, pharmacist, patient';
COMMENT ON COLUMN user_roles.permissions IS 'Additional custom permissions stored as JSONB for extensibility';
COMMENT ON FUNCTION user_has_permission IS 'Helper function to check if user has specific permission. Admins have all permissions.';
COMMENT ON FUNCTION get_user_role IS 'Helper function to retrieve user role';

-- Migration complete
