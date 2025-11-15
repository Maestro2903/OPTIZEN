-- Change expense category from ENUM to TEXT to support dynamic master_data categories
-- This allows flexibility in expense categories without database schema changes

-- Step 1: Alter the column type from expense_category ENUM to TEXT
ALTER TABLE expenses 
ALTER COLUMN category TYPE TEXT 
USING category::TEXT;

-- Step 2: Drop the old ENUM type (now unused)
DROP TYPE IF EXISTS expense_category CASCADE;

-- Step 3: Add a comment
COMMENT ON COLUMN expenses.category IS 'Expense category - should match normalized values from master_data expense_categories (e.g., "Salaries" -> "salaries")';
