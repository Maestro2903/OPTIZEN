-- Create Test Users for RBAC Testing
-- Note: These users must first be created in Supabase Auth Dashboard or via Auth API
-- This script only creates entries in the public.users table

-- Test user IDs (replace with actual UUIDs from Supabase Auth)
-- For testing, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Add users with these emails
-- 3. Copy their UUIDs and replace the placeholders below

-- Super Admin User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual UUID
  'superadmin@eyecare.local',
  'Super Admin',
  'super_admin',
  true,
  '+1234567890'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Hospital Admin User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000002', -- Replace with actual UUID
  'admin@eyecare.local',
  'Hospital Admin',
  'admin',
  true,
  '+1234567891'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Doctor User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000003', -- Replace with actual UUID
  'doctor@eyecare.local',
  'Dr. John Smith',
  'doctor',
  true,
  '+1234567892'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Nurse User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000004', -- Replace with actual UUID
  'nurse@eyecare.local',
  'Jane Doe RN',
  'nurse',
  true,
  '+1234567893'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Receptionist User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000005', -- Replace with actual UUID
  'receptionist@eyecare.local',
  'Sarah Johnson',
  'receptionist',
  true,
  '+1234567894'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Finance/Billing Staff User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000006', -- Replace with actual UUID
  'finance@eyecare.local',
  'Michael Chen',
  'finance',
  true,
  '+1234567895'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Pharmacy Staff User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000007', -- Replace with actual UUID
  'pharmacy@eyecare.local',
  'Emily Williams',
  'pharmacy_staff',
  true,
  '+1234567896'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Lab Technician User
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  '00000000-0000-0000-0000-000000000008', -- Replace with actual UUID
  'lab@eyecare.local',
  'David Brown',
  'lab_technician',
  true,
  '+1234567897'
) ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Verify user_roles were synced by trigger
SELECT 
  u.email,
  u.full_name,
  u.role::text as user_role,
  r.name as role_name,
  ur.is_active,
  COUNT(rp.permission_id) as permission_count
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
GROUP BY u.email, u.full_name, u.role, r.name, ur.is_active
ORDER BY u.email;

