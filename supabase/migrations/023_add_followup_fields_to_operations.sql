-- Migration 023: Add Follow-up Fields to Operations Table
-- This migration adds follow-up related fields for operations

-- Add follow-up date field
ALTER TABLE operations 
ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Add follow-up notes field
ALTER TABLE operations 
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- Add follow-up visit type field (links to visit_types master data)
ALTER TABLE operations 
ADD COLUMN IF NOT EXISTS follow_up_visit_type VARCHAR(50);

-- Create index for follow-up date queries
CREATE INDEX IF NOT EXISTS idx_operations_follow_up_date ON operations(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN operations.follow_up_date IS 'Date for follow-up appointment after operation';
COMMENT ON COLUMN operations.follow_up_notes IS 'Notes or instructions for follow-up visit';
COMMENT ON COLUMN operations.follow_up_visit_type IS 'Type of follow-up visit (e.g., Follow-up-1, Follow-up-2)';

