-- Migration 020: Add vision_data JSONB column to encounters table
-- This migration adds a structured JSONB column to store vision test data

-- Add vision_data JSONB column
-- Structure: {unaided: {right?: string, left?: string}, pinhole: {right?: string, left?: string}, aided: {right?: string, left?: string}, near: {right?: string, left?: string}}
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS vision_data JSONB DEFAULT '{}'::jsonb;

-- Add index for JSONB column to improve query performance
CREATE INDEX IF NOT EXISTS idx_encounters_vision_data ON encounters USING gin (vision_data);

-- Add comment for documentation
COMMENT ON COLUMN encounters.vision_data IS 'Vision test data: {unaided: {right?, left?}, pinhole: {right?, left?}, aided: {right?, left?}, near: {right?, left?}}';

