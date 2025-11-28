-- Add inventory item references to invoice_items table
-- This allows linking invoice items to pharmacy_items or optical_items for automatic stock management

-- Add new columns to invoice_items
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS item_type TEXT CHECK (item_type IN ('pharmacy', 'optical', 'service')),
  ADD COLUMN IF NOT EXISTS item_id UUID,
  ADD COLUMN IF NOT EXISTS item_sku TEXT;

-- Add comments for documentation
COMMENT ON COLUMN invoice_items.item_type IS 'Type of item: pharmacy, optical, or service (null for non-inventory items)';
COMMENT ON COLUMN invoice_items.item_id IS 'Reference to pharmacy_items.id or optical_items.id';
COMMENT ON COLUMN invoice_items.item_sku IS 'SKU of the item for quick reference';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_id ON invoice_items(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_type ON invoice_items(item_type) WHERE item_type IS NOT NULL;

