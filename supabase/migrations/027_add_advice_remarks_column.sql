-- Migration 027: Add advice_remarks column to encounters table

-- Add advice_remarks column to store advice/instructions
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS advice_remarks TEXT;

-- Add comment for documentation
COMMENT ON COLUMN encounters.advice_remarks IS 'Additional advice, instructions, or remarks for the patient';

-- Create index for searching (if needed)
CREATE INDEX IF NOT EXISTS idx_encounters_advice_remarks ON encounters USING gin(to_tsvector('english', advice_remarks)) WHERE advice_remarks IS NOT NULL;
