-- Fix bed_assignments foreign key constraints
-- The patient_id foreign key constraint is missing

-- First, check if there are any orphaned records
-- and delete them if they exist
DELETE FROM bed_assignments 
WHERE patient_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM patients WHERE id = bed_assignments.patient_id
);

-- Add the patient_id foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'bed_assignments_patient_id_fkey' 
    AND table_name = 'bed_assignments'
  ) THEN
    ALTER TABLE bed_assignments
    ADD CONSTRAINT bed_assignments_patient_id_fkey
    FOREIGN KEY (patient_id) 
    REFERENCES patients(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment
COMMENT ON CONSTRAINT bed_assignments_patient_id_fkey ON bed_assignments IS 
'Foreign key constraint linking bed assignments to patients';
