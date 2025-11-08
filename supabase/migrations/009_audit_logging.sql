-- Comprehensive Audit Logging System for Healthcare Compliance
-- This migration creates audit tables for tracking all system activities

-- Create audit_logs table for tracking all database changes and user actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout', etc.
    table_name TEXT NOT NULL, -- The table that was affected
    record_id TEXT, -- ID of the affected record
    old_values JSONB, -- Previous values (for updates/deletes)
    new_values JSONB, -- New values (for creates/updates)
    metadata JSONB DEFAULT '{}', -- Additional context (IP address, user agent, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    session_id TEXT, -- For tracking user sessions
    ip_address INET, -- Client IP address
    user_agent TEXT -- Browser/client information
);

-- Create financial_audit_logs for specific financial transaction tracking
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL, -- 'revenue_created', 'invoice_paid', 'discount_applied', etc.
    amount DECIMAL(15,2), -- Transaction amount
    currency TEXT DEFAULT 'INR',
    patient_id UUID, -- Related patient
    invoice_id UUID, -- Related invoice
    reference_number TEXT, -- External reference
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ip_address INET,
    session_id TEXT
);

-- Create medical_audit_logs for tracking medical operations and patient data access
CREATE TABLE IF NOT EXISTS public.medical_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'patient_viewed', 'case_created', 'operation_scheduled', etc.
    patient_id UUID, -- Related patient
    case_id UUID, -- Related case
    operation_id UUID, -- Related operation
    sensitive_data_accessed BOOLEAN DEFAULT FALSE, -- Flag for HIPAA compliance
    access_reason TEXT, -- Reason for accessing sensitive data
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ip_address INET,
    session_id TEXT
);

-- Create session_logs for tracking user sessions
CREATE TABLE IF NOT EXISTS public.session_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'login', 'logout', 'session_expired', 'force_logout'
    ip_address INET,
    user_agent TEXT,
    location JSONB, -- Geolocation data if available
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT, -- If login failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for performance and compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON public.audit_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_user_id ON public.financial_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_patient_id ON public.financial_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_created_at ON public.financial_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_transaction_type ON public.financial_audit_logs(transaction_type);

CREATE INDEX IF NOT EXISTS idx_medical_audit_logs_user_id ON public.medical_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_audit_logs_patient_id ON public.medical_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_audit_logs_created_at ON public.medical_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_audit_logs_action ON public.medical_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_medical_audit_logs_sensitive_data ON public.medical_audit_logs(sensitive_data_accessed);

CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON public.session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON public.session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON public.session_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_session_logs_action ON public.session_logs(action);

-- Create audit trigger function for automatic logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    session_id_val TEXT;
    ip_address_val INET;
BEGIN
    -- Get current user context (this would be set by your application)
    user_id_val := current_setting('app.current_user_id', true)::UUID;
    session_id_val := current_setting('app.session_id', true);
    ip_address_val := current_setting('app.ip_address', true)::INET;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            new_values,
            session_id,
            ip_address
        ) VALUES (
            user_id_val,
            'create',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            to_jsonb(NEW),
            session_id_val,
            ip_address_val
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values,
            session_id,
            ip_address
        ) VALUES (
            user_id_val,
            'update',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            to_jsonb(OLD),
            to_jsonb(NEW),
            session_id_val,
            ip_address_val
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            session_id,
            ip_address
        ) VALUES (
            user_id_val,
            'delete',
            TG_TABLE_NAME,
            OLD.id::TEXT,
            to_jsonb(OLD),
            session_id_val,
            ip_address_val
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for critical tables (add more as needed)
DROP TRIGGER IF EXISTS audit_patients ON public.patients;
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_cases ON public.cases;
CREATE TRIGGER audit_cases
    AFTER INSERT OR UPDATE OR DELETE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_operations ON public.operations;
CREATE TRIGGER audit_operations
    AFTER INSERT OR UPDATE OR DELETE ON public.operations
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_revenue_transactions ON public.revenue_transactions;
CREATE TRIGGER audit_revenue_transactions
    AFTER INSERT OR UPDATE OR DELETE ON public.revenue_transactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create a function to clean up old audit logs (for data retention compliance)
CREATE OR REPLACE FUNCTION public.cleanup_audit_logs(retention_days INTEGER DEFAULT 2555) -- ~7 years default
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    DELETE FROM public.financial_audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

    DELETE FROM public.medical_audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

    DELETE FROM public.session_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for compliance reporting
CREATE OR REPLACE VIEW public.compliance_audit_view AS
SELECT
    al.id,
    al.user_id,
    u.email as user_email,
    al.action,
    al.table_name,
    al.record_id,
    al.created_at,
    al.ip_address,
    al.session_id,
    CASE
        WHEN al.table_name IN ('patients', 'cases', 'operations') THEN 'medical'
        WHEN al.table_name IN ('revenue_transactions', 'invoices') THEN 'financial'
        WHEN al.table_name IN ('user_roles', 'roles', 'permissions') THEN 'security'
        ELSE 'general'
    END as audit_category
FROM public.audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
ORDER BY al.created_at DESC;

-- Enable RLS for audit tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit logs (only super admins can view)
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin')
            AND ur.is_active = true
        )
    );

-- Similar policies for other audit tables
CREATE POLICY "Super admins can view financial audit logs" ON public.financial_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin', 'finance')
            AND ur.is_active = true
        )
    );

CREATE POLICY "Medical professionals can view medical audit logs" ON public.medical_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin', 'doctor', 'nurse')
            AND ur.is_active = true
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit log for all system activities - required for healthcare compliance';
COMMENT ON TABLE public.financial_audit_logs IS 'Specific audit trail for financial transactions and billing activities';
COMMENT ON TABLE public.medical_audit_logs IS 'Medical-specific audit trail for patient data access and clinical operations';
COMMENT ON TABLE public.session_logs IS 'User session tracking for security and compliance monitoring';

COMMENT ON FUNCTION public.cleanup_audit_logs IS 'Automated cleanup function for audit log retention management';
COMMENT ON VIEW public.compliance_audit_view IS 'Consolidated view for compliance reporting and auditing';