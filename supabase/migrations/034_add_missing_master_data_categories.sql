-- Migration 034: Add missing master data categories
-- Description: Adds seed data for categories that exist in backend but have no database entries

-- ===============================================
-- 1. Add anesthesia_types category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('anesthesia_types', 'General Anesthesia', 'Complete loss of consciousness', true, 1, '{}'),
  ('anesthesia_types', 'Local Anesthesia', 'Anesthesia applied to specific area', true, 2, '{}'),
  ('anesthesia_types', 'Regional Anesthesia', 'Anesthesia of a region of the body', true, 3, '{}'),
  ('anesthesia_types', 'Topical Anesthesia', 'Surface anesthesia (eye drops)', true, 4, '{}'),
  ('anesthesia_types', 'Peribulbar Block', 'Injection around the eye', true, 5, '{}'),
  ('anesthesia_types', 'Retrobulbar Block', 'Injection behind the eye', true, 6, '{}'),
  ('anesthesia_types', 'Sub-Tenon Block', 'Injection under Tenon capsule', true, 7, '{}'),
  ('anesthesia_types', 'No Anesthesia', 'Procedure without anesthesia', true, 8, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 2. Add pharmacy_categories category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('pharmacy_categories', 'Medicines', 'Pharmaceutical medications', true, 1, '{}'),
  ('pharmacy_categories', 'Eye Drops', 'Topical ophthalmic solutions', true, 2, '{}'),
  ('pharmacy_categories', 'Eye Ointments', 'Topical ophthalmic ointments', true, 3, '{}'),
  ('pharmacy_categories', 'Oral Medications', 'Tablets and capsules', true, 4, '{}'),
  ('pharmacy_categories', 'Injections', 'Injectable medications', true, 5, '{}'),
  ('pharmacy_categories', 'Optical Items', 'Eyeglasses, contact lenses, etc.', true, 6, '{}'),
  ('pharmacy_categories', 'Medical Supplies', 'Dressings, gauze, surgical supplies', true, 7, '{}'),
  ('pharmacy_categories', 'Diagnostic Supplies', 'Testing strips, dyes, etc.', true, 8, '{}'),
  ('pharmacy_categories', 'Contact Lens Solutions', 'Cleaning and storage solutions', true, 9, '{}'),
  ('pharmacy_categories', 'Artificial Tears', 'Lubricating eye drops', true, 10, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 3. Add color_vision_types category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('color_vision_types', 'Normal', 'Normal color vision', true, 1, '{}'),
  ('color_vision_types', 'Protanopia', 'Red-green color blindness (red deficiency)', true, 2, '{}'),
  ('color_vision_types', 'Deuteranopia', 'Red-green color blindness (green deficiency)', true, 3, '{}'),
  ('color_vision_types', 'Tritanopia', 'Blue-yellow color blindness', true, 4, '{}'),
  ('color_vision_types', 'Protanomaly', 'Mild red deficiency', true, 5, '{}'),
  ('color_vision_types', 'Deuteranomaly', 'Mild green deficiency', true, 6, '{}'),
  ('color_vision_types', 'Tritanomaly', 'Mild blue deficiency', true, 7, '{}'),
  ('color_vision_types', 'Achromatopsia', 'Complete color blindness', true, 8, '{}'),
  ('color_vision_types', 'Not Tested', 'Color vision not tested', true, 9, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 4. Add driving_fitness_types category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('driving_fitness_types', 'Fit', 'Fit to drive without restrictions', true, 1, '{}'),
  ('driving_fitness_types', 'Unfit', 'Not fit to drive', true, 2, '{}'),
  ('driving_fitness_types', 'Fit with Restrictions', 'Fit to drive with specific restrictions', true, 3, '{}'),
  ('driving_fitness_types', 'Fit for Daytime Only', 'Fit to drive during daylight hours only', true, 4, '{}'),
  ('driving_fitness_types', 'Fit with Corrective Lenses', 'Fit to drive while wearing glasses/contact lenses', true, 5, '{}'),
  ('driving_fitness_types', 'Temporarily Unfit', 'Temporarily not fit to drive', true, 6, '{}'),
  ('driving_fitness_types', 'Review Required', 'Requires further review or examination', true, 7, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 5. Add fundus_findings category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('fundus_findings', 'Normal', 'Normal fundus appearance', true, 1, '{}'),
  ('fundus_findings', 'Clear Media', 'Clear optical media', true, 2, '{}'),
  ('fundus_findings', 'Disc Normal', 'Normal optic disc', true, 3, '{}'),
  ('fundus_findings', 'Cup Normal', 'Normal cup-to-disc ratio', true, 4, '{}'),
  ('fundus_findings', 'Vessels Normal', 'Normal retinal vessels', true, 5, '{}'),
  ('fundus_findings', 'Macula Normal', 'Normal macula', true, 6, '{}'),
  ('fundus_findings', 'Periphery Normal', 'Normal peripheral retina', true, 7, '{}'),
  ('fundus_findings', 'Glaucomatous Cupping', 'Increased cup-to-disc ratio', true, 8, '{}'),
  ('fundus_findings', 'Optic Atrophy', 'Pale optic disc', true, 9, '{}'),
  ('fundus_findings', 'Papilledema', 'Optic disc swelling', true, 10, '{}'),
  ('fundus_findings', 'NPDR (Non-Proliferative Diabetic Retinopathy)', 'Early stage diabetic retinopathy', true, 11, '{}'),
  ('fundus_findings', 'PDR (Proliferative Diabetic Retinopathy)', 'Advanced diabetic retinopathy', true, 12, '{}'),
  ('fundus_findings', 'Diabetic Macular Edema', 'Macular swelling in diabetes', true, 13, '{}'),
  ('fundus_findings', 'BRVO (Branch Retinal Vein Occlusion)', 'Blocked branch retinal vein', true, 14, '{}'),
  ('fundus_findings', 'CRVO (Central Retinal Vein Occlusion)', 'Blocked central retinal vein', true, 15, '{}'),
  ('fundus_findings', 'CRAO (Central Retinal Artery Occlusion)', 'Blocked central retinal artery', true, 16, '{}'),
  ('fundus_findings', 'BRAO (Branch Retinal Artery Occlusion)', 'Blocked branch retinal artery', true, 17, '{}'),
  ('fundus_findings', 'AMD (Age-Related Macular Degeneration)', 'Macular degeneration', true, 18, '{}'),
  ('fundus_findings', 'Dry AMD', 'Non-exudative AMD', true, 19, '{}'),
  ('fundus_findings', 'Wet AMD', 'Exudative AMD with CNVM', true, 20, '{}'),
  ('fundus_findings', 'CNVM (Choroidal Neovascular Membrane)', 'Abnormal blood vessel growth', true, 21, '{}'),
  ('fundus_findings', 'Macular Hole', 'Full-thickness defect in macula', true, 22, '{}'),
  ('fundus_findings', 'Epiretinal Membrane', 'Membrane on retinal surface', true, 23, '{}'),
  ('fundus_findings', 'CSR (Central Serous Retinopathy)', 'Fluid under retina', true, 24, '{}'),
  ('fundus_findings', 'Lattice Degeneration', 'Peripheral retinal thinning', true, 25, '{}'),
  ('fundus_findings', 'Retinal Tear', 'Break in retina', true, 26, '{}'),
  ('fundus_findings', 'Retinal Detachment', 'Separated retina', true, 27, '{}'),
  ('fundus_findings', 'Hypertensive Retinopathy', 'Retinal changes from hypertension', true, 28, '{}'),
  ('fundus_findings', 'Pigmentary Changes', 'Abnormal retinal pigmentation', true, 29, '{}'),
  ('fundus_findings', 'Drusen', 'Yellow deposits in retina', true, 30, '{}'),
  ('fundus_findings', 'Hemorrhages', 'Retinal bleeding', true, 31, '{}'),
  ('fundus_findings', 'Exudates', 'Lipid deposits in retina', true, 32, '{}'),
  ('fundus_findings', 'Cotton Wool Spots', 'Nerve fiber layer infarcts', true, 33, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 6. Add cornea_findings category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('cornea_findings', 'Clear', 'Clear cornea', true, 1, '{}'),
  ('cornea_findings', 'Transparent', 'Transparent cornea', true, 2, '{}'),
  ('cornea_findings', 'Regular Surface', 'Regular corneal surface', true, 3, '{}'),
  ('cornea_findings', 'Normal Thickness', 'Normal corneal thickness', true, 4, '{}'),
  ('cornea_findings', 'Scar', 'Corneal scar', true, 5, '{}'),
  ('cornea_findings', 'Opacity', 'Corneal opacity', true, 6, '{}'),
  ('cornea_findings', 'Edema', 'Corneal swelling', true, 7, '{}'),
  ('cornea_findings', 'Keratitis', 'Corneal inflammation', true, 8, '{}'),
  ('cornea_findings', 'Ulcer', 'Corneal ulcer', true, 9, '{}'),
  ('cornea_findings', 'Infiltrate', 'Corneal infiltrate', true, 10, '{}'),
  ('cornea_findings', 'Abrasion', 'Corneal abrasion', true, 11, '{}'),
  ('cornea_findings', 'Foreign Body', 'Foreign body on cornea', true, 12, '{}'),
  ('cornea_findings', 'Keratoconus', 'Conical cornea', true, 13, '{}'),
  ('cornea_findings', 'Corneal Dystrophy', 'Corneal dystrophy', true, 14, '{}'),
  ('cornea_findings', 'Arcus Senilis', 'Lipid deposit ring', true, 15, '{}'),
  ('cornea_findings', 'Band Keratopathy', 'Calcium deposition', true, 16, '{}'),
  ('cornea_findings', 'Pterygium', 'Conjunctival growth on cornea', true, 17, '{}'),
  ('cornea_findings', 'Staining Positive', 'Fluorescein staining positive', true, 18, '{}'),
  ('cornea_findings', 'Vascularization', 'Blood vessels in cornea', true, 19, '{}'),
  ('cornea_findings', 'Guttata', 'Endothelial guttae', true, 20, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 7. Add conjunctiva_findings category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('conjunctiva_findings', 'Quiet', 'Normal conjunctiva', true, 1, '{}'),
  ('conjunctiva_findings', 'Normal', 'Normal appearance', true, 2, '{}'),
  ('conjunctiva_findings', 'Congested', 'Conjunctival congestion', true, 3, '{}'),
  ('conjunctiva_findings', 'Hyperemic', 'Increased blood flow', true, 4, '{}'),
  ('conjunctiva_findings', 'Chemosis', 'Conjunctival edema', true, 5, '{}'),
  ('conjunctiva_findings', 'Discharge', 'Conjunctival discharge', true, 6, '{}'),
  ('conjunctiva_findings', 'Follicles', 'Follicular reaction', true, 7, '{}'),
  ('conjunctiva_findings', 'Papillae', 'Papillary reaction', true, 8, '{}'),
  ('conjunctiva_findings', 'Hemorrhage', 'Subconjunctival hemorrhage', true, 9, '{}'),
  ('conjunctiva_findings', 'Pterygium', 'Conjunctival growth', true, 10, '{}'),
  ('conjunctiva_findings', 'Pinguecula', 'Yellowish conjunctival elevation', true, 11, '{}'),
  ('conjunctiva_findings', 'Foreign Body', 'Foreign body in conjunctiva', true, 12, '{}'),
  ('conjunctiva_findings', 'Concretion', 'Conjunctival concretion', true, 13, '{}'),
  ('conjunctiva_findings', 'Nevus', 'Conjunctival nevus', true, 14, '{}'),
  ('conjunctiva_findings', 'Cyst', 'Conjunctival cyst', true, 15, '{}'),
  ('conjunctiva_findings', 'Scarring', 'Conjunctival scarring', true, 16, '{}'),
  ('conjunctiva_findings', 'Symblepharon', 'Adhesion between lids and globe', true, 17, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 8. Add iris_findings category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('iris_findings', 'Normal', 'Normal iris', true, 1, '{}'),
  ('iris_findings', 'Regular', 'Regular iris pattern', true, 2, '{}'),
  ('iris_findings', 'Round Pupil', 'Round pupil shape', true, 3, '{}'),
  ('iris_findings', 'RAPD Negative', 'No relative afferent pupillary defect', true, 4, '{}'),
  ('iris_findings', 'Atrophic', 'Atrophic iris', true, 5, '{}'),
  ('iris_findings', 'Irregular Pupil', 'Irregular pupil shape', true, 6, '{}'),
  ('iris_findings', 'Fixed Pupil', 'Non-reactive pupil', true, 7, '{}'),
  ('iris_findings', 'Dilated Pupil', 'Mydriasis', true, 8, '{}'),
  ('iris_findings', 'Constricted Pupil', 'Miosis', true, 9, '{}'),
  ('iris_findings', 'RAPD Positive', 'Relative afferent pupillary defect present', true, 10, '{}'),
  ('iris_findings', 'Synechiae', 'Iris adhesions', true, 11, '{}'),
  ('iris_findings', 'Posterior Synechiae', 'Iris adhered to lens', true, 12, '{}'),
  ('iris_findings', 'Anterior Synechiae', 'Iris adhered to cornea', true, 13, '{}'),
  ('iris_findings', 'Rubeosis Iridis', 'Neovascularization of iris', true, 14, '{}'),
  ('iris_findings', 'Iris Bombe', 'Forward bowing of iris', true, 15, '{}'),
  ('iris_findings', 'Coloboma', 'Iris defect', true, 16, '{}'),
  ('iris_findings', 'Aniridia', 'Absent iris', true, 17, '{}'),
  ('iris_findings', 'Heterochromia', 'Different colored irises', true, 18, '{}'),
  ('iris_findings', 'Iris Nevus', 'Pigmented lesion', true, 19, '{}'),
  ('iris_findings', 'Iridodialysis', 'Separation of iris root', true, 20, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 9. Add anterior_segment_findings category
-- ===============================================
INSERT INTO master_data (category, name, description, is_active, sort_order, metadata) VALUES
  ('anterior_segment_findings', 'Normal', 'Normal anterior segment', true, 1, '{}'),
  ('anterior_segment_findings', 'AC Deep', 'Deep anterior chamber', true, 2, '{}'),
  ('anterior_segment_findings', 'AC Normal Depth', 'Normal anterior chamber depth', true, 3, '{}'),
  ('anterior_segment_findings', 'AC Shallow', 'Shallow anterior chamber', true, 4, '{}'),
  ('anterior_segment_findings', 'AC Quiet', 'No anterior chamber cells or flare', true, 5, '{}'),
  ('anterior_segment_findings', 'AC Cells Present', 'Cells in anterior chamber', true, 6, '{}'),
  ('anterior_segment_findings', 'AC Flare Present', 'Protein in anterior chamber', true, 7, '{}'),
  ('anterior_segment_findings', 'Hypopyon', 'Pus in anterior chamber', true, 8, '{}'),
  ('anterior_segment_findings', 'Hyphema', 'Blood in anterior chamber', true, 9, '{}'),
  ('anterior_segment_findings', 'Angle Open', 'Open anterior chamber angle', true, 10, '{}'),
  ('anterior_segment_findings', 'Angle Narrow', 'Narrow anterior chamber angle', true, 11, '{}'),
  ('anterior_segment_findings', 'Angle Closed', 'Closed anterior chamber angle', true, 12, '{}'),
  ('anterior_segment_findings', 'Van Herick Grade I', 'Very narrow angle', true, 13, '{}'),
  ('anterior_segment_findings', 'Van Herick Grade II', 'Moderately narrow angle', true, 14, '{}'),
  ('anterior_segment_findings', 'Van Herick Grade III', 'Open angle', true, 15, '{}'),
  ('anterior_segment_findings', 'Van Herick Grade IV', 'Wide open angle', true, 16, '{}'),
  ('anterior_segment_findings', 'KPs (Keratic Precipitates)', 'Deposits on corneal endothelium', true, 17, '{}'),
  ('anterior_segment_findings', 'Mutton Fat KPs', 'Large greasy KPs', true, 18, '{}'),
  ('anterior_segment_findings', 'PXF (Pseudoexfoliation)', 'Pseudoexfoliation material', true, 19, '{}'),
  ('anterior_segment_findings', 'Pigment Dispersion', 'Pigment in anterior chamber', true, 20, '{}')
ON CONFLICT (category, name) DO NOTHING;

-- ===============================================
-- 10. Verification Query
-- ===============================================
-- Show counts of newly added categories
SELECT 
  category,
  COUNT(*) as item_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM master_data
WHERE category IN (
  'anesthesia_types',
  'pharmacy_categories',
  'color_vision_types',
  'driving_fitness_types',
  'fundus_findings',
  'cornea_findings',
  'conjunctiva_findings',
  'iris_findings',
  'anterior_segment_findings'
)
GROUP BY category
ORDER BY category;

