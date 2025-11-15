-- Add Missing RBAC Permissions
-- This migration adds permissions that were referenced in the UI but missing from the database

-- Add missing permissions for audit_logs resource
INSERT INTO public.permissions (action, resource, description) VALUES
('create', 'audit_logs', 'Create audit log entries'),
('print', 'audit_logs', 'Print audit logs'),
('update', 'audit_logs', 'Update audit log entries'),
('delete', 'audit_logs', 'Delete audit log entries')
ON CONFLICT (action, resource) DO NOTHING;

-- Add missing print permissions for users and roles
INSERT INTO public.permissions (action, resource, description) VALUES
('print', 'users', 'Print user records'),
('print', 'roles', 'Print role information')
ON CONFLICT (action, resource) DO NOTHING;

-- Add missing permissions for reports resource
INSERT INTO public.permissions (action, resource, description) VALUES
('create', 'reports', 'Create new reports'),
('print', 'reports', 'Print reports'),
('update', 'reports', 'Update reports'),
('delete', 'reports', 'Delete reports')
ON CONFLICT (action, resource) DO NOTHING;

-- Add missing permissions for expenses resource
INSERT INTO public.permissions (action, resource, description) VALUES
('read', 'expenses', 'View expense records'),
('create', 'expenses', 'Create expense records'),
('print', 'expenses', 'Print expense reports'),
('update', 'expenses', 'Update expense records'),
('delete', 'expenses', 'Delete expense records')
ON CONFLICT (action, resource) DO NOTHING;

-- Add missing permissions for finance resource
INSERT INTO public.permissions (action, resource, description) VALUES
('read', 'finance', 'View financial data'),
('create', 'finance', 'Create financial records'),
('print', 'finance', 'Print financial reports'),
('update', 'finance', 'Update financial records'),
('delete', 'finance', 'Delete financial records')
ON CONFLICT (action, resource) DO NOTHING;

-- Automatically assign all new permissions to super_admin role
-- This ensures super_admin has full system access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
AND p.id NOT IN (
    SELECT permission_id 
    FROM public.role_permissions 
    WHERE role_id = r.id
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.permissions IS 'Granular permissions for system resources and actions';

-- Log the migration
DO $$
DECLARE
    new_permission_count INT;
BEGIN
    SELECT COUNT(*) INTO new_permission_count 
    FROM public.permissions 
    WHERE resource IN ('audit_logs', 'users', 'roles', 'reports', 'expenses', 'finance')
    AND action IN ('create', 'read', 'print', 'update', 'delete');
    
    RAISE NOTICE 'Migration 037 completed: Added % permissions for missing resources', new_permission_count;
END $$;

