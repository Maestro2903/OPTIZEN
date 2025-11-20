-- Update finance_revenue revenue_type constraint to align with master data
BEGIN;

ALTER TABLE finance_revenue
DROP CONSTRAINT IF EXISTS finance_revenue_revenue_type_check;

ALTER TABLE finance_revenue
ADD CONSTRAINT finance_revenue_revenue_type_check
CHECK (
  (revenue_type)::text = ANY (
    (
      ARRAY[
        'ambulance_services',
        'consultation',
        'corporate_health_programs',
        'diagnostic',
        'dietary_consultation',
        'emergency_services',
        'government_programs',
        'health_checkup_packages',
        'hearing_aid_services',
        'home_care_services',
        'imaging_services',
        'inpatient_services',
        'insurance_claims',
        'lab',
        'lab_tests',
        'medical_equipment',
        'medical_records',
        'optical_services',
        'other',
        'outpatient_services',
        'pharmacy',
        'rental_income',
        'surgery',
        'telemedicine',
        'therapy_services',
        'training_and_education',
        'vaccination'
      ]
    )::text[]
  )
);

COMMENT ON CONSTRAINT finance_revenue_revenue_type_check ON finance_revenue IS
'Validates revenue_type against normalized values from master_data.revenue_types';

COMMIT;

