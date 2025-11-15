-- Migration: Fix staff_attendance table schema and add constraints
-- Author: Attendance System Enhancement
-- Date: 2025-11-12

-- Add foreign key constraint for user_id
ALTER TABLE staff_attendance
DROP CONSTRAINT IF EXISTS staff_attendance_user_id_fkey;

ALTER TABLE staff_attendance
ADD CONSTRAINT staff_attendance_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for marked_by
ALTER TABLE staff_attendance
DROP CONSTRAINT IF EXISTS staff_attendance_marked_by_fkey;

ALTER TABLE staff_attendance
ADD CONSTRAINT staff_attendance_marked_by_fkey 
FOREIGN KEY (marked_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint to prevent duplicate attendance entries for same user on same date
ALTER TABLE staff_attendance
DROP CONSTRAINT IF EXISTS staff_attendance_user_date_unique;

ALTER TABLE staff_attendance
ADD CONSTRAINT staff_attendance_user_date_unique 
UNIQUE (user_id, attendance_date);

-- Add check constraint to ensure check_out_time is after check_in_time
ALTER TABLE staff_attendance
DROP CONSTRAINT IF EXISTS check_times_valid;

ALTER TABLE staff_attendance
ADD CONSTRAINT check_times_valid 
CHECK (
  check_out_time IS NULL 
  OR check_in_time IS NULL 
  OR check_out_time > check_in_time
);

-- Create function to auto-calculate working hours
CREATE OR REPLACE FUNCTION calculate_working_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate working hours if both check-in and check-out times are present
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    -- Calculate difference in hours (with 2 decimal precision)
    NEW.working_hours := ROUND(
      EXTRACT(EPOCH FROM (NEW.check_out_time::time - NEW.check_in_time::time)) / 3600.0,
      2
    );
  ELSE
    NEW.working_hours := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS calculate_working_hours_trigger ON staff_attendance;

CREATE TRIGGER calculate_working_hours_trigger
  BEFORE INSERT OR UPDATE ON staff_attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_working_hours();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staff_attendance_user_id 
  ON staff_attendance(user_id);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_date 
  ON staff_attendance(attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_status 
  ON staff_attendance(status);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_user_date 
  ON staff_attendance(user_id, attendance_date DESC);

-- Add comment to table
COMMENT ON TABLE staff_attendance IS 'Daily attendance records for all staff members with automatic working hours calculation';
COMMENT ON COLUMN staff_attendance.working_hours IS 'Auto-calculated from check_in_time and check_out_time';
COMMENT ON CONSTRAINT staff_attendance_user_date_unique ON staff_attendance IS 'Prevents duplicate attendance entries for same user on same date';
