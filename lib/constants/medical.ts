// Common ophthalmic diagnoses (ICD-10 codes)
export const COMMON_DIAGNOSES = [
  { code: 'H52.13', description: 'Myopia, bilateral' },
  { code: 'H52.03', description: 'Hypermetropia, bilateral' },
  { code: 'H52.213', description: 'Regular astigmatism, bilateral' },
  { code: 'H52.4', description: 'Presbyopia' },
  { code: 'H25.11', description: 'Age-related nuclear cataract, right eye' },
  { code: 'H25.12', description: 'Age-related nuclear cataract, left eye' },
  { code: 'H25.13', description: 'Age-related nuclear cataract, bilateral' },
  { code: 'H40.11', description: 'Primary open-angle glaucoma' },
  { code: 'H35.31', description: 'Nonexudative age-related macular degeneration' },
  { code: 'H10.13', description: 'Acute atopic conjunctivitis, bilateral' },
  { code: 'H16.001', description: 'Unspecified corneal ulcer, right eye' },
  { code: 'E11.311', description: 'Type 2 diabetes with diabetic retinopathy' },
]

// Visual acuity values (Snellen)
export const VA_VALUES = [
  '6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60',
  '20/20', '20/30', '20/40', '20/60', '20/80', '20/100', '20/200',
  'CF', 'HM', 'LP', 'NLP', 'PL', 'NPL'
]

// Refraction sphere range
export const SPHERE_RANGE = Array.from(
  { length: 61 },
  (_, i) => ((i - 30) * 0.25).toFixed(2)
)

// Refraction cylinder range
export const CYLINDER_RANGE = Array.from(
  { length: 25 },
  (_, i) => (i * -0.25).toFixed(2)
)

// Axis values (0-180)
export const AXIS_VALUES = Array.from({ length: 181 }, (_, i) => i)

// IOL power range
export const IOL_POWER_RANGE = Array.from(
  { length: 61 },
  (_, i) => (i + 10).toFixed(1)
)

// Laterality options
export const LATERALITY = {
  OD: 'Right Eye (OD)',
  OS: 'Left Eye (OS)',
  OU: 'Both Eyes (OU)',
} as const

// Appointment types
export const APPOINTMENT_TYPES = [
  'Consult',
  'Follow-up',
  'Surgery',
  'Refraction',
  'Emergency',
  'Other',
] as const

// Surgery procedures
export const SURGERY_PROCEDURES = [
  'Phacoemulsification with IOL',
  'Manual SICS',
  'LASIK',
  'PRK',
  'Pterygium Excision',
  'Trabeculectomy',
  'Vitrectomy',
  'Retinal Detachment Repair',
  'Strabismus Surgery',
  'Oculoplasty',
] as const

// Anesthesia types
export const ANESTHESIA_TYPES = [
  'Topical',
  'Local',
  'Regional',
  'General',
] as const

// Common medications
export const COMMON_MEDICATIONS = [
  { name: 'Timolol 0.5%', category: 'Anti-glaucoma' },
  { name: 'Latanoprost', category: 'Anti-glaucoma' },
  { name: 'Prednisolone Acetate 1%', category: 'Steroid' },
  { name: 'Moxifloxacin 0.5%', category: 'Antibiotic' },
  { name: 'Tobramycin + Dexamethasone', category: 'Combination' },
  { name: 'Cyclopentolate 1%', category: 'Mydriatic' },
  { name: 'Tropicamide 1%', category: 'Mydriatic' },
  { name: 'Artificial Tears', category: 'Lubricant' },
]

// Payment methods
export const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'UPI',
  'Net Banking',
  'Insurance',
  'Corporate',
] as const

// Invoice status
export const INVOICE_STATUS = [
  'Draft',
  'Sent',
  'Paid',
  'Overdue',
  'Cancelled',
] as const

