-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE optical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (auth.user_role() IN ('super_admin', 'hospital_admin'));

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (auth.user_role() IN ('super_admin', 'hospital_admin'));

-- Patients table policies
CREATE POLICY "Staff can view all patients"
  ON patients FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist',
      'optometrist', 'ophthalmologist', 'technician', 'billing_staff'
    )
  );

CREATE POLICY "Patients can view own record"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email = patients.email
      AND users.role = 'patient'
    )
  );

CREATE POLICY "Staff can create patients"
  ON patients FOR INSERT
  WITH CHECK (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist'
    )
  );

CREATE POLICY "Staff can update patients"
  ON patients FOR UPDATE
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist',
      'optometrist', 'ophthalmologist'
    )
  );

-- Appointments table policies
CREATE POLICY "Staff can view all appointments"
  ON appointments FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist',
      'optometrist', 'ophthalmologist', 'technician'
    )
  );

CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      JOIN users ON users.email = patients.email
      WHERE patients.id = appointments.patient_id
      AND users.id = auth.uid()
      AND users.role = 'patient'
    )
  );

CREATE POLICY "Staff can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist'
    )
  );

CREATE POLICY "Staff can update appointments"
  ON appointments FOR UPDATE
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist',
      'optometrist', 'ophthalmologist'
    )
  );

-- Encounters table policies
CREATE POLICY "Medical staff can view encounters"
  ON encounters FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin',
      'optometrist', 'ophthalmologist', 'technician'
    )
  );

CREATE POLICY "Patients can view own encounters"
  ON encounters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      JOIN users ON users.email = patients.email
      WHERE patients.id = encounters.patient_id
      AND users.id = auth.uid()
      AND users.role = 'patient'
    )
  );

CREATE POLICY "Medical staff can create encounters"
  ON encounters FOR INSERT
  WITH CHECK (
    auth.user_role() IN (
      'optometrist', 'ophthalmologist', 'technician'
    )
  );

CREATE POLICY "Medical staff can update own encounters"
  ON encounters FOR UPDATE
  USING (
    provider_id = auth.uid()
    OR auth.user_role() IN ('super_admin', 'hospital_admin')
  );

-- Invoices table policies
CREATE POLICY "Staff can view all invoices"
  ON invoices FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'billing_staff', 'receptionist'
    )
  );

CREATE POLICY "Patients can view own invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      JOIN users ON users.email = patients.email
      WHERE patients.id = invoices.patient_id
      AND users.id = auth.uid()
      AND users.role = 'patient'
    )
  );

CREATE POLICY "Billing staff can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'billing_staff'
    )
  );

CREATE POLICY "Billing staff can update invoices"
  ON invoices FOR UPDATE
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'billing_staff'
    )
  );

-- Invoice items policies
CREATE POLICY "Staff can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'billing_staff', 'receptionist'
    )
  );

CREATE POLICY "Billing staff can manage invoice items"
  ON invoice_items FOR ALL
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'billing_staff'
    )
  );

-- Inventory policies
CREATE POLICY "Staff can view inventory"
  ON inventory FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist',
      'optometrist', 'ophthalmologist', 'billing_staff'
    )
  );

CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  USING (
    auth.user_role() IN ('super_admin', 'hospital_admin')
  );

-- Optical orders policies
CREATE POLICY "Staff can view optical orders"
  ON optical_orders FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist',
      'optometrist', 'ophthalmologist'
    )
  );

CREATE POLICY "Staff can manage optical orders"
  ON optical_orders FOR ALL
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin', 'receptionist',
      'optometrist', 'ophthalmologist'
    )
  );

-- Surgery policies
CREATE POLICY "Medical staff can view surgeries"
  ON surgeries FOR SELECT
  USING (
    auth.user_role() IN (
      'super_admin', 'hospital_admin',
      'ophthalmologist', 'technician'
    )
  );

CREATE POLICY "Surgeons can manage surgeries"
  ON surgeries FOR ALL
  USING (
    auth.user_role() IN ('super_admin', 'hospital_admin', 'ophthalmologist')
  );

-- Audit logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.user_role() IN ('super_admin', 'hospital_admin')
  );

