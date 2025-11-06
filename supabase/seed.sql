-- Seed data for development/testing

-- Insert demo patients
INSERT INTO patients (mrn, first_name, last_name, date_of_birth, gender, phone, email, city, state, allergies, systemic_conditions) VALUES
  ('MRN20240001', 'Rajesh', 'Kumar', '1975-03-15', 'male', '+91-9876543210', 'rajesh.kumar@email.com', 'Mumbai', 'Maharashtra', ARRAY['Penicillin'], ARRAY['Diabetes', 'Hypertension']),
  ('MRN20240002', 'Priya', 'Sharma', '1988-07-22', 'female', '+91-9876543211', 'priya.sharma@email.com', 'Delhi', 'Delhi', ARRAY[]::TEXT[], ARRAY[]::TEXT[]),
  ('MRN20240003', 'Amit', 'Patel', '1965-11-30', 'male', '+91-9876543212', 'amit.patel@email.com', 'Ahmedabad', 'Gujarat', ARRAY['Sulfa drugs'], ARRAY['Glaucoma']),
  ('MRN20240004', 'Sunita', 'Reddy', '1992-05-18', 'female', '+91-9876543213', 'sunita.reddy@email.com', 'Hyderabad', 'Telangana', ARRAY[]::TEXT[], ARRAY[]::TEXT[]),
  ('MRN20240005', 'Vikram', 'Singh', '1980-09-10', 'male', '+91-9876543214', 'vikram.singh@email.com', 'Bangalore', 'Karnataka', ARRAY[]::TEXT[], ARRAY['Diabetes']);

-- Insert demo inventory items
INSERT INTO inventory (sku, name, category, description, unit_price, stock_quantity, reorder_level, supplier) VALUES
  ('FRM001', 'Ray-Ban Wayfarer Classic', 'Frames', 'Classic plastic frame', 8999.00, 25, 5, 'Luxottica'),
  ('FRM002', 'Oakley Holbrook', 'Frames', 'Sport style frame', 12999.00, 15, 5, 'Luxottica'),
  ('LENS001', 'Single Vision CR-39', 'Lenses', 'Standard plastic lens', 1500.00, 100, 20, 'Essilor'),
  ('LENS002', 'Progressive Varilux', 'Lenses', 'Premium progressive lens', 8500.00, 50, 10, 'Essilor'),
  ('LENS003', 'Blue Light Blocking', 'Lenses', 'Computer glasses lens', 2500.00, 75, 15, 'Zeiss'),
  ('COAT001', 'Anti-Reflective Coating', 'Coating', 'Premium AR coating', 1200.00, 200, 30, 'Crizal'),
  ('CONT001', 'Acuvue Oasys', 'Contact Lenses', 'Monthly disposable', 2800.00, 40, 10, 'Johnson & Johnson'),
  ('CONT002', 'Air Optix', 'Contact Lenses', 'Monthly disposable', 2500.00, 35, 10, 'Alcon');

-- Note: Users, appointments, encounters, and invoices should be created through the application
-- with proper authentication context to ensure RLS policies work correctly

