-- Create get_category_counts RPC function
-- This function aggregates master data by category and returns counts

CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE (
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    md.category,
    COUNT(*) as count
  FROM master_data md
  GROUP BY md.category
  ORDER BY md.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION get_category_counts() IS 'Returns count of items per category in master_data table';

