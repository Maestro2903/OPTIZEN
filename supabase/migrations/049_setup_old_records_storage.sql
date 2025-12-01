-- Migration 049: Setup Old Patient Records Storage Bucket
-- Note: Storage buckets must be created via Supabase Dashboard or API
-- This migration documents the required setup

-- Storage bucket setup instructions:
-- 1. Create bucket named 'old-patient-records' in Supabase Dashboard
-- 2. Set bucket to public: false (private bucket)
-- 3. Configure RLS policies as documented below

-- Storage RLS Policies (to be applied via Supabase Dashboard or API):
-- 
-- Policy: "Authenticated users can upload files"
-- Operation: INSERT
-- Target roles: authenticated
-- Policy definition: 
--   (bucket_id = 'old-patient-records'::text) AND (auth.role() = 'authenticated'::text)
--
-- Policy: "Authenticated users can view files"
-- Operation: SELECT
-- Target roles: authenticated
-- Policy definition:
--   (bucket_id = 'old-patient-records'::text) AND (auth.role() = 'authenticated'::text)
--
-- Policy: "Authenticated users can delete their own files"
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition:
--   (bucket_id = 'old-patient-records'::text) AND (auth.role() = 'authenticated'::text)

-- File path structure in storage:
-- old-patient-records/{old_patient_id}/{timestamp}_{filename}

-- Example path: old-patient-records/PAT123/20240115120000_prescription.pdf



