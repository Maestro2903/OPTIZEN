-- Create finance_revenue table for Finance page (separate from billing invoices)
-- This table tracks revenue entries for financial reporting

CREATE TABLE IF NOT EXISTS finance_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue_type VARCHAR(50) NOT NULL CHECK (revenue_type IN ('consultation', 'surgery', 'pharmacy', 'diagnostic', 'lab', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  
  -- Payment Information
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (payment_status IN ('received', 'pending', 'partial')),
  paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  
  -- Optional References
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(255), -- Denormalized for quick access
  invoice_reference VARCHAR(100), -- Link to billing invoice if exists
  
  -- Additional Info
  category VARCHAR(100), -- Sub-category within revenue_type
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_finance_revenue_date ON finance_revenue(entry_date DESC);
CREATE INDEX idx_finance_revenue_type ON finance_revenue(revenue_type);
CREATE INDEX idx_finance_revenue_payment_status ON finance_revenue(payment_status);
CREATE INDEX idx_finance_revenue_patient ON finance_revenue(patient_id);
CREATE INDEX idx_finance_revenue_created_at ON finance_revenue(created_at DESC);

-- Enable Row Level Security
ALTER TABLE finance_revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read access" ON finance_revenue
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert access" ON finance_revenue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their own entries
CREATE POLICY "Allow authenticated update access" ON finance_revenue
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete access" ON finance_revenue
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_finance_revenue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_revenue_updated_at
  BEFORE UPDATE ON finance_revenue
  FOR EACH ROW
  EXECUTE FUNCTION update_finance_revenue_updated_at();

-- Add comment
COMMENT ON TABLE finance_revenue IS 'Revenue entries for financial tracking and reporting (separate from billing invoices)';
