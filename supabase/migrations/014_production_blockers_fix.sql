-- Migration 014: Fix Critical Production Blockers
-- This migration addresses:
-- 1. TOCTOU race condition for appointment conflicts (database-level exclusion constraint)
-- 5. Low stock filter (computed column for pharmacy)

-- ============================================================================
-- FIX #1: Appointment Conflict Prevention (Database-Level)
-- ============================================================================

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add computed column for appointment end time (helper for constraint)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_end_time TIME 
GENERATED ALWAYS AS (
  (appointment_time::time + (COALESCE(duration_minutes, 30) || ' minutes')::interval)::time
) STORED;

-- Create exclusion constraint to prevent overlapping appointments for same doctor
-- This prevents two appointments from being scheduled for the same doctor at overlapping times
-- Syntax: EXCLUDE USING gist (column WITH operator, ...)
-- The constraint checks: same doctor_id AND same date AND overlapping time ranges
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments;
ALTER TABLE appointments 
ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING gist (
  doctor_id WITH =,
  appointment_date WITH =,
  tsrange(
    appointment_time::time::text::timestamp,
    appointment_end_time::time::text::timestamp
  ) WITH &&
)
WHERE (status != 'cancelled' AND status != 'no-show');

-- Create index to improve conflict check performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_time 
ON appointments (doctor_id, appointment_date, appointment_time)
WHERE status NOT IN ('cancelled', 'no-show');

-- ============================================================================
-- FIX #5: Pharmacy Low Stock Filter (Computed Column)
-- ============================================================================

-- Add computed column for low stock detection
ALTER TABLE pharmacy_items 
ADD COLUMN IF NOT EXISTS is_low_stock BOOLEAN 
GENERATED ALWAYS AS (
  current_stock < COALESCE(reorder_level, 0)
) STORED;

-- Create index for efficient low stock queries
CREATE INDEX IF NOT EXISTS idx_pharmacy_low_stock 
ON pharmacy_items (is_low_stock)
WHERE is_low_stock = true;

-- ============================================================================
-- Additional Improvements
-- ============================================================================

-- Add index for patient searches
CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm 
ON patients USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_patients_mobile_trgm 
ON patients USING gin (mobile gin_trgm_ops);

-- Enable trigram extension for better text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add index for invoice searches
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number 
ON invoices (invoice_number);

-- Add index for case searches
CREATE INDEX IF NOT EXISTS idx_cases_case_no 
ON cases (case_no);

-- ============================================================================
-- Verification Queries (Run after migration to test)
-- ============================================================================

-- Test appointment conflict constraint (should fail):
-- INSERT INTO appointments (patient_id, appointment_date, appointment_time, appointment_type, doctor_id, duration_minutes, status)
-- VALUES 
--   ('patient-uuid', '2025-01-15', '10:00', 'consult', 'doctor-uuid', 30, 'scheduled'),
--   ('patient-uuid-2', '2025-01-15', '10:15', 'consult', 'doctor-uuid', 30, 'scheduled'); -- Should fail

-- Test low stock filter:
-- SELECT name, current_stock, reorder_level, is_low_stock 
-- FROM pharmacy_items 
-- WHERE is_low_stock = true;

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================

-- To rollback this migration (use with caution):
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments;
-- ALTER TABLE appointments DROP COLUMN IF EXISTS appointment_end_time;
-- ALTER TABLE pharmacy_items DROP COLUMN IF EXISTS is_low_stock;
-- DROP INDEX IF EXISTS idx_appointments_doctor_date_time;
-- DROP INDEX IF EXISTS idx_pharmacy_low_stock;
-- DROP INDEX IF EXISTS idx_patients_full_name_trgm;
-- DROP INDEX IF EXISTS idx_patients_mobile_trgm;
-- DROP INDEX IF EXISTS idx_invoices_invoice_number;
-- DROP INDEX IF EXISTS idx_cases_case_no;
