-- Add country field to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';

-- Update master_data table to support new categories
-- Categories to add: roles, room_types, surgery_types, expense_categories

-- Insert default roles
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
('roles', 'Doctor', 'Medical Doctor', true, 1, '{}'),
('roles', 'Nurse', 'Nursing Staff', true, 2, '{}'),
('roles', 'Receptionist', 'Front Desk Staff', true, 3, '{}'),
('roles', 'Technician', 'Lab/Equipment Technician', true, 4, '{}'),
('roles', 'Optometrist', 'Optometry Specialist', true, 5, '{}'),
('roles', 'Administrator', 'Administrative Staff', true, 6, '{}')
ON CONFLICT DO NOTHING;

-- Insert default room types
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
('room_types', 'Consultation Room', 'General consultation room', true, 1, '{}'),
('room_types', 'Operation Theatre', 'Surgical operation room', true, 2, '{}'),
('room_types', 'Refraction Room', 'Eye refraction testing room', true, 3, '{}'),
('room_types', 'Examination Room', 'General examination room', true, 4, '{}'),
('room_types', 'Recovery Room', 'Post-operative recovery room', true, 5, '{}'),
('room_types', 'Waiting Area', 'Patient waiting area', true, 6, '{}')
ON CONFLICT DO NOTHING;

-- Insert default surgery types
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
('surgery_types', 'Cataract Surgery', 'Phacoemulsification with IOL', true, 1, '{}'),
('surgery_types', 'LASIK', 'Laser-Assisted In Situ Keratomileusis', true, 2, '{}'),
('surgery_types', 'Glaucoma Surgery', 'Trabeculectomy or other glaucoma procedures', true, 3, '{}'),
('surgery_types', 'Retinal Surgery', 'Vitrectomy and retinal procedures', true, 4, '{}'),
('surgery_types', 'Corneal Transplant', 'Penetrating or lamellar keratoplasty', true, 5, '{}'),
('surgery_types', 'Pterygium Surgery', 'Pterygium excision with graft', true, 6, '{}'),
('surgery_types', 'Strabismus Surgery', 'Eye muscle correction surgery', true, 7, '{}'),
('surgery_types', 'DCR', 'Dacryocystorhinostomy', true, 8, '{}'),
('surgery_types', 'Ptosis Repair', 'Eyelid ptosis correction', true, 9, '{}'),
('surgery_types', 'Chalazion Excision', 'Chalazion removal', true, 10, '{}')
ON CONFLICT DO NOTHING;

-- Insert default expense categories
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
('expense_categories', 'Salaries', 'Employee salaries and wages', true, 1, '{}'),
('expense_categories', 'Medical Supplies', 'Medical equipment and supplies', true, 2, '{}'),
('expense_categories', 'Utilities', 'Electricity, water, internet', true, 3, '{}'),
('expense_categories', 'Rent', 'Building rent and lease', true, 4, '{}'),
('expense_categories', 'Maintenance', 'Equipment and facility maintenance', true, 5, '{}'),
('expense_categories', 'Marketing', 'Advertising and marketing expenses', true, 6, '{}'),
('expense_categories', 'Insurance', 'Insurance premiums', true, 7, '{}'),
('expense_categories', 'Office Supplies', 'Stationery and office materials', true, 8, '{}'),
('expense_categories', 'Travel', 'Business travel expenses', true, 9, '{}'),
('expense_categories', 'Professional Fees', 'Legal, accounting, consulting fees', true, 10, '{}'),
('expense_categories', 'Other', 'Miscellaneous expenses', true, 11, '{}')
ON CONFLICT DO NOTHING;

-- Update employees table to use auto-generated employee_id
-- Create a sequence for employee IDs (atomic and performant)
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1 INCREMENT 1;

-- Create function to generate employee ID using sequence
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EMP-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(NEXTVAL('employee_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate employee_id
CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NULL OR NEW.employee_id = '' THEN
    NEW.employee_id := generate_employee_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_employee_id ON employees;
CREATE TRIGGER trigger_set_employee_id
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION set_employee_id();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_data_category_name ON master_data(category, name);
CREATE INDEX IF NOT EXISTS idx_patients_country ON patients(country);

-- Add comment
COMMENT ON COLUMN patients.country IS 'Patient country for address';
COMMENT ON TRIGGER trigger_set_employee_id ON employees IS 'Auto-generates employee_id on insert';
