-- Full RBAC (Role-Based Access Control) System for Healthcare Compliance
-- This migration creates a comprehensive authorization system

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    resource TEXT NOT NULL, -- e.g., 'patients', 'operations', 'revenue'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(action, resource)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(role_id, permission_id)
);

-- Create user_roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    scope_type TEXT DEFAULT 'global', -- 'global', 'clinic', 'department'
    scope_id UUID, -- ID of clinic, department, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    UNIQUE(user_id, role_id, scope_type, scope_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON public.permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON public.user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON public.user_roles(expires_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS permissions_updated_at ON public.permissions;
CREATE TRIGGER permissions_updated_at
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS user_roles_updated_at ON public.user_roles;
CREATE TRIGGER user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
('super_admin', 'Full system access with all permissions'),
('admin', 'Administrative access to most system functions'),
('doctor', 'Medical professional with patient care permissions'),
('nurse', 'Nursing staff with patient care and bed management'),
('receptionist', 'Front desk staff with patient registration and appointments'),
('finance', 'Financial operations and billing management'),
('pharmacy', 'Pharmacy and medication management'),
('lab_technician', 'Laboratory and diagnostic permissions'),
('manager', 'Department or clinic management permissions'),
('read_only', 'View-only access for reports and monitoring')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (action, resource, description) VALUES
-- Patient management
('create', 'patients', 'Create new patient records'),
('read', 'patients', 'View patient information'),
('update', 'patients', 'Edit patient records'),
('delete', 'patients', 'Delete patient records'),

-- Case management
('create', 'cases', 'Create new medical cases'),
('read', 'cases', 'View medical cases'),
('update', 'cases', 'Edit medical cases'),
('delete', 'cases', 'Delete medical cases'),

-- Appointment management
('create', 'appointments', 'Schedule appointments'),
('read', 'appointments', 'View appointments'),
('update', 'appointments', 'Modify appointments'),
('delete', 'appointments', 'Cancel appointments'),

-- Operation management
('create', 'operations', 'Schedule operations'),
('read', 'operations', 'View operation schedules'),
('update', 'operations', 'Modify operation details'),
('delete', 'operations', 'Cancel operations'),

-- Financial operations
('create', 'revenue', 'Create financial transactions'),
('read', 'revenue', 'View financial data'),
('update', 'revenue', 'Edit financial transactions'),
('delete', 'revenue', 'Delete financial records'),

-- Billing and invoices
('create', 'invoices', 'Create invoices'),
('read', 'invoices', 'View billing information'),
('update', 'invoices', 'Edit invoices'),
('delete', 'invoices', 'Delete invoices'),

-- Bed management
('create', 'beds', 'Add new beds'),
('read', 'beds', 'View bed status'),
('update', 'beds', 'Update bed information'),
('delete', 'beds', 'Remove beds'),

-- Employee management
('create', 'employees', 'Add new employees'),
('read', 'employees', 'View employee information'),
('update', 'employees', 'Edit employee records'),
('delete', 'employees', 'Remove employees'),

-- Attendance management
('create', 'attendance', 'Mark attendance'),
('read', 'attendance', 'View attendance records'),
('update', 'attendance', 'Edit attendance'),
('delete', 'attendance', 'Delete attendance records'),

-- Pharmacy management
('create', 'pharmacy', 'Add pharmacy items'),
('read', 'pharmacy', 'View pharmacy inventory'),
('update', 'pharmacy', 'Update pharmacy items'),
('delete', 'pharmacy', 'Remove pharmacy items'),

-- Certificate management
('create', 'certificates', 'Generate certificates'),
('read', 'certificates', 'View certificates'),
('update', 'certificates', 'Edit certificates'),
('delete', 'certificates', 'Delete certificates'),

-- Discharge management
('create', 'discharges', 'Process discharges'),
('read', 'discharges', 'View discharge records'),
('update', 'discharges', 'Edit discharge information'),
('delete', 'discharges', 'Delete discharge records'),

-- Master data management
('create', 'master_data', 'Add master data'),
('read', 'master_data', 'View master data'),
('update', 'master_data', 'Edit master data'),
('delete', 'master_data', 'Delete master data'),

-- System administration
('create', 'users', 'Create user accounts'),
('read', 'users', 'View user information'),
('update', 'users', 'Edit user accounts'),
('delete', 'users', 'Delete user accounts'),

('create', 'roles', 'Create roles'),
('read', 'roles', 'View roles'),
('update', 'roles', 'Edit roles'),
('delete', 'roles', 'Delete roles'),

-- Audit and reporting
('read', 'audit_logs', 'View audit logs'),
('read', 'reports', 'Access reports and analytics')

ON CONFLICT (action, resource) DO NOTHING;

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin gets most permissions (exclude some sensitive operations)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
AND p.resource NOT IN ('audit_logs')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Doctor permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'doctor'
AND p.resource IN ('patients', 'cases', 'appointments', 'operations', 'certificates', 'discharges')
AND p.action IN ('create', 'read', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nurse permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'nurse'
AND p.resource IN ('patients', 'cases', 'appointments', 'beds', 'attendance', 'certificates')
AND p.action IN ('create', 'read', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Receptionist permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'receptionist'
AND p.resource IN ('patients', 'appointments', 'certificates')
AND p.action IN ('create', 'read', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Finance permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'finance'
AND p.resource IN ('revenue', 'invoices', 'reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.roles IS 'System roles for RBAC';
COMMENT ON TABLE public.permissions IS 'Granular permissions for system resources';
COMMENT ON TABLE public.role_permissions IS 'Role to permission mappings';
COMMENT ON TABLE public.user_roles IS 'User role assignments with scope and expiration support';

-- Enable RLS (Row Level Security)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;