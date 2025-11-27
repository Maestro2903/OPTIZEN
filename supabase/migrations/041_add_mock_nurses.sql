-- Migration: Add mock nurse users for testing
-- Description: Creates 5 mock nurses with authentication and role assignments

DO $$
DECLARE
  nurse_role_id uuid;
  nurse1_id uuid := gen_random_uuid();
  nurse2_id uuid := gen_random_uuid();
  nurse3_id uuid := gen_random_uuid();
  nurse4_id uuid := gen_random_uuid();
  nurse5_id uuid := gen_random_uuid();
BEGIN
  -- Get the nurse role ID
  SELECT id INTO nurse_role_id FROM public.roles WHERE name = 'nurse';

  -- If nurse role doesn't exist, skip (role should exist from initial setup)
  IF nurse_role_id IS NULL THEN
    RAISE NOTICE 'Nurse role not found. Skipping nurse creation.';
    RETURN;
  END IF;

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
    (nurse1_id, 'nurse.brown@eyecare.local', crypt('Nurse@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nurse Jennifer Brown"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (nurse2_id, 'nurse.davis@eyecare.local', crypt('Nurse@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nurse Robert Davis"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (nurse3_id, 'nurse.martinez@eyecare.local', crypt('Nurse@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nurse Maria Martinez"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (nurse4_id, 'nurse.taylor@eyecare.local', crypt('Nurse@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nurse Lisa Taylor"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (nurse5_id, 'nurse.anderson@eyecare.local', crypt('Nurse@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nurse James Anderson"}'::jsonb, false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000')
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
    (nurse1_id, 'nurse.brown@eyecare.local', 'Nurse Jennifer Brown', 'nurse', '+1-555-0201', true, now(), now()),
    (nurse2_id, 'nurse.davis@eyecare.local', 'Nurse Robert Davis', 'nurse', '+1-555-0202', true, now(), now()),
    (nurse3_id, 'nurse.martinez@eyecare.local', 'Nurse Maria Martinez', 'nurse', '+1-555-0203', true, now(), now()),
    (nurse4_id, 'nurse.taylor@eyecare.local', 'Nurse Lisa Taylor', 'nurse', '+1-555-0204', true, now(), now()),
    (nurse5_id, 'nurse.anderson@eyecare.local', 'Nurse James Anderson', 'nurse', '+1-555-0205', true, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Assign nurse role to users
  INSERT INTO public.user_roles (
    id,
    user_id,
    role_id,
    scope_type,
    is_active,
    created_at,
    updated_at
  ) VALUES
    (gen_random_uuid(), nurse1_id, nurse_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), nurse2_id, nurse_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), nurse3_id, nurse_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), nurse4_id, nurse_role_id, 'global', true, now(), now()),
    (gen_random_uuid(), nurse5_id, nurse_role_id, 'global', true, now(), now())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Mock nurses created successfully';

END $$;














