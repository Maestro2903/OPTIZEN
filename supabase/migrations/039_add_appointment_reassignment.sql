-- Migration: Add appointment reassignment tracking
-- Description: Adds columns to track appointment reassignment history and creates audit table
-- Created: 2024-11-14

-- ============================================================================
-- 1. Add reassignment columns to appointments table
-- ============================================================================

-- Add columns for tracking appointment reassignments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS original_provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reassigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reassignment_reason TEXT,
ADD COLUMN IF NOT EXISTS reassignment_date TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN appointments.original_provider_id IS 'Original provider before any reassignment';
COMMENT ON COLUMN appointments.reassigned_by IS 'User who performed the reassignment';
COMMENT ON COLUMN appointments.reassignment_reason IS 'Reason for reassignment';
COMMENT ON COLUMN appointments.reassignment_date IS 'Timestamp when appointment was reassigned';

-- ============================================================================
-- 2. Create appointment history audit table
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_history (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('created', 'updated', 'reassigned', 'cancelled', 'completed', 'rescheduled')),
  old_provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  new_provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  old_date DATE,
  new_date DATE,
  old_start_time TIME,
  new_start_time TIME,
  old_end_time TIME,
  new_end_time TIME,
  old_status appointment_status,
  new_status appointment_status,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id ON appointment_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_changed_at ON appointment_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_history_action_type ON appointment_history(action_type);

-- Add comments
COMMENT ON TABLE appointment_history IS 'Audit trail for all appointment changes';
COMMENT ON COLUMN appointment_history.action_type IS 'Type of action: created, updated, reassigned, cancelled, completed, rescheduled';
COMMENT ON COLUMN appointment_history.old_provider_id IS 'Provider before change';
COMMENT ON COLUMN appointment_history.new_provider_id IS 'Provider after change';
COMMENT ON COLUMN appointment_history.changed_by IS 'User who made the change';

-- ============================================================================
-- 3. Create function to automatically log appointment changes
-- ============================================================================

CREATE OR REPLACE FUNCTION log_appointment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new appointment)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO appointment_history (
      appointment_id,
      action_type,
      new_provider_id,
      new_date,
      new_start_time,
      new_end_time,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      'created',
      NEW.provider_id,
      NEW.appointment_date,
      NEW.start_time,
      NEW.end_time,
      NEW.status,
      NEW.updated_by,
      'Appointment created'
    );
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Detect reassignment (provider changed)
    IF OLD.provider_id IS DISTINCT FROM NEW.provider_id THEN
      INSERT INTO appointment_history (
        appointment_id,
        action_type,
        old_provider_id,
        new_provider_id,
        old_date,
        new_date,
        old_start_time,
        new_start_time,
        old_end_time,
        new_end_time,
        old_status,
        new_status,
        changed_by,
        reason,
        notes
      ) VALUES (
        NEW.id,
        'reassigned',
        OLD.provider_id,
        NEW.provider_id,
        OLD.appointment_date,
        NEW.appointment_date,
        OLD.start_time,
        NEW.start_time,
        OLD.end_time,
        NEW.end_time,
        OLD.status,
        NEW.status,
        NEW.updated_by,
        NEW.reassignment_reason,
        'Provider reassigned from ' || (SELECT full_name FROM users WHERE id = OLD.provider_id) || ' to ' || (SELECT full_name FROM users WHERE id = NEW.provider_id)
      );
    
    -- Detect status change
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO appointment_history (
        appointment_id,
        action_type,
        new_provider_id,
        old_date,
        new_date,
        old_start_time,
        new_start_time,
        old_end_time,
        new_end_time,
        old_status,
        new_status,
        changed_by,
        notes
      ) VALUES (
        NEW.id,
        CASE 
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          WHEN NEW.status = 'completed' THEN 'completed'
          ELSE 'updated'
        END,
        NEW.provider_id,
        OLD.appointment_date,
        NEW.appointment_date,
        OLD.start_time,
        NEW.start_time,
        OLD.end_time,
        NEW.end_time,
        OLD.status,
        NEW.status,
        NEW.updated_by,
        'Status changed from ' || OLD.status || ' to ' || NEW.status
      );
    
    -- Detect reschedule (date or time changed)
    ELSIF OLD.appointment_date IS DISTINCT FROM NEW.appointment_date 
       OR OLD.start_time IS DISTINCT FROM NEW.start_time 
       OR OLD.end_time IS DISTINCT FROM NEW.end_time THEN
      INSERT INTO appointment_history (
        appointment_id,
        action_type,
        new_provider_id,
        old_date,
        new_date,
        old_start_time,
        new_start_time,
        old_end_time,
        new_end_time,
        old_status,
        new_status,
        changed_by,
        notes
      ) VALUES (
        NEW.id,
        'rescheduled',
        NEW.provider_id,
        OLD.appointment_date,
        NEW.appointment_date,
        OLD.start_time,
        NEW.start_time,
        OLD.end_time,
        NEW.end_time,
        OLD.status,
        NEW.status,
        NEW.updated_by,
        'Appointment rescheduled'
      );
    
    -- General update
    ELSE
      INSERT INTO appointment_history (
        appointment_id,
        action_type,
        new_provider_id,
        new_date,
        new_start_time,
        new_end_time,
        new_status,
        changed_by,
        notes
      ) VALUES (
        NEW.id,
        'updated',
        NEW.provider_id,
        NEW.appointment_date,
        NEW.start_time,
        NEW.end_time,
        NEW.status,
        NEW.updated_by,
        'Appointment details updated'
      );
    END IF;
    
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Create trigger for automatic logging
-- ============================================================================

DROP TRIGGER IF EXISTS appointment_change_log_trigger ON appointments;

CREATE TRIGGER appointment_change_log_trigger
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_appointment_change();

-- ============================================================================
-- 5. Add indexes for doctor schedule queries
-- ============================================================================

-- Index for doctor schedule lookups (provider + date)
CREATE INDEX IF NOT EXISTS idx_appointments_provider_date 
ON appointments(provider_id, appointment_date, start_time) 
WHERE status NOT IN ('cancelled', 'no-show');

-- Index for original provider lookups
CREATE INDEX IF NOT EXISTS idx_appointments_original_provider 
ON appointments(original_provider_id) 
WHERE original_provider_id IS NOT NULL;

-- Index for reassignment tracking
CREATE INDEX IF NOT EXISTS idx_appointments_reassigned 
ON appointments(reassignment_date) 
WHERE reassignment_date IS NOT NULL;

-- ============================================================================
-- 6. Create view for doctor schedule with history
-- ============================================================================

CREATE OR REPLACE VIEW doctor_schedule_view AS
SELECT 
  a.id,
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.type,
  a.status,
  a.room,
  a.notes,
  a.provider_id,
  a.patient_id,
  a.original_provider_id,
  a.reassignment_reason,
  a.reassignment_date,
  a.reassigned_by,
  a.created_at,
  a.updated_at,
  -- Provider details
  provider.full_name AS provider_name,
  provider.email AS provider_email,
  provider.role AS provider_role,
  provider.phone AS provider_phone,
  -- Original provider details (if reassigned)
  original_provider.full_name AS original_provider_name,
  original_provider.role AS original_provider_role,
  -- Patient details
  p.patient_id AS patient_code,
  p.full_name AS patient_name,
  p.email AS patient_email,
  p.mobile AS patient_mobile,
  p.gender AS patient_gender,
  p.date_of_birth AS patient_dob,
  -- Reassigned by user details
  reassigned_user.email AS reassigned_by_email,
  -- Calculated fields
  CASE 
    WHEN a.original_provider_id IS NOT NULL THEN true
    ELSE false
  END AS is_reassigned,
  EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 60 AS duration_minutes
FROM appointments a
LEFT JOIN users provider ON a.provider_id = provider.id
LEFT JOIN users original_provider ON a.original_provider_id = original_provider.id
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN auth.users reassigned_user ON a.reassigned_by = reassigned_user.id;

COMMENT ON VIEW doctor_schedule_view IS 'Comprehensive view of doctor schedules with patient and reassignment details';

-- ============================================================================
-- 7. Create function to check doctor availability
-- ============================================================================

CREATE OR REPLACE FUNCTION check_doctor_availability(
  p_doctor_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflicting_appointments JSON
) AS $$
BEGIN
  RETURN QUERY
  WITH conflicts AS (
    SELECT 
      a.id,
      a.appointment_date,
      a.start_time,
      a.end_time,
      a.type,
      p.full_name AS patient_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.provider_id = p_doctor_id
      AND a.appointment_date = p_date
      AND a.status NOT IN ('cancelled', 'no-show')
      AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
      AND (
        -- Check for time overlap: (start1 < end2 AND start2 < end1)
        (a.start_time < p_end_time AND p_start_time < a.end_time)
      )
  )
  SELECT 
    EXISTS(SELECT 1 FROM conflicts) AS has_conflict,
    CASE 
      WHEN EXISTS(SELECT 1 FROM conflicts) THEN
        (SELECT json_agg(row_to_json(conflicts.*)) FROM conflicts)
      ELSE NULL
    END AS conflicting_appointments;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_doctor_availability IS 'Check if doctor has conflicting appointments at specified time';

-- ============================================================================
-- 8. Grant permissions (if RLS is enabled)
-- ============================================================================

-- Grant access to appointment_history table
GRANT SELECT ON appointment_history TO authenticated;
GRANT INSERT ON appointment_history TO authenticated;

-- Grant access to doctor_schedule_view
GRANT SELECT ON doctor_schedule_view TO authenticated;

-- ============================================================================
-- Migration complete
-- ============================================================================
