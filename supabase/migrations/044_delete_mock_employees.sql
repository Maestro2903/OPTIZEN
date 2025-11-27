-- Migration: Delete all mock employees except super admin
-- Description: Removes all mock doctors and nurses created for testing, keeping only the super admin user
-- 
-- This migration will:
-- 1. Delete user_roles entries for mock users
-- 2. Delete from public.users (will cascade to related tables with CASCADE constraints)
-- 3. Delete from auth.users (will cascade to public.users with CASCADE)

DO $$
DECLARE
  deleted_count INTEGER := 0;
  mock_email_pattern TEXT := '%@eyecare.local';
  super_admin_email TEXT := 'superadmin@eyecare.local';
  mock_user_ids UUID[];
BEGIN
  RAISE NOTICE 'Starting deletion of mock employees...';
  RAISE NOTICE 'Keeping super admin: %', super_admin_email;

  -- Collect all mock user IDs (excluding super admin)
  SELECT ARRAY_AGG(id) INTO mock_user_ids
  FROM public.users 
  WHERE email LIKE mock_email_pattern 
  AND email != super_admin_email;

  -- Check if there are any mock users to delete
  IF mock_user_ids IS NULL OR array_length(mock_user_ids, 1) IS NULL THEN
    RAISE NOTICE 'No mock employees found to delete.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found % mock users to delete', array_length(mock_user_ids, 1);

  -- Step 1: Delete user_roles entries for mock users
  -- This prevents foreign key constraint violations
  DELETE FROM public.user_roles
  WHERE user_id = ANY(mock_user_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_roles entries', deleted_count;

  -- Step 2: Delete from public.users 
  -- Note: Some tables reference users(id) without CASCADE (appointments, encounters, operations)
  -- So we'll delete from auth.users which will cascade to public.users
  -- Any remaining references will need to be handled separately if they cause errors
  DELETE FROM auth.users
  WHERE id = ANY(mock_user_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % users from auth.users (cascading to related tables)', deleted_count;

  RAISE NOTICE '✅ Mock employees deletion completed successfully';
  RAISE NOTICE 'Super admin (%s) has been preserved', super_admin_email;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting mock employees: %', SQLERRM;
END $$;

