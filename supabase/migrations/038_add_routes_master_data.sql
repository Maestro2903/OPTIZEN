-- Migration: Add medication routes to master_data
-- Description: Add common medication routes for eye care prescriptions
-- Created: 2025-11-13

-- Insert medication routes into master_data
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata)
VALUES
  ('routes', 'Eye Drops (Ophthalmic)', 'Topical eye drops applied directly to the eye', true, 1, '{"common": true}'::jsonb),
  ('routes', 'Eye Ointment', 'Topical ointment applied to the eye or eyelid', true, 2, '{"common": true}'::jsonb),
  ('routes', 'Oral (PO)', 'Medication taken by mouth', true, 3, '{"common": true}'::jsonb),
  ('routes', 'Topical', 'Applied to skin or surface', true, 4, '{"common": true}'::jsonb),
  ('routes', 'Intravitreal Injection', 'Injection into the vitreous cavity of the eye', true, 5, '{"common": false, "requires_procedure": true}'::jsonb),
  ('routes', 'Subconjunctival', 'Injection under the conjunctiva', true, 6, '{"common": false, "requires_procedure": true}'::jsonb),
  ('routes', 'Intravenous (IV)', 'Administered into a vein', true, 7, '{"common": false}'::jsonb),
  ('routes', 'Intramuscular (IM)', 'Administered into muscle tissue', true, 8, '{"common": false}'::jsonb),
  ('routes', 'Subcutaneous (SC)', 'Administered under the skin', true, 9, '{"common": false}'::jsonb),
  ('routes', 'Periocular', 'Around the eye area', true, 10, '{"common": false}'::jsonb),
  ('routes', 'Retrobulbar', 'Behind the eyeball', true, 11, '{"common": false, "requires_procedure": true}'::jsonb),
  ('routes', 'Peribulbar', 'Around the eyeball', true, 12, '{"common": false, "requires_procedure": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE master_data IS 'Master data table containing various categories including medication routes for prescriptions';

