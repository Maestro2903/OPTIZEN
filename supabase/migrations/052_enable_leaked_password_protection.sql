-- Enable Leaked Password Protection
-- This migration documents the requirement to enable Supabase Auth leaked password protection
-- 
-- IMPORTANT: This feature must be enabled via Supabase Dashboard or Management API
-- 
-- Steps to enable:
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Enable "Leaked Password Protection" 
-- 3. This will check passwords against HaveIBeenPwned.org database
--
-- Alternative: Use Supabase Management API
-- POST /v1/projects/{project_ref}/config/auth
-- {
--   "PASSWORD_PROTECTION_ENABLED": true
-- }
--
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

-- Note: This migration file serves as documentation only
-- The actual setting must be configured in Supabase Dashboard or via Management API

COMMENT ON SCHEMA public IS 'Leaked password protection should be enabled in Supabase Auth settings to prevent use of compromised passwords from HaveIBeenPwned.org database.';












