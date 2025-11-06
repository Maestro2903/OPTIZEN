-- Bed Management Module Migration
-- Creates tables for hospital bed tracking and patient assignments

-- Create enum types
CREATE TYPE bed_status AS ENUM (
  'available',
  'occupied',
  'maintenance',
  'reserved',
  'cleaning'
);

CREATE TYPE ward_type AS ENUM (
  'general',
  'icu',
  'private',
  'semi_private',
  'emergency'
);

CREATE TYPE bed_assignment_status AS ENUM (
  'active',
  'discharged',
  'transferred'
);

-- Beds table
CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  bed_number TEXT UNIQUE NOT NULL,
  ward_name TEXT NOT NULL,
  ward_type ward_type NOT NULL DEFAULT 'general',
  bed_type TEXT NOT NULL DEFAULT 'Standard',
  floor_number INTEGER NOT NULL,
  room_number TEXT,
  status bed_status NOT NULL DEFAULT 'available',
  daily_rate DECIMAL NOT NULL DEFAULT 0,
  description TEXT,
  facilities TEXT[]
);

-- Bed Assignments table
CREATE TABLE bed_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_discharge_date DATE,
  actual_discharge_date TIMESTAMP WITH TIME ZONE,
  surgery_scheduled_time TIMESTAMP WITH TIME ZONE,
  surgery_type TEXT,
  admission_reason TEXT NOT NULL,
  assigned_doctor_id UUID REFERENCES users(id),
  notes TEXT,
  status bed_assignment_status NOT NULL DEFAULT 'active',
  CONSTRAINT only_one_active_assignment_per_bed 
    EXCLUDE USING gist (bed_id WITH =) WHERE (status = 'active')
);

-- Create indexes
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_beds_ward ON beds(ward_type);
CREATE INDEX idx_beds_floor ON beds(floor_number);
CREATE INDEX idx_beds_number ON beds(bed_number);
CREATE INDEX idx_bed_assignments_bed ON bed_assignments(bed_id);
CREATE INDEX idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX idx_bed_assignments_status ON bed_assignments(status);
CREATE INDEX idx_bed_assignments_admission_date ON bed_assignments(admission_date);
CREATE INDEX idx_bed_assignments_surgery ON bed_assignments(surgery_scheduled_time);

-- Apply updated_at triggers
CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bed_assignments_updated_at BEFORE UPDATE ON bed_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update bed status when assignment is created/updated
CREATE OR REPLACE FUNCTION update_bed_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE beds SET status = 'occupied' WHERE id = NEW.bed_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      UPDATE beds SET status = 'occupied' WHERE id = NEW.bed_id;
    ELSIF NEW.status != 'active' AND OLD.status = 'active' THEN
      UPDATE beds SET status = 'available' WHERE id = NEW.bed_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE beds SET status = 'available' WHERE id = OLD.bed_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic bed status updates
CREATE TRIGGER bed_assignment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bed_assignments
  FOR EACH ROW EXECUTE FUNCTION update_bed_status_on_assignment();

-- Comments
COMMENT ON TABLE beds IS 'Hospital beds with ward information and availability status';
COMMENT ON TABLE bed_assignments IS 'Patient assignments to beds with admission and surgery details';
COMMENT ON COLUMN bed_assignments.surgery_scheduled_time IS 'Scheduled surgery time for the patient during this admission';

