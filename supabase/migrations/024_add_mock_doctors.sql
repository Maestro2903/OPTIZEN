-- Migration: Add mock doctor users for testing
-- Description: Creates 5 mock doctors with authentication and role assignments

DO $$
DECLARE
  doctor_role_id uuid;
  doctor1_id uuid := gen_random_uuid();
  doctor2_id uuid := gen_random_uuid();
  doctor3_id uuid := gen_random_uuid();
  doctor4_id uuid := gen_random_uuid();
  doctor5_id uuid := gen_random_uuid();
BEGIN
  -- Get the doctor role ID
  SELECT id INTO doctor_role_id FROM public.roles WHERE name = 'doctor';

  -- Insert into auth.users (authentication table)
  INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    instance_id
  ) VALUES
    (doctor1_id, 'dr.smith@eyecare.local', crypt('Doctor@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dr. John Smith"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (doctor2_id, 'dr.johnson@eyecare.local', crypt('Doctor@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dr. Sarah Johnson"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (doctor3_id, 'dr.patel@eyecare.local', crypt('Doctor@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dr. Rajesh Patel"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (doctor4_id, 'dr.lee@eyecare.local', crypt('Doctor@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dr. Emily Lee"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (doctor5_id, 'dr.williams@eyecare.local', crypt('Doctor@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dr. Michael Williams"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000')
  ON CONFLICT (id) DO NOTHING;

  -- Insert into public.users (profile table)
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    phone,
    is_active,
    created_at,
    updated_at
  ) VALUES
    (doctor1_id, 'dr.smith@eyecare.local', 'Dr. John Smith', 'doctor', '+1-555-0101', true, now(), now()),
    (doctor2_id, 'dr.johnson@eyecare.local', 'Dr. Sarah Johnson', 'doctor', '+1-555-0102', true, now(), now()),
    (doctor3_id, 'dr.patel@eyecare.local', 'Dr. Rajesh Patel', 'doctor', '+1-555-0103', true, now(), now()),
    (doctor4_id, 'dr.lee@eyecare.local', 'Dr. Emily Lee', 'doctor', '+1-555-0104', true, now(), now()),
    (doctor5_id, 'dr.williams@eyecare.local', 'Dr. Michael Williams', 'doctor', '+1-555-0105', true, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Assign doctor role to users
  INSERT INTO public.user_roles (
    id,
    user_id,
    role_id,
    scope_type,
    is_active,
    created_at,
    updated_at
  ) VALUES
    (gen_random_uuid(), doctor1_id, doctor_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), doctor2_id, doctor_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), doctor3_id, doctor_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), doctor4_id, doctor_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), doctor5_id, doctor_role_id, 'global', true, now(), now())
  ON CONFLICT DO NOTHING;

END $$;
