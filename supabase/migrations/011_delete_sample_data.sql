-- Migration to delete all sample data while preserving schema
-- This will clean the database for production use

-- Disable triggers temporarily to avoid issues during cleanup
SET session_replication_role = replica;

-- Delete all data from main tables (in dependency order)
-- Start with dependent tables first to avoid foreign key constraints

-- Clear session and security data
DELETE FROM public.user_sessions;
DELETE FROM public.failed_login_attempts;
DELETE FROM public.security_events;

-- Clear audit logs
DELETE FROM public.audit_logs;
DELETE FROM public.financial_audit_logs;
DELETE FROM public.medical_audit_logs;
DELETE FROM public.session_logs;

-- Clear business data
DELETE FROM public.revenue_transactions;
DELETE FROM public.invoices;
DELETE FROM public.invoice_items;
DELETE FROM public.certificates;
DELETE FROM public.bed_assignments;
DELETE FROM public.beds;
DELETE FROM public.discharges;
DELETE FROM public.operations;
DELETE FROM public.prescriptions;
DELETE FROM public.cases;
DELETE FROM public.appointments;
DELETE FROM public.patients;

-- Clear staff and organizational data
DELETE FROM public.attendance;
DELETE FROM public.employees;
DELETE FROM public.departments;

-- Clear master data (categories, etc.)
DELETE FROM public.master_data;

-- Clear user-role assignments (but keep roles and permissions)
DELETE FROM public.user_roles;

-- Clear user profiles but preserve auth.users (handled by Supabase Auth)
DELETE FROM public.user_profiles;

-- Reset sequences to start from 1
-- Note: Only reset sequences that exist and are used by tables with serial/identity columns

-- Reset any auto-increment counters if they exist
-- ALTER SEQUENCE IF EXISTS patients_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS appointments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS cases_id_seq RESTART WITH 1;
-- Add other sequences as needed

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Add a comment about the cleanup
COMMENT ON SCHEMA public IS 'Schema cleaned of sample data on ' || CURRENT_TIMESTAMP;

-- Log the cleanup operation
INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    success,
    created_at
) VALUES (
    NULL, -- System operation
    'database_cleanup',
    'all_tables',
    NULL,
    '{"operation": "sample_data_deletion"}',
    '{"status": "completed"}',
    NULL,
    'migration_script',
    true,
    NOW()
);