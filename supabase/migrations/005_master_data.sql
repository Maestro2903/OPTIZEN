-- Create master data table for centralized data management
CREATE TABLE master_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  category TEXT NOT NULL, -- e.g., 'complaints', 'medicines', 'treatments', etc.
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- For additional category-specific data
  created_by UUID REFERENCES auth.users(id),

  -- Ensure unique names within each category
  UNIQUE(category, name)
);

-- Create index for performance
CREATE INDEX idx_master_data_category ON master_data(category);
CREATE INDEX idx_master_data_active ON master_data(is_active);
CREATE INDEX idx_master_data_sort_order ON master_data(sort_order);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_master_data_updated_at ON master_data;
CREATE TRIGGER update_master_data_updated_at
  BEFORE UPDATE ON master_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default master data categories (idempotent)
INSERT INTO master_data (category, name, description, sort_order) VALUES
-- Complaints
('complaints', 'Eye Pain', 'Pain or discomfort in the eye', 1),
('complaints', 'Blurred Vision', 'Reduced clarity of vision', 2),
('complaints', 'Double Vision', 'Seeing two images of a single object', 3),
('complaints', 'Dry Eyes', 'Insufficient tear production or poor tear quality', 4),
('complaints', 'Red Eyes', 'Redness or irritation in the eyes', 5),
('complaints', 'Floaters', 'Small moving spots in vision', 6),
('complaints', 'Light Sensitivity', 'Discomfort in bright light', 7),
('complaints', 'Night Blindness', 'Difficulty seeing in low light', 8),
('complaints', 'Headache', 'Head pain associated with vision problems', 9),
('complaints', 'Tearing', 'Excessive tear production', 10),

-- Medicines
('medicines', 'Tropicamide 0.8%', 'Mydriatic eye drops', 1),
('medicines', 'Atropine 1%', 'Long-acting mydriatic', 2),
('medicines', 'Timolol 0.5%', 'Beta-blocker for glaucoma', 3),
('medicines', 'Latanoprost 0.005%', 'Prostaglandin analog', 4),
('medicines', 'Prednisolone 1%', 'Anti-inflammatory steroid', 5),
('medicines', 'Ciprofloxacin 0.3%', 'Antibiotic eye drops', 6),
('medicines', 'Artificial Tears', 'Lubricating eye drops', 7),
('medicines', 'Brimonidine 0.2%', 'Alpha-2 agonist for glaucoma', 8),
('medicines', 'Dexamethasone 0.1%', 'Anti-inflammatory steroid', 9),
('medicines', 'Chloramphenicol 0.5%', 'Antibiotic eye ointment', 10),

-- Treatments
('treatments', 'Refraction', 'Vision assessment and correction', 1),
('treatments', 'Fundus Examination', 'Examination of the retina', 2),
('treatments', 'IOP Measurement', 'Intraocular pressure check', 3),
('treatments', 'Slit Lamp Examination', 'Microscopic eye examination', 4),
('treatments', 'Visual Field Test', 'Peripheral vision assessment', 5),
('treatments', 'OCT Scan', 'Optical coherence tomography', 6),
('treatments', 'Fluorescein Angiography', 'Retinal blood vessel imaging', 7),
('treatments', 'YAG Capsulotomy', 'Laser treatment for posterior capsule', 8),
('treatments', 'Laser Photocoagulation', 'Retinal laser treatment', 9),
('treatments', 'Intravitreal Injection', 'Injection into the eye', 10),

-- Surgeries
('surgeries', 'Cataract Surgery', 'Surgical removal of cloudy lens', 1),
('surgeries', 'Glaucoma Surgery', 'Surgery to reduce eye pressure', 2),
('surgeries', 'Retinal Surgery', 'Surgery on the retina', 3),
('surgeries', 'Pterygium Excision', 'Removal of pterygium growth', 4),
('surgeries', 'Chalazion Removal', 'Surgical removal of chalazion', 5),
('surgeries', 'Stye Removal', 'Drainage of infected eyelid gland', 6),
('surgeries', 'Corneal Transplant', 'Replacement of damaged cornea', 7),
('surgeries', 'Vitrectomy', 'Removal of vitreous gel', 8),
('surgeries', 'Dacryocystorhinostomy', 'Tear duct surgery', 9),
('surgeries', 'Enucleation', 'Surgical removal of eye', 10),

-- Diagnostic Tests
('tests', 'Visual Acuity Test', 'Standard vision test', 1),
('tests', 'Refraction Test', 'Determining lens prescription', 2),
('tests', 'Tonometry', 'Eye pressure measurement', 3),
('tests', 'Ophthalmoscopy', 'Examination of eye interior', 4),
('tests', 'Perimetry', 'Visual field testing', 5),
('tests', 'OCT', 'Optical coherence tomography', 6),
('tests', 'Fluorescein Angiography', 'Retinal imaging with dye', 7),
('tests', 'Pachymetry', 'Corneal thickness measurement', 8),
('tests', 'Gonioscopy', 'Drainage angle examination', 9),
('tests', 'Electroretinography', 'Retinal function test', 10),

-- Eye Conditions
('conditions', 'Myopia', 'Nearsightedness', 1),
('conditions', 'Hyperopia', 'Farsightedness', 2),
('conditions', 'Astigmatism', 'Irregular corneal curvature', 3),
('conditions', 'Presbyopia', 'Age-related reading difficulty', 4),
('conditions', 'Cataract', 'Clouding of the lens', 5),
('conditions', 'Glaucoma', 'Optic nerve damage from pressure', 6),
('conditions', 'Diabetic Retinopathy', 'Diabetes-related retinal damage', 7),
('conditions', 'Macular Degeneration', 'Central vision loss', 8),
('conditions', 'Retinal Detachment', 'Separation of retinal layers', 9),
('conditions', 'Dry Eye Syndrome', 'Insufficient tear production', 10),

-- Visual Acuity Options
('visual_acuity', '6/4', 'Better than normal vision', 1),
('visual_acuity', '6/5', 'Excellent vision', 2),
('visual_acuity', '6/6', 'Normal vision', 3),
('visual_acuity', '6/9', 'Mild vision loss', 4),
('visual_acuity', '6/12', 'Moderate vision loss', 5),
('visual_acuity', '6/18', 'Significant vision loss', 6),
('visual_acuity', '6/24', 'Severe vision loss', 7),
('visual_acuity', '6/36', 'Very poor vision', 8),
('visual_acuity', '6/60', 'Legal blindness threshold', 9),
('visual_acuity', 'CF', 'Counting fingers', 10),

-- Dosages
('dosages', '1 DROP BD', 'One drop twice daily', 1),
('dosages', '1 DROP TDS', 'One drop three times daily', 2),
('dosages', '1 DROP QDS', 'One drop four times daily', 3),
('dosages', '2 DROPS BD', 'Two drops twice daily', 4),
('dosages', '1 DROP OD', 'One drop once daily', 5),
('dosages', '1 DROP HS', 'One drop at bedtime', 6),
('dosages', '1 TABLET BD', 'One tablet twice daily', 7),
('dosages', '1 TABLET OD', 'One tablet once daily', 8),
('dosages', '1 CAPSULE BD', 'One capsule twice daily', 9),
('dosages', 'AS REQUIRED', 'As needed', 10),

-- Payment Methods
('payment_methods', 'Cash', 'Cash payment', 1),
('payment_methods', 'Credit Card', 'Credit card payment', 2),
('payment_methods', 'Debit Card', 'Debit card payment', 3),
('payment_methods', 'UPI', 'Unified Payments Interface', 4),
('payment_methods', 'Bank Transfer', 'Direct bank transfer', 5),
('payment_methods', 'Cheque', 'Cheque payment', 6),
('payment_methods', 'Insurance', 'Insurance coverage', 7),
('payment_methods', 'EMI', 'Equated Monthly Installments', 8),

-- Insurance Providers
('insurance_providers', 'HDFC ERGO', 'HDFC ERGO Health Insurance', 1),
('insurance_providers', 'ICICI Lombard', 'ICICI Lombard Health Insurance', 2),
('insurance_providers', 'Bajaj Allianz', 'Bajaj Allianz Health Insurance', 3),
('insurance_providers', 'Star Health', 'Star Health Insurance', 4),
('insurance_providers', 'Max Bupa', 'Max Bupa Health Insurance', 5),
('insurance_providers', 'Apollo Munich', 'Apollo Munich Health Insurance', 6),
('insurance_providers', 'Religare', 'Religare Health Insurance', 7),
('insurance_providers', 'Tata AIG', 'Tata AIG Health Insurance', 8)
ON CONFLICT (category, name) DO NOTHING;