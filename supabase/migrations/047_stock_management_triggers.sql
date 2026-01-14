-- Stock Management Triggers and Functions
-- Automatically update stock quantities when stock movements are created
-- Provides validation and audit trail for all stock changes

-- Function to update stock quantity based on movement type
CREATE OR REPLACE FUNCTION update_stock_from_movement()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
  item_table_name TEXT;
BEGIN
  -- Determine which table to update based on item_type
  IF NEW.item_type = 'pharmacy' THEN
    item_table_name := 'pharmacy_items';
  ELSIF NEW.item_type = 'optical' THEN
    item_table_name := 'optical_items';
  ELSE
    -- Not an inventory item, skip
    RETURN NEW;
  END IF;

  -- Get current stock
  EXECUTE format('SELECT stock_quantity FROM %I WHERE id = $1', item_table_name)
    INTO current_stock
    USING NEW.item_id;

  -- If item doesn't exist, raise error
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Item with id % does not exist in %', NEW.item_id, item_table_name;
  END IF;

  -- Calculate new stock based on movement type
  IF NEW.movement_type = 'sale' THEN
    -- Sale reduces stock
    new_stock := current_stock - NEW.quantity;
    IF new_stock < 0 THEN
      RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', current_stock, NEW.quantity;
    END IF;
  ELSIF NEW.movement_type = 'purchase' THEN
    -- Purchase increases stock
    new_stock := current_stock + NEW.quantity;
  ELSIF NEW.movement_type = 'return' THEN
    -- Return increases stock
    new_stock := current_stock + NEW.quantity;
  ELSIF NEW.movement_type = 'adjustment' THEN
    -- Adjustment can be positive or negative (quantity can be negative)
    new_stock := current_stock + NEW.quantity;
    IF new_stock < 0 THEN
      RAISE EXCEPTION 'Adjustment would result in negative stock. Current: %, Adjustment: %', current_stock, NEW.quantity;
    END IF;
  ELSIF NEW.movement_type IN ('expired', 'damaged') THEN
    -- Expired/damaged reduces stock
    new_stock := current_stock - NEW.quantity;
    IF new_stock < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for removal. Current: %, Requested: %', current_stock, NEW.quantity;
    END IF;
  ELSE
    -- Unknown movement type
    RAISE EXCEPTION 'Unknown movement type: %', NEW.movement_type;
  END IF;

  -- Update the stock quantity
  EXECUTE format('UPDATE %I SET stock_quantity = $1, updated_at = NOW() WHERE id = $2', item_table_name)
    USING new_stock, NEW.item_id;

  -- Update the movement record with stock before/after
  NEW.previous_stock := current_stock;
  NEW.new_stock := new_stock;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reverse stock movement (for deletions/cancellations)
CREATE OR REPLACE FUNCTION reverse_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
  reversed_stock INTEGER;
  item_table_name TEXT;
BEGIN
  -- Determine which table to update
  IF OLD.item_type = 'pharmacy' THEN
    item_table_name := 'pharmacy_items';
  ELSIF OLD.item_type = 'optical' THEN
    item_table_name := 'optical_items';
  ELSE
    -- Not an inventory item, skip
    RETURN OLD;
  END IF;

  -- Get current stock
  EXECUTE format('SELECT stock_quantity FROM %I WHERE id = $1', item_table_name)
    INTO current_stock
    USING OLD.item_id;

  -- If item doesn't exist, skip (might have been deleted)
  IF current_stock IS NULL THEN
    RETURN OLD;
  END IF;

  -- Reverse the movement: opposite of what was done
  IF OLD.movement_type = 'sale' THEN
    -- Sale was a reduction, so reverse is an increase
    reversed_stock := current_stock + OLD.quantity;
  ELSIF OLD.movement_type = 'purchase' THEN
    -- Purchase was an increase, so reverse is a reduction
    reversed_stock := current_stock - OLD.quantity;
    IF reversed_stock < 0 THEN
      RAISE EXCEPTION 'Cannot reverse purchase: would result in negative stock. Current: %, Original purchase: %', current_stock, OLD.quantity;
    END IF;
  ELSIF OLD.movement_type = 'return' THEN
    -- Return was an increase, so reverse is a reduction
    reversed_stock := current_stock - OLD.quantity;
    IF reversed_stock < 0 THEN
      RAISE EXCEPTION 'Cannot reverse return: would result in negative stock. Current: %, Original return: %', current_stock, OLD.quantity;
    END IF;
  ELSIF OLD.movement_type = 'adjustment' THEN
    -- Adjustment reversal: subtract the adjustment amount
    reversed_stock := current_stock - OLD.quantity;
    IF reversed_stock < 0 THEN
      RAISE EXCEPTION 'Cannot reverse adjustment: would result in negative stock. Current: %, Original adjustment: %', current_stock, OLD.quantity;
    END IF;
  ELSIF OLD.movement_type IN ('expired', 'damaged') THEN
    -- Expired/damaged was a reduction, so reverse is an increase
    reversed_stock := current_stock + OLD.quantity;
  ELSE
    -- Unknown movement type, skip
    RETURN OLD;
  END IF;

  -- Update the stock quantity
  EXECUTE format('UPDATE %I SET stock_quantity = $1, updated_at = NOW() WHERE id = $2', item_table_name)
    USING reversed_stock, OLD.item_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to validate stock availability before creating sale movement
CREATE OR REPLACE FUNCTION validate_stock_availability(
  p_item_type TEXT,
  p_item_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
  item_table_name TEXT;
BEGIN
  -- Determine which table to check
  IF p_item_type = 'pharmacy' THEN
    item_table_name := 'pharmacy_items';
  ELSIF p_item_type = 'optical' THEN
    item_table_name := 'optical_items';
  ELSE
    RETURN FALSE;
  END IF;

  -- Get current stock
  EXECUTE format('SELECT stock_quantity FROM %I WHERE id = $1', item_table_name)
    INTO current_stock
    USING p_item_id;

  -- Return true if stock is sufficient
  RETURN (current_stock IS NOT NULL AND current_stock >= p_quantity);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock when movement is created
CREATE TRIGGER on_stock_movement_insert
  BEFORE INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_from_movement();

-- Trigger to reverse stock when movement is deleted
CREATE TRIGGER on_stock_movement_delete
  AFTER DELETE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION reverse_stock_movement();

-- Add comments
COMMENT ON FUNCTION update_stock_from_movement() IS 'Automatically updates stock quantity when a stock movement is created';
COMMENT ON FUNCTION reverse_stock_movement() IS 'Reverses stock changes when a stock movement is deleted';
COMMENT ON FUNCTION validate_stock_availability(TEXT, UUID, INTEGER) IS 'Validates if sufficient stock is available for a sale';














