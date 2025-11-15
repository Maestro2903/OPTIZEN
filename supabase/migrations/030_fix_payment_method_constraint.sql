-- Fix payment_method constraint to match master_data values
-- The constraint needs to accept the actual payment method values from master_data table

-- Drop the existing constraint
ALTER TABLE finance_revenue 
DROP CONSTRAINT IF EXISTS finance_revenue_payment_method_check;

-- Add new constraint with all payment methods from master_data
-- Converting master_data names to lowercase with underscores (Cash -> cash, Debit Card -> debit_card)
ALTER TABLE finance_revenue 
ADD CONSTRAINT finance_revenue_payment_method_check 
CHECK (payment_method IN (
  'cash',
  'credit_card',
  'debit_card',
  'upi',
  'bank_transfer',
  'cheque',
  'insurance',
  'emi',
  'other'
));

-- Add comment
COMMENT ON CONSTRAINT finance_revenue_payment_method_check ON finance_revenue IS 
'Validates payment method against values derived from master_data payment_methods';
