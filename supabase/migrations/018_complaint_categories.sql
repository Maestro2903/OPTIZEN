-- Migration 018: Add hierarchical complaint categories
-- This migration adds complaint categories and updates complaints to support hierarchical structure

-- Step 1: Create complaint categories
-- Insert complaint category groups into master_data
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
('complaint_categories', 'Common Complaints', 'General complaints not specific to eye conditions', true, 1, '{}'),
('complaint_categories', 'Eye Complaints', 'Complaints specific to eye conditions and vision', true, 2, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- Step 2: Get category IDs for reference
DO $$
DECLARE
    common_category_id UUID;
    eye_category_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO common_category_id FROM master_data WHERE category = 'complaint_categories' AND name = 'Common Complaints';
    SELECT id INTO eye_category_id FROM master_data WHERE category = 'complaint_categories' AND name = 'Eye Complaints';

    -- Step 3: Update existing complaints to link to categories via metadata
    -- Merge with existing metadata to preserve any existing data
    -- Common Complaints (general symptoms)
    UPDATE master_data 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('parent_category_id', common_category_id)
    WHERE category = 'complaints' AND name IN (
        'Headache',
        'Tearing'
    ) AND (common_category_id IS NOT NULL);

    -- Eye Complaints (eye-specific symptoms)
    UPDATE master_data 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('parent_category_id', eye_category_id)
    WHERE category = 'complaints' AND name IN (
        'Eye Pain',
        'Blurred Vision',
        'Double Vision',
        'Dry Eyes',
        'Red Eyes',
        'Floaters',
        'Light Sensitivity',
        'Night Blindness'
    ) AND (eye_category_id IS NOT NULL);

    -- Note: Complaints without parent_category_id remain at root level for backward compatibility
END $$;

-- Step 4: Add more sample complaints if needed (optional)
-- You can add more complaints here with appropriate category assignments

-- Step 5: Create index on metadata for performance
CREATE INDEX IF NOT EXISTS idx_master_data_metadata_parent_category 
ON master_data USING gin (metadata) 
WHERE category = 'complaints' AND metadata ? 'parent_category_id';

-- Step 6: Add comment for documentation
COMMENT ON COLUMN master_data.metadata IS 'JSONB field for additional data. For complaints: {"parent_category_id": "uuid"} links complaint to a complaint category';

-- Migration complete

