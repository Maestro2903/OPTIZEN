-- Migration 025: Add IOP and Syringing dropdown data to master_data

-- Add IOP Normal Range values (mmHg)
INSERT INTO master_data (category, name, description, is_active, sort_order)
VALUES 
  ('iop_ranges', '10-21 mmHg (Normal)', 'Normal intraocular pressure range', true, 1),
  ('iop_ranges', '22-25 mmHg (Borderline)', 'Borderline elevated IOP', true, 2),
  ('iop_ranges', '26-30 mmHg (Mild elevation)', 'Mildly elevated IOP', true, 3),
  ('iop_ranges', '31-40 mmHg (Moderate elevation)', 'Moderately elevated IOP', true, 4),
  ('iop_ranges', '>40 mmHg (Severe elevation)', 'Severely elevated IOP', true, 5),
  ('iop_ranges', '<10 mmHg (Low)', 'Low intraocular pressure', true, 6)
ON CONFLICT (category, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Add IOP Measurement Methods
INSERT INTO master_data (category, name, description, is_active, sort_order)
VALUES 
  ('iop_methods', 'Goldmann Applanation Tonometry (GAT)', 'Gold standard for IOP measurement', true, 1),
  ('iop_methods', 'Non-Contact Tonometry (NCT/Air Puff)', 'Non-contact air puff tonometry', true, 2),
  ('iop_methods', 'Schiotz Tonometry', 'Indentation tonometry method', true, 3),
  ('iop_methods', 'Rebound Tonometry (iCare)', 'Portable rebound tonometry', true, 4),
  ('iop_methods', 'Perkins Applanation Tonometry', 'Handheld applanation tonometer', true, 5),
  ('iop_methods', 'Tono-Pen', 'Electronic handheld tonometer', true, 6),
  ('iop_methods', 'Pneumotonometry', 'Pneumatic tonometry method', true, 7),
  ('iop_methods', 'Dynamic Contour Tonometry (DCT)', 'Digital contour tonometry', true, 8)
ON CONFLICT (category, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Add Syringing (Lacrimal Sac Syringing) Results
INSERT INTO master_data (category, name, description, is_active, sort_order)
VALUES 
  ('sac_status', 'Patent', 'Lacrimal drainage system is patent/open', true, 1),
  ('sac_status', 'Partially Patent', 'Partial obstruction in lacrimal drainage', true, 2),
  ('sac_status', 'Blocked at Punctum', 'Obstruction at the punctum level', true, 3),
  ('sac_status', 'Blocked at Canaliculus', 'Obstruction in the canaliculus', true, 4),
  ('sac_status', 'Blocked at Common Canaliculus', 'Obstruction at common canaliculus', true, 5),
  ('sac_status', 'Blocked at NLD (Nasolacrimal Duct)', 'Nasolacrimal duct obstruction', true, 6),
  ('sac_status', 'Regurgitation from Upper Punctum', 'Reflux through upper punctum', true, 7),
  ('sac_status', 'Regurgitation from Lower Punctum', 'Reflux through lower punctum', true, 8),
  ('sac_status', 'Regurgitation with Mucous', 'Mucopurulent regurgitation', true, 9),
  ('sac_status', 'Regurgitation with Pus', 'Purulent regurgitation', true, 10),
  ('sac_status', 'Not Done', 'Syringing test not performed', true, 11)
ON CONFLICT (category, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Add additional diagnostic test types if not present
INSERT INTO master_data (category, name, description, is_active, sort_order)
VALUES 
  ('diagnostic_tests', 'IOP Measurement', 'Intraocular pressure measurement', true, 1),
  ('diagnostic_tests', 'Sac Syringing', 'Lacrimal sac syringing test', true, 2),
  ('diagnostic_tests', 'Schirmer Test', 'Test for dry eye', true, 3),
  ('diagnostic_tests', 'TBUT (Tear Break-Up Time)', 'Tear film stability test', true, 4),
  ('diagnostic_tests', 'Gonioscopy', 'Angle structure examination', true, 5),
  ('diagnostic_tests', 'Perimetry/Visual Field', 'Visual field testing', true, 6),
  ('diagnostic_tests', 'OCT (Optical Coherence Tomography)', 'Retinal imaging', true, 7),
  ('diagnostic_tests', 'Fundus Photography', 'Retinal photography', true, 8),
  ('diagnostic_tests', 'A-Scan Biometry', 'Axial length measurement', true, 9),
  ('diagnostic_tests', 'B-Scan Ultrasonography', 'Ocular ultrasound', true, 10),
  ('diagnostic_tests', 'Pachymetry', 'Corneal thickness measurement', true, 11),
  ('diagnostic_tests', 'Keratometry', 'Corneal curvature measurement', true, 12),
  ('diagnostic_tests', 'Corneal Topography', 'Corneal surface mapping', true, 13),
  ('diagnostic_tests', 'Specular Microscopy', 'Corneal endothelial cell count', true, 14),
  ('diagnostic_tests', 'Color Vision Testing', 'Color perception test', true, 15),
  ('diagnostic_tests', 'Contrast Sensitivity', 'Contrast perception test', true, 16),
  ('diagnostic_tests', 'Stereopsis Test', 'Depth perception test', true, 17),
  ('diagnostic_tests', 'Fluorescein Angiography', 'Retinal vessel imaging', true, 18),
  ('diagnostic_tests', 'Electroretinography (ERG)', 'Retinal function test', true, 19),
  ('diagnostic_tests', 'Visual Evoked Potential (VEP)', 'Visual pathway function test', true, 20)
ON CONFLICT (category, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;
