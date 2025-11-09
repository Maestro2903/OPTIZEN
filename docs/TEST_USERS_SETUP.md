# Test Users Setup Guide

## Overview
This guide explains how to create test users with different roles for testing the RBAC system.

## Step 1: Create Users in Supabase Auth

You have two options:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** (or **Invite user**)
4. Create the following users:

| Email | Password | Role |
|-------|----------|------|
| superadmin@eyecare.local | Test@123 | super_admin |
| admin@eyecare.local | Test@123 | admin |
| doctor@eyecare.local | Test@123 | doctor |
| nurse@eyecare.local | Test@123 | nurse |
| receptionist@eyecare.local | Test@123 | receptionist |
| finance@eyecare.local | Test@123 | finance |
| pharmacy@eyecare.local | Test@123 | pharmacy_staff |
| lab@eyecare.local | Test@123 | lab_technician |

5. **Important**: For each user, copy their UUID after creation

### Option B: Using SQL (Advanced)

If you have direct database access, you can use the Auth Admin functions:

```sql
-- This requires superuser access and the auth schema functions
-- Run this in the SQL Editor in Supabase Dashboard

-- Create Super Admin
SELECT auth.create_user(
  'superadmin@eyecare.local',
  'Test@123',
  '{"full_name": "Super Admin"}'::jsonb
);
-- Copy the returned UUID
```

## Step 2: Insert Users into public.users Table

After creating auth users, you need to create corresponding entries in the `public.users` table:

### Method 1: Using the SQL Script (Recommended)

1. Edit `scripts/create-test-users.sql`
2. Replace the placeholder UUIDs (`00000000-0000-0000-0000-00000000000X`) with the actual UUIDs from Step 1
3. Run the script in Supabase SQL Editor or via command line:

```bash
psql -h your-supabase-host -U postgres -d postgres -f scripts/create-test-users.sql
```

### Method 2: Manual SQL Insert

For each user created in auth, run:

```sql
INSERT INTO public.users (id, email, full_name, role, is_active, phone)
VALUES (
  'ACTUAL-UUID-FROM-AUTH',
  'user@eyecare.local',
  'User Full Name',
  'role_name',
  true,
  '+1234567890'
);
```

## Step 3: Verify Setup

Run this query to verify all users and their permissions:

```sql
SELECT 
  u.email,
  u.full_name,
  u.role::text as user_role,
  r.name as role_name,
  ur.is_active,
  ur.scope_type,
  COUNT(rp.permission_id) as permission_count
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
WHERE u.email LIKE '%@eyecare.local'
GROUP BY u.email, u.full_name, u.role, r.name, ur.is_active, ur.scope_type
ORDER BY u.email;
```

Expected Results:
- Super Admin: ~200+ permissions
- Admin: ~180+ permissions
- Doctor: ~70+ permissions
- Nurse: ~30+ permissions
- Receptionist: ~20+ permissions
- Finance: ~15+ permissions
- Pharmacy Staff: ~5 permissions
- Lab Technician: ~15 permissions

## Step 4: Test Login

1. Start your development server:
```bash
npm run dev
```

2. Navigate to http://localhost:3000/auth/login

3. Try logging in with each test user:
   - Email: `superadmin@eyecare.local`
   - Password: `Test@123` (or whatever you set)

4. After login, you should be redirected to `/dashboard`

5. Verify:
   - Sidebar shows only modules the user has access to
   - User profile displays correct name and role
   - Access Control page is only visible to super_admin

## Step 5: Test Access Control

### As Super Admin:
1. Login as superadmin@eyecare.local
2. Navigate to **Access Control** in the sidebar
3. Select different roles from the dropdown
4. Toggle permissions and verify they save
5. Check database to confirm changes:

```sql
SELECT 
  r.name as role,
  p.resource,
  p.action
FROM public.role_permissions rp
JOIN public.roles r ON r.id = rp.role_id
JOIN public.permissions p ON p.id = rp.permission_id
WHERE r.name = 'doctor'
ORDER BY p.resource, p.action;
```

### As Other Roles:
1. Login as doctor@eyecare.local
2. Verify you can access: Patients, Cases, Appointments, Operations, etc.
3. Try to access `/dashboard/access-control` directly - should get 403 or redirect

4. Login as receptionist@eyecare.local
5. Verify limited access: Appointments, Patients, Certificates, Beds
6. Try to access Revenue or Pharmacy - should be blocked

## Troubleshooting

### Users can't log in
- Verify the user exists in both `auth.users` and `public.users`
- Check that `is_active = true` in `public.users`
- Verify Supabase environment variables in `.env.local`
- Check browser console for errors

### Permissions not working
- Run the verification query from Step 3
- Check that `user_roles` entries were created (the trigger should do this automatically)
- Verify the role name matches exactly (case-sensitive)
- Clear browser cache and cookies

### Access Control page not visible
- Ensure you're logged in as super_admin (not admin)
- Check `middleware.ts` - should allow super_admin to access `/dashboard/access-control`
- Clear browser cache

### API calls failing with 403
- Check the API route has `requirePermission()` middleware
- Verify the resource name matches exactly
- Check Network tab in browser dev tools for error details
- Review API logs in Supabase dashboard

## Permission Matrix by Role

### Super Admin
✅ Full access to all modules and actions (view, create, edit, delete, print)

### Hospital Admin  
✅ Full access to all modules
❌ Cannot delete: Employees, Revenue, Attendance, Roles, Users

### Doctor
✅ Full access: Patients, Cases, Appointments, Operations, Certificates, Discharges
✅ Full access: Pharmacy, Master Data (all types)
✅ Actions: view, create, edit, print
❌ No delete permissions

### Nurse
✅ Access: Patients, Cases, Appointments, Beds, Attendance, Certificates
✅ Actions: view, create, edit, print
❌ No delete permissions

### Receptionist
✅ Full access: Appointments, Patients, Certificates, Beds
✅ View only: Pharmacy
✅ Actions: view, create, edit, print
❌ No delete permissions

### Finance/Billing Staff
✅ Full access: Revenue, Invoices, Reports
✅ View only: Patients
✅ All actions including delete

### Pharmacy Staff
✅ Full access: Pharmacy module only
✅ All actions including delete

### Lab Technician
✅ Access: Patients, Cases, Blood Investigations
✅ Actions: view, create, edit, print
❌ No delete permissions

## Next Steps

1. **Test each user role** systematically
2. **Document any issues** found during testing
3. **Apply RBAC pattern** to remaining API routes (optional)
4. **Add audit logging** to track permission changes
5. **Create user management UI** for admins to manage users without SQL

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- RBAC Implementation: `docs/AUTH_AND_ACCESS_CONTROL_IMPLEMENTATION.md`

