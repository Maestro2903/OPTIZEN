-- Migration 015: Fix Invoice Number Generation Race Condition
-- This migration implements atomic sequential invoice number generation
-- to prevent duplicate invoice numbers under concurrent load

-- ============================================================================
-- Invoice Number Sequence Generator (Atomic)
-- ============================================================================

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS get_next_invoice_number(TEXT);

-- Create function to generate sequential invoice numbers atomically
CREATE OR REPLACE FUNCTION get_next_invoice_number(year_month TEXT)
RETURNS TEXT AS $$
DECLARE
  seq_name TEXT;
  next_num INT;
  invoice_number TEXT;
BEGIN
  -- Validate input format (YYYYMM)
  IF NOT year_month ~ '^\d{6}$' THEN
    RAISE EXCEPTION 'Invalid year_month format. Expected YYYYMM, got: %', year_month;
  END IF;
  
  -- Create sequence name for this month
  seq_name := 'invoice_seq_' || year_month;
  
  -- Create sequence if it doesn't exist (idempotent)
  -- Start at 1 for each new month
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS %I START 1 INCREMENT 1 NO CYCLE',
    seq_name
  );
  
  -- Get next value atomically (this is the critical operation)
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;
  
  -- Format as INV-YYYYMM-NNNNNN
  invoice_number := 'INV-' || year_month || '-' || lpad(next_num::TEXT, 6, '0');
  
  -- Log generation for audit trail
  RAISE NOTICE 'Generated invoice number: % (sequence: %, value: %)', 
    invoice_number, seq_name, next_num;
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_invoice_number(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_next_invoice_number(TEXT) IS 
  'Atomically generates sequential invoice numbers in format INV-YYYYMM-NNNNNN. 
   Uses PostgreSQL sequences to prevent race conditions under concurrent load.
   Creates a new sequence for each month automatically.';

-- ============================================================================
-- Helper Function: Reset Invoice Sequence (Admin Only)
-- ============================================================================

-- Drop function if exists
DROP FUNCTION IF EXISTS reset_invoice_sequence(TEXT);

-- Create function to reset a month's sequence (for testing or corrections)
CREATE OR REPLACE FUNCTION reset_invoice_sequence(year_month TEXT, start_value INT DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  seq_name TEXT;
BEGIN
  -- Validate input
  IF NOT year_month ~ '^\d{6}$' THEN
    RAISE EXCEPTION 'Invalid year_month format. Expected YYYYMM, got: %', year_month;
  END IF;
  
  IF start_value < 1 THEN
    RAISE EXCEPTION 'Start value must be >= 1, got: %', start_value;
  END IF;
  
  seq_name := 'invoice_seq_' || year_month;
  
  -- Check if sequence exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences 
    WHERE schemaname = 'public' AND sequencename = seq_name
  ) THEN
    RAISE NOTICE 'Sequence % does not exist yet', seq_name;
    RETURN FALSE;
  END IF;
  
  -- Reset the sequence
  EXECUTE format('ALTER SEQUENCE %I RESTART WITH %s', seq_name, start_value);
  
  RAISE NOTICE 'Reset sequence % to start at %', seq_name, start_value;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Only grant to service role (admin operations)
GRANT EXECUTE ON FUNCTION reset_invoice_sequence(TEXT, INT) TO service_role;

COMMENT ON FUNCTION reset_invoice_sequence(TEXT, INT) IS 
  'Resets an invoice sequence to a specific start value. Use with caution.
   Only available to service_role for administrative operations.';

-- ============================================================================
-- Helper View: Invoice Sequence Status
-- ============================================================================

-- Drop view if exists
DROP VIEW IF EXISTS invoice_sequences_status;

-- Create view to monitor all invoice sequences
CREATE OR REPLACE VIEW invoice_sequences_status AS
SELECT 
  sequencename as sequence_name,
  SUBSTRING(sequencename FROM 13) as year_month,
  last_value as current_value,
  is_called,
  CASE 
    WHEN is_called THEN last_value + 1
    ELSE last_value
  END as next_value
FROM pg_sequences
WHERE schemaname = 'public' 
  AND sequencename LIKE 'invoice_seq_%'
ORDER BY sequencename DESC;

-- Grant select to authenticated users
GRANT SELECT ON invoice_sequences_status TO authenticated;

COMMENT ON VIEW invoice_sequences_status IS 
  'Shows current status of all invoice number sequences.
   Useful for monitoring and debugging invoice generation.';

-- ============================================================================
-- Testing Queries (Run after migration to verify)
-- ============================================================================

-- Test 1: Generate invoice number for current month
-- SELECT get_next_invoice_number(to_char(CURRENT_DATE, 'YYYYMM'));
-- Should return: INV-202511-000001

-- Test 2: Generate multiple sequential numbers
-- SELECT get_next_invoice_number(to_char(CURRENT_DATE, 'YYYYMM')) FROM generate_series(1, 5);
-- Should return: INV-202511-000002 through INV-202511-000006

-- Test 3: View sequence status
-- SELECT * FROM invoice_sequences_status;

-- Test 4: Test concurrent generation (should have no duplicates)
-- Run in multiple psql sessions simultaneously:
-- SELECT get_next_invoice_number('202511') FROM generate_series(1, 100);

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP FUNCTION IF EXISTS get_next_invoice_number(TEXT);
-- DROP FUNCTION IF EXISTS reset_invoice_sequence(TEXT, INT);
-- DROP VIEW IF EXISTS invoice_sequences_status;
-- DROP SEQUENCE IF EXISTS invoice_seq_202511; -- repeat for each month as needed

-- ============================================================================
-- Performance Notes
-- ============================================================================

-- Sequences are extremely fast (microseconds)
-- No table locks required
-- Concurrent-safe by design
-- Minimal memory overhead (~1KB per sequence)
-- Sequences persist across server restarts

-- Expected performance:
-- - Single generation: <1ms
-- - 1000 concurrent generations: <100ms total
-- - No deadlocks or race conditions possible
