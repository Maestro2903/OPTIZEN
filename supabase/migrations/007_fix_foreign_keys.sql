-- Fix foreign key constraints identified by CodeRabbit analysis
-- This migration addresses the missing ON DELETE clauses

-- Fix master_data table foreign key constraint
ALTER TABLE public.master_data
DROP CONSTRAINT IF EXISTS master_data_created_by_fkey;

-- Make created_by nullable first (in case it wasn't already)
ALTER TABLE public.master_data
ALTER COLUMN created_by DROP NOT NULL;

-- Add the foreign key constraint with proper ON DELETE behavior
ALTER TABLE public.master_data
ADD CONSTRAINT master_data_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Add similar fixes for other tables that might have foreign key issues
-- (Add more tables as needed based on your schema)

-- Create indexes for performance on foreign key columns
CREATE INDEX IF NOT EXISTS idx_master_data_created_by ON public.master_data(created_by);
CREATE INDEX IF NOT EXISTS idx_master_data_category ON public.master_data(category);
CREATE INDEX IF NOT EXISTS idx_master_data_is_active ON public.master_data(is_active);

-- Add updated_at trigger for master_data if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for master_data
DROP TRIGGER IF EXISTS master_data_updated_at ON public.master_data;
CREATE TRIGGER master_data_updated_at
    BEFORE UPDATE ON public.master_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.master_data IS 'Master data for dropdown options and reference values';
COMMENT ON COLUMN public.master_data.created_by IS 'User who created this master data entry. NULL if user was deleted.';
COMMENT ON COLUMN public.master_data.category IS 'Category of master data (e.g., complaints, medicines, treatments)';
COMMENT ON COLUMN public.master_data.metadata IS 'Additional category-specific data stored as JSON';