-- Migration 017: Add JSONB columns for complaints, treatments, and examination_data to encounters table
-- This migration adds structured JSONB columns to store master data references and examination data

-- Add complaints JSONB column
-- Structure: [{categoryId: uuid | null, complaintId: uuid, duration?: string, eye?: string, notes?: string}]
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS complaints JSONB DEFAULT '[]'::jsonb;

-- Add treatments JSONB column  
-- Structure: [{drug_id: uuid, dosage_id?: uuid, route_id?: uuid, duration?: string, eye?: string, quantity?: string}]
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS treatments JSONB DEFAULT '[]'::jsonb;

-- Add examination_data JSONB column
-- Structure: {anterior_segment: {...}, posterior_segment: {...}, tests: {...}, vision: {...}, refraction: {...}, blood_investigation: {...}, ...}
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS examination_data JSONB DEFAULT '{}'::jsonb;

-- Add indexes for JSONB columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_encounters_complaints ON encounters USING gin (complaints);
CREATE INDEX IF NOT EXISTS idx_encounters_treatments ON encounters USING gin (treatments);
CREATE INDEX IF NOT EXISTS idx_encounters_examination_data ON encounters USING gin (examination_data);

-- Add comments for documentation
COMMENT ON COLUMN encounters.complaints IS 'Array of complaint objects with master_data references: [{categoryId: uuid | null, complaintId: uuid, duration?: string, eye?: string, notes?: string}]';
COMMENT ON COLUMN encounters.treatments IS 'Array of treatment/medication objects with master_data references: [{drug_id: uuid, dosage_id?: uuid, route_id?: uuid, duration?: string, eye?: string, quantity?: string}]';
COMMENT ON COLUMN encounters.examination_data IS 'Structured examination data including anterior/posterior segment, IOP, vision, refraction, blood investigation, etc.';

