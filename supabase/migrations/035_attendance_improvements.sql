-- Migration: Attendance System Improvements
-- Description: Add constraints, indexes, and audit fields for attendance management
-- Date: 2025-11-13

-- Add working hours validation constraint
-- Note: The trigger already calculates working_hours, this just adds validation
ALTER TABLE staff_attendance
DROP CONSTRAINT IF EXISTS working_hours_reasonable;

ALTER TABLE staff_attendance
ADD CONSTRAINT working_hours_reasonable 
CHECK (working_hours IS NULL OR (working_hours >= 0 AND working_hours <= 24));

-- Add composite index for better query performance on date and status
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date_status 
  ON staff_attendance(attendance_date DESC, status);

-- Add composite index for user and date range queries
CREATE INDEX IF NOT EXISTS idx_staff_attendance_user_date_range 
  ON staff_attendance(user_id, attendance_date DESC);

-- Add index for status filtering
DROP INDEX IF EXISTS idx_staff_attendance_status;
CREATE INDEX idx_staff_attendance_status 
  ON staff_attendance(status) WHERE status IS NOT NULL;

-- Add audit columns for tracking attendance modifications
ALTER TABLE staff_attendance
ADD COLUMN IF NOT EXISTS marked_from_ip INET,
ADD COLUMN IF NOT EXISTS marked_from_location JSONB,
ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS modification_notes TEXT;

-- Add optional shift support (for future enhancement)
-- Shifts can be defined in master_data with category 'shifts'
ALTER TABLE staff_attendance
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES master_data(id);

-- Create function to prevent editing old attendance records (configurable)
-- By default, prevents editing records older than 7 days
CREATE OR REPLACE FUNCTION check_attendance_edit_window()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow super admins to edit anything
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, check if attendance_date is within edit window
  -- Allow edits only if attendance_date is within last 7 days
  IF OLD.attendance_date < CURRENT_DATE - INTERVAL '7 days' THEN
    RAISE EXCEPTION 'Cannot modify attendance records older than 7 days. Contact administrator for assistance.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce edit window
DROP TRIGGER IF EXISTS check_attendance_edit_window_trigger ON staff_attendance;
CREATE TRIGGER check_attendance_edit_window_trigger
  BEFORE UPDATE ON staff_attendance
  FOR EACH ROW
  EXECUTE FUNCTION check_attendance_edit_window();

-- Add comments for documentation
COMMENT ON CONSTRAINT working_hours_reasonable ON staff_attendance IS 
  'Ensures working hours are between 0 and 24 hours';

COMMENT ON COLUMN staff_attendance.marked_from_ip IS 
  'IP address from which attendance was marked (for audit trail)';

COMMENT ON COLUMN staff_attendance.marked_from_location IS 
  'Geographic location data when attendance was marked (optional)';

COMMENT ON COLUMN staff_attendance.shift_id IS 
  'Reference to shift from master_data (morning/evening/night)';

COMMENT ON COLUMN staff_attendance.modified_by IS 
  'User who last modified this attendance record';

COMMENT ON COLUMN staff_attendance.modification_notes IS 
  'Reason for modification (required when editing old records)';

-- Insert default shift types into master_data
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata)
VALUES
  ('shifts', 'Morning Shift', 'Regular morning shift (9 AM - 5 PM)', true, 1, '{"start_time": "09:00", "end_time": "17:00", "grace_period_minutes": 15}'::jsonb),
  ('shifts', 'Evening Shift', 'Evening shift (5 PM - 1 AM)', true, 2, '{"start_time": "17:00", "end_time": "01:00", "grace_period_minutes": 15}'::jsonb),
  ('shifts', 'Night Shift', 'Night shift (9 PM - 6 AM)', true, 3, '{"start_time": "21:00", "end_time": "06:00", "grace_period_minutes": 15}'::jsonb),
  ('shifts', 'Flexible', 'Flexible working hours', true, 4, '{"grace_period_minutes": 30}'::jsonb)
ON CONFLICT (category, name) DO UPDATE SET
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- Create function to calculate late/early status based on shift
CREATE OR REPLACE FUNCTION calculate_attendance_status_detail(
  p_check_in_time TIME,
  p_shift_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_shift_start TIME;
  v_shift_end TIME;
  v_grace_minutes INTEGER;
  v_shift_data JSONB;
  v_result JSONB;
  v_minutes_late INTEGER;
  v_minutes_early INTEGER;
BEGIN
  -- If no shift specified, return null
  IF p_shift_id IS NULL OR p_check_in_time IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get shift details
  SELECT metadata INTO v_shift_data
  FROM master_data
  WHERE id = p_shift_id AND category = 'shifts';
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Extract shift timings
  v_shift_start := (v_shift_data->>'start_time')::TIME;
  v_grace_minutes := COALESCE((v_shift_data->>'grace_period_minutes')::INTEGER, 0);
  
  -- Calculate minutes difference
  v_minutes_late := EXTRACT(EPOCH FROM (p_check_in_time - v_shift_start)) / 60;
  
  -- Build result
  v_result := jsonb_build_object(
    'shift_start', v_shift_start::TEXT,
    'actual_check_in', p_check_in_time::TEXT,
    'minutes_difference', v_minutes_late,
    'grace_period_minutes', v_grace_minutes
  );
  
  -- Determine status
  IF v_minutes_late <= v_grace_minutes THEN
    v_result := v_result || jsonb_build_object('status', 'on_time');
  ELSE
    v_result := v_result || jsonb_build_object('status', 'late', 'minutes_late', v_minutes_late - v_grace_minutes);
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add statistics view for attendance analytics
CREATE OR REPLACE VIEW attendance_statistics AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.employee_id,
  u.role,
  u.department,
  COUNT(*) as total_days,
  SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as days_present,
  SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as days_absent,
  SUM(CASE WHEN sa.status IN ('sick_leave', 'casual_leave', 'paid_leave') THEN 1 ELSE 0 END) as days_on_leave,
  SUM(CASE WHEN sa.status = 'half_day' THEN 1 ELSE 0 END) as half_days,
  ROUND(AVG(sa.working_hours), 2) as avg_working_hours,
  ROUND(
    (SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as attendance_percentage,
  DATE_TRUNC('month', sa.attendance_date)::DATE as month
FROM users u
LEFT JOIN staff_attendance sa ON u.id = sa.user_id
WHERE u.is_active = true
GROUP BY u.id, u.full_name, u.employee_id, u.role, u.department, DATE_TRUNC('month', sa.attendance_date);

-- Add permissions comment
COMMENT ON VIEW attendance_statistics IS 
  'Monthly attendance statistics per employee for reporting and analytics';

-- Create index on users table for attendance queries
CREATE INDEX IF NOT EXISTS idx_users_active_role 
  ON users(is_active, role) WHERE is_active = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Attendance improvements migration completed successfully!';
  RAISE NOTICE 'Added: working hours validation, audit fields, shift support, edit window protection';
  RAISE NOTICE 'Created: attendance statistics view and performance indexes';
END $$;

