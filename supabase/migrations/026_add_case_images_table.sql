-- Migration 026: Add case_images table for storing case-related images

-- Create case_images table
CREATE TABLE IF NOT EXISTS case_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Foreign key to encounters (cases)
  case_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  
  -- Image metadata
  image_type VARCHAR(50) NOT NULL, -- 'fundus', 'anterior_segment', 'oct', 'visual_field', 'external', 'diagram', 'other'
  image_category VARCHAR(50), -- 'right_eye', 'left_eye', 'both_eyes'
  image_url TEXT NOT NULL, -- URL to the stored image (could be in Supabase Storage or external)
  thumbnail_url TEXT, -- Optional thumbnail URL
  
  -- Additional metadata
  title VARCHAR(255),
  description TEXT,
  file_name VARCHAR(255),
  file_size INTEGER, -- Size in bytes
  mime_type VARCHAR(100), -- e.g., 'image/jpeg', 'image/png'
  
  -- Diagram data (for eye drawings)
  diagram_data JSONB, -- Stores drawing data if it's a diagram
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  
  -- Indexes for common queries
  CONSTRAINT case_images_case_id_fkey FOREIGN KEY (case_id) REFERENCES encounters(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_case_images_case_id ON case_images(case_id);
CREATE INDEX IF NOT EXISTS idx_case_images_image_type ON case_images(image_type);
CREATE INDEX IF NOT EXISTS idx_case_images_created_at ON case_images(created_at);
CREATE INDEX IF NOT EXISTS idx_case_images_is_active ON case_images(is_active) WHERE is_active = true;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_case_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_case_images_updated_at
  BEFORE UPDATE ON case_images
  FOR EACH ROW
  EXECUTE FUNCTION update_case_images_updated_at();

-- Add comments for documentation
COMMENT ON TABLE case_images IS 'Stores images associated with patient cases/encounters';
COMMENT ON COLUMN case_images.case_id IS 'Foreign key reference to the encounters table';
COMMENT ON COLUMN case_images.image_type IS 'Type of image: fundus, anterior_segment, oct, visual_field, external, diagram, other';
COMMENT ON COLUMN case_images.image_category IS 'Eye category: right_eye, left_eye, both_eyes';
COMMENT ON COLUMN case_images.image_url IS 'URL to the full-size image';
COMMENT ON COLUMN case_images.thumbnail_url IS 'URL to the thumbnail version of the image';
COMMENT ON COLUMN case_images.diagram_data IS 'JSON data for eye diagrams/drawings';
COMMENT ON COLUMN case_images.metadata IS 'Additional metadata for the image';

-- Add RLS policies
ALTER TABLE case_images ENABLE ROW LEVEL SECURITY;

-- Policy for viewing case images (same as encounters)
CREATE POLICY "Users can view case images for authorized cases" ON case_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM encounters e
      WHERE e.id = case_images.case_id
    )
  );

-- Policy for inserting case images
CREATE POLICY "Authorized users can insert case images" ON case_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'doctor', 'nurse', 'receptionist')
      AND ur.is_active = true
    )
  );

-- Policy for updating case images
CREATE POLICY "Authorized users can update case images" ON case_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'doctor', 'nurse')
      AND ur.is_active = true
    )
  );

-- Policy for deleting case images
CREATE POLICY "Only admins can delete case images" ON case_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
    )
  );
