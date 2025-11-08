# 🚀 Backend Setup Guide - EYECARE CRM

## 📋 Overview

This guide will help you set up the complete backend for your EYECARE CRM using Supabase (PostgreSQL + Auth + Storage + Real-time).

---

## 🎯 Step 1: Create Supabase Project

### 1.1 Sign Up / Login
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login with GitHub
3. Click **"New Project"**

### 1.2 Project Configuration
```
Project Name: eyecare-crm
Database Password: [Generate strong password - SAVE THIS!]
Region: Choose closest to your users
Pricing Plan: Free (for development)
```

### 1.3 Wait for Setup
- Project creation takes ~2 minutes
- You'll see a dashboard when ready

---

## 🔑 Step 2: Get API Credentials

### 2.1 Navigate to Settings
1. Click **Settings** (gear icon) in sidebar
2. Go to **API** section

### 2.2 Copy These Values
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Keep `service_role` key secret!

---

## 📝 Step 3: Configure Environment Variables

### 3.1 Create `.env.local` File
Create this file in your project root:

```bash
# Navigate to project root
cd /Users/shreeshanthr/EYECARE

# Create .env.local file
touch .env.local
```

### 3.2 Add Configuration
Open `.env.local` and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Payment Gateway (for future)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# STRIPE_SECRET_KEY=
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=

# Optional: Communication Services (for future)
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# SENDGRID_API_KEY=
```

**Replace** `your-project-id`, `your-anon-key-here`, and `your-service-role-key-here` with actual values from Step 2.

---

## 🗄️ Step 4: Run Database Migrations

### 4.1 Open Supabase SQL Editor
1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **"New Query"**

### 4.2 Run Migration 1: Initial Schema
Copy and paste the entire content of:
```
/Users/shreeshanthr/EYECARE/supabase/migrations/001_initial_schema.sql
```

Click **"Run"** (or press Cmd/Ctrl + Enter)

✅ You should see: "Success. No rows returned"

### 4.3 Run Migration 2: RLS Policies
Create a new query and paste:
```
/Users/shreeshanthr/EYECARE/supabase/migrations/002_rls_policies.sql
```

Click **"Run"**

### 4.4 Run Migration 3: Pharmacy, Attendance, Revenue
Create a new query and paste:
```
/Users/shreeshanthr/EYECARE/supabase/migrations/003_pharmacy_attendance_revenue.sql
```

Click **"Run"**

### 4.5 Run Migration 4: Bed Management
Create a new query and paste:
```
/Users/shreeshanthr/EYECARE/supabase/migrations/004_bed_management.sql
```

Click **"Run"**

### 4.6 (Optional) Run Seed Data
For demo/testing data, paste:
```
/Users/shreeshanthr/EYECARE/supabase/seed.sql
```

Click **"Run"**

---

## 🔐 Step 5: Configure Authentication

### 5.1 Enable Email Auth
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure:
   - ✅ Enable email confirmations (optional for dev)
   - ✅ Enable email change confirmations
   - ✅ Secure email change

### 5.2 Configure Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirmation email
   - Magic link email
   - Password reset email

### 5.3 Set Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**:
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   ```

---

## 👥 Step 6: Create First Admin User

### 6.1 Manual User Creation
1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   ```
   Email: admin@eyecare.com
   Password: [Your secure password]
   Auto Confirm User: ✅ (check this)
   ```
4. Click **"Create user"**

### 6.2 Assign Admin Role
1. Go to **SQL Editor**
2. Run this query:
```sql
-- Insert admin user into users table
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@eyecare.com'),
  'admin@eyecare.com',
  'System Administrator',
  'super_admin',
  true
);
```

---

## 🔒 Step 7: Verify RLS Policies

### 7.1 Check Tables
1. Go to **Table Editor**
2. You should see all tables:
   - ✅ users
   - ✅ patients
   - ✅ appointments
   - ✅ encounters
   - ✅ invoices
   - ✅ invoice_items
   - ✅ inventory
   - ✅ optical_orders
   - ✅ surgeries
   - ✅ audit_logs
   - ✅ pharmacy_items
   - ✅ optical_items
   - ✅ stock_movements
   - ✅ attendance_records
   - ✅ employees
   - ✅ revenue_transactions
   - ✅ expenses
   - ✅ beds
   - ✅ bed_assignments

### 7.2 Check RLS Status
1. Click on any table
2. Look for **"RLS enabled"** badge
3. All tables should have RLS enabled ✅

---

## 📦 Step 8: Configure Storage (Optional)

### 8.1 Create Storage Buckets
1. Go to **Storage**
2. Create these buckets:
   ```
   - patient-documents (Private)
   - prescriptions (Private)
   - reports (Private)
   - avatars (Public)
   ```

### 8.2 Set Bucket Policies
For each private bucket, add policy:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents');

-- Allow users to read their own files
CREATE POLICY "Allow users to read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'patient-documents');
```

---

## 🧪 Step 9: Test Connection

### 9.1 Start Development Server
```bash
cd /Users/shreeshanthr/EYECARE
npm run dev
```

### 9.2 Check Console
Open browser console (F12) and look for:
- ✅ No Supabase connection errors
- ✅ No authentication errors

### 9.3 Test Database Query
Create a test file: `/app/api/test-db/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('patients')
    .select('count')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, data })
}
```

Visit: `http://localhost:3000/api/test-db`

Expected response:
```json
{
  "success": true,
  "data": [{ "count": 5 }]
}
```

---

## 🔧 Step 10: Enable Middleware Authentication

### 10.1 Update Middleware
Open `/middleware.ts` and uncomment the authentication code:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protect patient portal routes
  if (req.nextUrl.pathname.startsWith('/portal')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (req.nextUrl.pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/dashboard/cases', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/auth/:path*'],
}
```

---

## 📊 Step 11: Verify Database Structure

### 11.1 Check Table Counts
Run in SQL Editor:
```sql
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = tablename) as column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 11.2 Check Indexes
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 11.3 Check Triggers
```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

## ✅ Verification Checklist

Before proceeding, ensure:

- [ ] Supabase project created
- [ ] `.env.local` file configured with correct credentials
- [ ] All 4 migrations run successfully
- [ ] RLS enabled on all tables
- [ ] Admin user created and assigned role
- [ ] Development server starts without errors
- [ ] Test API endpoint returns data
- [ ] No console errors in browser

---

## 🚨 Troubleshooting

### Issue: "relation does not exist"
**Solution**: Run migrations in correct order (001 → 002 → 003 → 004)

### Issue: "permission denied for table"
**Solution**: Check RLS policies are created (migration 002)

### Issue: "Invalid API key"
**Solution**: Verify `.env.local` has correct keys from Supabase dashboard

### Issue: "CORS error"
**Solution**: Add your domain to Supabase → Settings → API → CORS

### Issue: "Authentication required"
**Solution**: Create user and ensure middleware is properly configured

---

## 🎯 Next Steps

After backend setup is complete:

1. **Create Auth Pages** (`/app/auth/login/page.tsx`)
2. **Connect Frontend to Backend** (Update service files)
3. **Test CRUD Operations** (Create, Read, Update, Delete)
4. **Add Real-time Subscriptions** (Optional)
5. **Deploy to Production** (Vercel + Supabase)

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Status**: Ready to implement! 🚀

*Follow each step carefully and verify before moving to the next.*
