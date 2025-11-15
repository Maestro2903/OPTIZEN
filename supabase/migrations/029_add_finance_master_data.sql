-- Migration: Add finance-related master data categories
-- Description: Adds revenue_types and payment_statuses to master data for finance dropdowns

-- ===============================================
-- 1. Add revenue_types category (comprehensive hospital revenue types)
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order) VALUES
  -- Core Services
  ('revenue_types', 'Consultation', 'Revenue from patient consultations', true, 1),
  ('revenue_types', 'Surgery', 'Revenue from surgical procedures', true, 2),
  ('revenue_types', 'Pharmacy', 'Revenue from pharmacy sales', true, 3),
  ('revenue_types', 'Diagnostic', 'Revenue from diagnostic procedures', true, 4),
  ('revenue_types', 'Lab Tests', 'Revenue from laboratory tests', true, 5),
  
  -- Facility Services
  ('revenue_types', 'Emergency Services', 'Revenue from emergency department services', true, 6),
  ('revenue_types', 'Inpatient Services', 'Revenue from hospital admissions and stays', true, 7),
  ('revenue_types', 'Outpatient Services', 'Revenue from outpatient department services', true, 8),
  ('revenue_types', 'Imaging Services', 'Revenue from X-ray, CT, MRI, ultrasound services', true, 9),
  ('revenue_types', 'Therapy Services', 'Revenue from physical therapy, occupational therapy', true, 10),
  
  -- Specialized Services
  ('revenue_types', 'Medical Equipment', 'Revenue from medical equipment sales or rentals', true, 11),
  ('revenue_types', 'Ambulance Services', 'Revenue from ambulance and transport services', true, 12),
  ('revenue_types', 'Health Checkup Packages', 'Revenue from comprehensive health screening packages', true, 13),
  ('revenue_types', 'Vaccination', 'Revenue from vaccination services', true, 14),
  ('revenue_types', 'Home Care Services', 'Revenue from home healthcare services', true, 15),
  ('revenue_types', 'Telemedicine', 'Revenue from telemedicine consultations', true, 16),
  ('revenue_types', 'Optical Services', 'Revenue from eyeglasses, contact lenses sales', true, 17),
  ('revenue_types', 'Hearing Aid Services', 'Revenue from hearing aid services', true, 18),
  
  -- Support Services
  ('revenue_types', 'Dietary Consultation', 'Revenue from nutrition and diet consultation', true, 19),
  ('revenue_types', 'Medical Records', 'Revenue from medical records and documentation fees', true, 20),
  ('revenue_types', 'Insurance Claims', 'Revenue from insurance reimbursements', true, 21),
  ('revenue_types', 'Government Programs', 'Revenue from government healthcare programs', true, 22),
  ('revenue_types', 'Corporate Health Programs', 'Revenue from corporate wellness programs', true, 23),
  ('revenue_types', 'Rental Income', 'Revenue from facility or equipment rentals', true, 24),
  ('revenue_types', 'Training and Education', 'Revenue from medical training and education services', true, 25),
  ('revenue_types', 'Other', 'Other revenue sources', true, 26)
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 2. Add payment_statuses category  
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order) VALUES
  ('payment_statuses', 'Received', 'Payment fully received', true, 1),
  ('payment_statuses', 'Pending', 'Payment pending', true, 2),
  ('payment_statuses', 'Partial', 'Partial payment received', true, 3)
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 3. Verify payment_methods already exist
--    (Just add more if needed)
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order) VALUES
  ('payment_methods', 'Cash', 'Cash payment', true, 1),
  ('payment_methods', 'Card', 'Credit/Debit card payment', true, 2),
  ('payment_methods', 'UPI', 'UPI payment', true, 3),
  ('payment_methods', 'Bank Transfer', 'Bank transfer payment', true, 4),
  ('payment_methods', 'Cheque', 'Cheque payment', true, 5),
  ('payment_methods', 'Other', 'Other payment methods', true, 6)
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 4. Add expense categories (for future use)
-- ===============================================
-- Verify expense_categories exist and are complete
INSERT INTO master_data (category, name, description, is_active, sort_order) VALUES
  ('expense_categories', 'Salary', 'Employee salaries and wages', true, 1),
  ('expense_categories', 'Utilities', 'Electricity, water, gas bills', true, 2),
  ('expense_categories', 'Supplies', 'Medical and office supplies', true, 3),
  ('expense_categories', 'Maintenance', 'Equipment and facility maintenance', true, 4),
  ('expense_categories', 'Rent', 'Property rent', true, 5),
  ('expense_categories', 'Marketing', 'Marketing and advertising expenses', true, 6),
  ('expense_categories', 'Equipment', 'Equipment purchase', true, 7),
  ('expense_categories', 'Other', 'Other expenses', true, 8)
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 5. Verify the data was inserted
-- ===============================================
-- Show counts of new categories
SELECT 
  category,
  COUNT(*) as item_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM master_data
WHERE category IN ('revenue_types', 'payment_statuses', 'payment_methods', 'expense_categories')
GROUP BY category
ORDER BY category;
