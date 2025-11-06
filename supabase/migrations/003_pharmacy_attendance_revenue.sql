-- Pharmacy, Attendance, Appointments & Revenue Module Migration
-- Creates tables for pharmacy inventory, optical items, stock movements, 
-- staff attendance, expenses, and prescriptions

-- Create enum types
CREATE TYPE stock_movement_type AS ENUM (
  'purchase',
  'sale',
  'adjustment',
  'return',
  'expired',
  'damaged'
);

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'sick_leave',
  'casual_leave',
  'paid_leave',
  'half_day'
);

CREATE TYPE expense_category AS ENUM (
  'salary',
  'utilities',
  'supplies',
  'maintenance',
  'rent',
  'marketing',
  'equipment',
  'other'
);

CREATE TYPE item_category AS ENUM (
  'medicine',
  'frames',
  'lenses',
  'accessories',
  'equipment',
  'consumables'
);

-- Pharmacy Items table
CREATE TABLE pharmacy_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL,
  manufacturer TEXT,
  supplier TEXT,
  unit_price DECIMAL NOT NULL DEFAULT 0,
  mrp DECIMAL NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  batch_number TEXT,
  expiry_date DATE,
  hsn_code TEXT,
  gst_percentage DECIMAL DEFAULT 0,
  prescription_required BOOLEAN DEFAULT FALSE,
  dosage_form TEXT,
  strength TEXT,
  storage_instructions TEXT,
  description TEXT,
  image_url TEXT
);

-- Optical Items table (frames, lenses, accessories)
CREATE TABLE optical_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  item_type item_category NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sub_category TEXT,
  size TEXT,
  color TEXT,
  material TEXT,
  gender TEXT,
  purchase_price DECIMAL NOT NULL DEFAULT 0,
  selling_price DECIMAL NOT NULL DEFAULT 0,
  mrp DECIMAL NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 5,
  supplier TEXT,
  image_url TEXT,
  warranty_months INTEGER DEFAULT 0,
  hsn_code TEXT,
  gst_percentage DECIMAL DEFAULT 18
);

-- Stock Movements table (audit trail for all inventory)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  movement_date DATE NOT NULL,
  movement_type stock_movement_type NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('pharmacy', 'optical')),
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL,
  total_value DECIMAL,
  batch_number TEXT,
  reference_number TEXT,
  supplier TEXT,
  customer_name TEXT,
  invoice_id UUID REFERENCES invoices(id),
  user_id UUID REFERENCES users(id),
  notes TEXT,
  previous_stock INTEGER,
  new_stock INTEGER
);

-- Staff Attendance table
CREATE TABLE staff_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  check_in_time TIME,
  check_out_time TIME,
  working_hours DECIMAL,
  notes TEXT,
  marked_by UUID REFERENCES users(id),
  UNIQUE(user_id, attendance_date)
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  expense_date DATE NOT NULL,
  category expense_category NOT NULL,
  sub_category TEXT,
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  payment_method TEXT,
  vendor TEXT,
  bill_number TEXT,
  approved_by UUID REFERENCES users(id),
  added_by UUID REFERENCES users(id),
  notes TEXT,
  receipt_url TEXT
);

-- Prescriptions table
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id),
  prescribed_by UUID NOT NULL REFERENCES users(id),
  prescription_date DATE NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Prescription Items table
CREATE TABLE prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity INTEGER,
  instructions TEXT,
  pharmacy_item_id UUID REFERENCES pharmacy_items(id),
  dispensed BOOLEAN DEFAULT FALSE,
  dispensed_date DATE,
  dispensed_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_pharmacy_items_name ON pharmacy_items(name);
CREATE INDEX idx_pharmacy_items_expiry ON pharmacy_items(expiry_date);
CREATE INDEX idx_pharmacy_items_stock ON pharmacy_items(stock_quantity);
CREATE INDEX idx_optical_items_sku ON optical_items(sku);
CREATE INDEX idx_optical_items_type ON optical_items(item_type);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(attendance_date);
CREATE INDEX idx_staff_attendance_user ON staff_attendance(user_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date);

-- Apply updated_at triggers
CREATE TRIGGER update_pharmacy_items_updated_at BEFORE UPDATE ON pharmacy_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_optical_items_updated_at BEFORE UPDATE ON optical_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_attendance_updated_at BEFORE UPDATE ON staff_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE pharmacy_items IS 'Pharmaceutical inventory with batch tracking and expiry management';
COMMENT ON TABLE optical_items IS 'Optical inventory including frames, lenses, and accessories';
COMMENT ON TABLE stock_movements IS 'Complete audit trail for all inventory transactions';
COMMENT ON TABLE staff_attendance IS 'Daily attendance records for all staff members';
COMMENT ON TABLE expenses IS 'Operating expenses tracking and management';
COMMENT ON TABLE prescriptions IS 'Medical prescriptions linked to patient encounters';
COMMENT ON TABLE prescription_items IS 'Individual medicines in prescriptions';

