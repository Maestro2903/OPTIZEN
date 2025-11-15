-- Migration 019: Add diagnostic_tests JSONB column to encounters table
-- This migration adds a structured JSONB column to store diagnostic test selections

-- Add diagnostic_tests JSONB column
-- Structure: [{test_id: uuid, eye?: string, type?: string, problem?: string, notes?: string}]
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS diagnostic_tests JSONB DEFAULT '[]'::jsonb;

-- Add index for JSONB column to improve query performance
CREATE INDEX IF NOT EXISTS idx_encounters_diagnostic_tests ON encounters USING gin (diagnostic_tests);

-- Add comment for documentation
COMMENT ON COLUMN encounters.diagnostic_tests IS 'Array of diagnostic test objects: [{test_id: uuid, eye?: string, type?: string, problem?: string, notes?: string}]';
