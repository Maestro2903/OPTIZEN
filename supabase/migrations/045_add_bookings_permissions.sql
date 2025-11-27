-- Add Bookings and Doctor Schedule Permissions
-- This migration adds permissions for:
-- 1. bookings resource (appointment requests management) - separate module from appointments
-- 2. doctor_schedule resource - for managing doctor schedules and availability
--
-- These resources were referenced in the RBAC client code and access control UI
-- but were missing from the database permissions table

-- Add permissions for bookings resource
INSERT INTO public.permissions (action, resource, description) VALUES
('read', 'bookings', 'View appointment requests and bookings'),
('create', 'bookings', 'Accept and process appointment requests'),
('print', 'bookings', 'Print booking confirmations and requests'),
('update', 'bookings', 'Edit appointment request details'),
('delete', 'bookings', 'Reject and delete appointment requests')
ON CONFLICT (action, resource) DO NOTHING;

-- Add permissions for doctor_schedule resource
INSERT INTO public.permissions (action, resource, description) VALUES
('read', 'doctor_schedule', 'View doctor schedules and availability'),
('create', 'doctor_schedule', 'Create and set doctor schedules'),
('print', 'doctor_schedule', 'Print doctor schedule reports'),
('update', 'doctor_schedule', 'Edit and update doctor schedules'),
('delete', 'doctor_schedule', 'Delete doctor schedule entries')
ON CONFLICT (action, resource) DO NOTHING;

-- Assign bookings permissions to roles based on their access patterns
-- Super Admin: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
AND p.resource = 'bookings'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Hospital Admin: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'hospital_admin'
AND p.resource = 'bookings'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
AND p.resource = 'bookings'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Receptionist: View, Create, Print, Edit (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'receptionist'
AND p.resource = 'bookings'
AND p.action IN ('read', 'create', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Optometrist: View, Print, Edit (no create/delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'optometrist'
AND p.resource = 'bookings'
AND p.action IN ('read', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Ophthalmologist: View, Print, Edit (no create/delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'ophthalmologist'
AND p.resource = 'bookings'
AND p.action IN ('read', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Doctor (alias): View, Print, Edit (no create/delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'doctor'
AND p.resource = 'bookings'
AND p.action IN ('read', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nurse: View, Print, Edit (no create/delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'nurse'
AND p.resource = 'bookings'
AND p.action IN ('read', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager: View, Create, Print, Edit (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'manager'
AND p.resource = 'bookings'
AND p.action IN ('read', 'create', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Other roles (technician, billing_staff, finance, pharmacy_staff, pharmacy, lab_technician, patient, read_only): View only
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('technician', 'billing_staff', 'finance', 'pharmacy_staff', 'pharmacy', 'lab_technician', 'patient', 'read_only')
AND p.resource = 'bookings'
AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- For read_only role, also allow print
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'read_only'
AND p.resource = 'bookings'
AND p.action = 'print'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign doctor_schedule permissions to roles based on their access patterns
-- Super Admin: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
AND p.resource = 'doctor_schedule'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Hospital Admin: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'hospital_admin'
AND p.resource = 'doctor_schedule'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
AND p.resource = 'doctor_schedule'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Receptionist: View and Print only (no create/edit/delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'receptionist'
AND p.resource = 'doctor_schedule'
AND p.action IN ('read', 'print')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Optometrist: View, Create, Print, Edit (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'optometrist'
AND p.resource = 'doctor_schedule'
AND p.action IN ('read', 'create', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Ophthalmologist: View, Create, Print, Edit (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'ophthalmologist'
AND p.resource = 'doctor_schedule'
AND p.action IN ('read', 'create', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Doctor (alias): View, Create, Print, Edit (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'doctor'
AND p.resource = 'doctor_schedule'
AND p.action IN ('read', 'create', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nurse: View and Print only (no create/edit/delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'nurse'
AND p.resource = 'doctor_schedule'
AND p.action IN ('read', 'print')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager: View, Create, Print, Edit (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'manager'
AND p.resource = 'doctor_schedule'
AND p.action IN ('read', 'create', 'print', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Other roles (technician, billing_staff, finance, pharmacy_staff, pharmacy, lab_technician, patient): No access
-- (No permissions assigned - they shouldn't access doctor schedules)

-- read_only: View and Print only
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'read_only'
AND p.resource = 'doctor_schedule'
AND p.action IN ('read', 'print')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN public.permissions.resource IS 'Resource name (e.g., bookings, appointments, patients, doctor_schedule). bookings is for managing public appointment requests. doctor_schedule is for managing doctor schedules and availability.';

-- Log the migration
DO $$
DECLARE
    bookings_permission_count INT;
    doctor_schedule_permission_count INT;
    bookings_role_assignment_count INT;
    doctor_schedule_role_assignment_count INT;
BEGIN
    SELECT COUNT(*) INTO bookings_permission_count 
    FROM public.permissions 
    WHERE resource = 'bookings';
    
    SELECT COUNT(*) INTO doctor_schedule_permission_count 
    FROM public.permissions 
    WHERE resource = 'doctor_schedule';
    
    SELECT COUNT(*) INTO bookings_role_assignment_count
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE p.resource = 'bookings';
    
    SELECT COUNT(*) INTO doctor_schedule_role_assignment_count
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE p.resource = 'doctor_schedule';
    
    RAISE NOTICE 'Migration 045 completed:';
    RAISE NOTICE '  - Added % bookings permissions and assigned to % role-permission combinations', bookings_permission_count, bookings_role_assignment_count;
    RAISE NOTICE '  - Added % doctor_schedule permissions and assigned to % role-permission combinations', doctor_schedule_permission_count, doctor_schedule_role_assignment_count;
END $$;

