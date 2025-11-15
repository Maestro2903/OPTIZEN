-- Migration 022: Add Case Columns to Encounters Table
-- This migration adds missing columns needed for the cases functionality

-- Add case_no column (unique identifier for cases)
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS case_no TEXT;

-- Add unique index on case_no (if case_no exists, it should be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_case_no ON encounters(case_no) WHERE case_no IS NOT NULL;

-- Add visit_type column
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50);

-- Add status column with CHECK constraint
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'pending'));

-- Add past_medical_history column
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS past_medical_history TEXT;

-- Add history_of_present_illness column
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS history_of_present_illness TEXT;

-- Add examination_findings column
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS examination_findings TEXT;

-- Add treatment_plan column (separate from plan column)
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS treatment_plan TEXT;

-- Add medications_prescribed column
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS medications_prescribed TEXT;

-- Add follow_up_instructions column
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS follow_up_instructions TEXT;

-- Add created_by column
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_encounters_case_no_search ON encounters(case_no) WHERE case_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encounters_visit_type ON encounters(visit_type) WHERE visit_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status) WHERE status IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN encounters.case_no IS 'Unique case number identifier';
COMMENT ON COLUMN encounters.visit_type IS 'Type of visit: First, Follow-up-1, Follow-up-2, Follow-up-3';
COMMENT ON COLUMN encounters.status IS 'Case status: active, completed, cancelled, pending';
COMMENT ON COLUMN encounters.past_medical_history IS 'Past medical history of the patient';
COMMENT ON COLUMN encounters.history_of_present_illness IS 'History of present illness';
COMMENT ON COLUMN encounters.examination_findings IS 'Examination findings';
COMMENT ON COLUMN encounters.treatment_plan IS 'Treatment plan for the patient';
COMMENT ON COLUMN encounters.medications_prescribed IS 'Medications prescribed to the patient';
COMMENT ON COLUMN encounters.follow_up_instructions IS 'Follow-up instructions for the patient';
COMMENT ON COLUMN encounters.created_by IS 'User who created the case';

