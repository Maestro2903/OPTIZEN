-- Unified RBAC System with PRINT Permission and All Module Permissions
-- This migration adds comprehensive role-based access control with print capabilities

-- Add PRINT permission for all existing modules
INSERT INTO public.permissions (action, resource, description) VALUES
('print', 'patients', 'Print patient records'),
('print', 'cases', 'Print medical cases'),
('print', 'appointments', 'Print appointments'),
('print', 'operations', 'Print operation schedules'),
('print', 'revenue', 'Print financial reports'),
('print', 'invoices', 'Print invoices'),
('print', 'beds', 'Print bed status reports'),
('print', 'employees', 'Print employee records'),
('print', 'attendance', 'Print attendance records'),
('print', 'pharmacy', 'Print pharmacy reports'),
('print', 'certificates', 'Print certificates'),
('print', 'discharges', 'Print discharge summaries'),
('print', 'master_data', 'Print master data')
ON CONFLICT (action, resource) DO NOTHING;

-- Add new module permissions (Lens, Complaint, Treatment, Medicine, Dosage, Surgery, Blood Investigation, Diagnosis)
INSERT INTO public.permissions (action, resource, description) VALUES
-- Lens management (Master Data)
('create', 'lens', 'Add lens data'),
('read', 'lens', 'View lens data'),
('update', 'lens', 'Edit lens data'),
('delete', 'lens', 'Delete lens data'),
('print', 'lens', 'Print lens data'),

-- Complaint management (Master Data)
('create', 'complaint', 'Add complaint data'),
('read', 'complaint', 'View complaint data'),
('update', 'complaint', 'Edit complaint data'),
('delete', 'complaint', 'Delete complaint data'),
('print', 'complaint', 'Print complaint data'),

-- Treatment management (Master Data)
('create', 'treatment', 'Add treatment data'),
('read', 'treatment', 'View treatment data'),
('update', 'treatment', 'Edit treatment data'),
('delete', 'treatment', 'Delete treatment data'),
('print', 'treatment', 'Print treatment data'),

-- Medicine management (Master Data)
('create', 'medicine', 'Add medicine data'),
('read', 'medicine', 'View medicine data'),
('update', 'medicine', 'Edit medicine data'),
('delete', 'medicine', 'Delete medicine data'),
('print', 'medicine', 'Print medicine data'),

-- Dosage management (Master Data)
('create', 'dosage', 'Add dosage data'),
('read', 'dosage', 'View dosage data'),
('update', 'dosage', 'Edit dosage data'),
('delete', 'dosage', 'Delete dosage data'),
('print', 'dosage', 'Print dosage data'),

-- Surgery management (Master Data)
('create', 'surgery', 'Add surgery data'),
('read', 'surgery', 'View surgery data'),
('update', 'surgery', 'Edit surgery data'),
('delete', 'surgery', 'Delete surgery data'),
('print', 'surgery', 'Print surgery data'),

-- Blood Investigation management (Master Data)
('create', 'blood_investigation', 'Add blood investigation data'),
('read', 'blood_investigation', 'View blood investigation data'),
('update', 'blood_investigation', 'Edit blood investigation data'),
('delete', 'blood_investigation', 'Delete blood investigation data'),
('print', 'blood_investigation', 'Print blood investigation data'),

-- Diagnosis management (Master Data)
('create', 'diagnosis', 'Add diagnosis data'),
('read', 'diagnosis', 'View diagnosis data'),
('update', 'diagnosis', 'Edit diagnosis data'),
('delete', 'diagnosis', 'Delete diagnosis data'),
('print', 'diagnosis', 'Print diagnosis data')

ON CONFLICT (action, resource) DO NOTHING;

-- Add pharmacy_staff role if not exists
INSERT INTO public.roles (name, description) VALUES
('pharmacy_staff', 'Pharmacy staff with pharmacy module access only')
ON CONFLICT (name) DO NOTHING;

-- Clear existing role permissions to rebuild from scratch
-- Create backup table first
CREATE TEMP TABLE role_permissions_backup AS
SELECT * FROM public.role_permissions WHERE role_id IN (
    SELECT id FROM public.roles WHERE name IN (
        'super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 
        'finance', 'pharmacy', 'lab_technician', 'manager', 'pharmacy_staff'
    )
);

-- Validate all role names exist before proceeding
DO $$
DECLARE
    role_names TEXT[] := ARRAY['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 
                                'finance', 'pharmacy', 'lab_technician', 'manager', 'pharmacy_staff'];
    role_name TEXT;
    missing_roles TEXT[] := '{}';
BEGIN
    FOREACH role_name IN ARRAY role_names
    LOOP
        IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = role_name) THEN
            missing_roles := array_append(missing_roles, role_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_roles, 1) > 0 THEN
        RAISE EXCEPTION 'Migration aborted: Missing roles: %', array_to_string(missing_roles, ', ');
    END IF;
    
    RAISE NOTICE 'All required roles validated. Proceeding with deletion.';
END $$;

-- Delete only the validated roles
DELETE FROM public.role_permissions 
WHERE role_id IN (
    SELECT id FROM public.roles WHERE name IN (
        'super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 
        'finance', 'pharmacy', 'lab_technician', 'manager', 'pharmacy_staff'
    )
);

-- Log the operation
DO $$
DECLARE
    backup_count INT;
    deleted_count INT;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM role_permissions_backup;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Backed up % rows, deleted % rows from role_permissions', backup_count, deleted_count;
END $$;

-- SUPER ADMIN: Full access to everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HOSPITAL ADMIN (admin): Full access except delete on sensitive modules
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
AND NOT (p.action = 'delete' AND p.resource IN ('employees', 'revenue', 'attendance', 'roles', 'users'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DOCTOR (ophthalmologist/optometrist): Full access to medical modules
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'doctor'
AND p.resource IN (
    'patients', 'cases', 'appointments', 'operations', 'certificates', 'discharges',
    'pharmacy', 'lens', 'complaint', 'treatment', 'medicine', 'dosage', 
    'surgery', 'blood_investigation', 'diagnosis', 'master_data'
)
AND p.action IN ('create', 'read', 'update', 'print')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NURSE: Patient care and bed management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'nurse'
AND p.resource IN ('patients', 'cases', 'appointments', 'beds', 'attendance', 'certificates')
AND p.action IN ('create', 'read', 'update', 'print')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- RECEPTIONIST: Front desk operations
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'receptionist'
AND (
    (p.resource IN ('certificates', 'appointments', 'patients', 'beds') 
     AND p.action IN ('create', 'read', 'update', 'print'))
    OR
    (p.resource = 'pharmacy' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- BILLING STAFF (finance): Financial operations
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'finance'
AND p.resource IN ('revenue', 'invoices', 'reports', 'patients')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACY: Full pharmacy module access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'pharmacy'
AND p.resource = 'pharmacy'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PHARMACY STAFF: View and edit pharmacy only (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'pharmacy_staff'
AND p.resource = 'pharmacy'
AND p.action IN ('read', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- LAB TECHNICIAN: Lab and diagnostic operations
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'lab_technician'
AND p.resource IN ('patients', 'cases', 'blood_investigation')
AND p.action IN ('create', 'read', 'update', 'print')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create function to sync users.role with user_roles table
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
DECLARE
    role_uuid UUID;
BEGIN
    -- Get the role_id from roles table
    SELECT id INTO role_uuid
    FROM public.roles
    WHERE name = NEW.role;

    -- If role exists in roles table, sync to user_roles
    IF role_uuid IS NOT NULL THEN
        -- Delete existing role assignments for this user
        DELETE FROM public.user_roles WHERE user_id = NEW.id;
        
        -- Insert new role assignment
        INSERT INTO public.user_roles (user_id, role_id, scope_type, is_active)
        VALUES (NEW.id, role_uuid, 'global', NEW.is_active)
        ON CONFLICT (user_id, role_id, scope_type, scope_id) 
        DO UPDATE SET is_active = NEW.is_active, updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync users.role with user_roles (only on role changes)
DROP TRIGGER IF EXISTS trigger_sync_user_role ON public.users;
CREATE TRIGGER trigger_sync_user_role
    AFTER INSERT OR UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role();

-- Create separate trigger to handle is_active updates efficiently
CREATE OR REPLACE FUNCTION public.sync_user_active_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update is_active in user_roles, don't re-sync roles
    UPDATE public.user_roles
    SET is_active = NEW.is_active,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_active_status ON public.users;
CREATE TRIGGER trigger_sync_user_active_status
    AFTER UPDATE OF is_active ON public.users
    FOR EACH ROW
    WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
    EXECUTE FUNCTION public.sync_user_active_status();

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND p.resource = p_resource
        AND p.action = p_action
        AND p.is_active = TRUE
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync existing users to user_roles table
INSERT INTO public.user_roles (user_id, role_id, scope_type, is_active)
SELECT 
    u.id,
    r.id,
    'global',
    u.is_active
FROM public.users u
JOIN public.roles r ON r.name = u.role
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
)
ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING;

-- Add comments
COMMENT ON FUNCTION public.sync_user_role() IS 'Automatically syncs users.role column with user_roles table';
COMMENT ON FUNCTION public.user_has_permission(UUID, TEXT, TEXT) IS 'Check if user has specific permission for a resource';

