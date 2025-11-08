# ⚡ Quick Start - Backend Setup (5 Minutes)

## 🎯 Goal
Get your EYECARE CRM backend up and running in 5 minutes!

---

## ✅ Step 1: Create Supabase Project (2 min)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - Name: `eyecare-crm`
   - Password: Generate strong password (SAVE IT!)
   - Region: Choose closest
4. Click **"Create new project"**
5. Wait ~2 minutes for setup

---

## ✅ Step 2: Get API Keys (30 sec)

1. In Supabase Dashboard → **Settings** → **API**
2. Copy these 3 values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGci...
   service_role: eyJhbGci... (keep secret!)
   ```

---

## ✅ Step 3: Configure Environment (30 sec)

1. Create `.env.local` in project root:
   ```bash
   cd /Users/shreeshanthr/EYECARE
   touch .env.local
   ```

2. Add this content (replace with your values):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

## ✅ Step 4: Run Database Migrations (1 min)

1. In Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy & paste each migration file and click **"Run"**:

### Migration 1: Core Tables
```bash
# Copy content from:
supabase/migrations/001_initial_schema.sql
```
Click **Run** ✅

### Migration 2: Security Policies
```bash
# Copy content from:
supabase/migrations/002_rls_policies.sql
```
Click **Run** ✅

### Migration 3: Extended Tables
```bash
# Copy content from:
supabase/migrations/003_pharmacy_attendance_revenue.sql
```
Click **Run** ✅

### Migration 4: Bed Management
```bash
# Copy content from:
supabase/migrations/004_bed_management.sql
```
Click **Run** ✅

### (Optional) Seed Data
```bash
# Copy content from:
supabase/seed.sql
```
Click **Run** ✅

---

## ✅ Step 5: Create Admin User (1 min)

### 5.1 Create Auth User
1. Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   ```
   Email: admin@eyecare.com
   Password: YourSecurePassword123!
   ✅ Auto Confirm User
   ```
4. Click **"Create user"**

### 5.2 Assign Admin Role
1. Go to **SQL Editor** → **New Query**
2. Run this:
   ```sql
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'admin@eyecare.com'),
     'admin@eyecare.com',
     'System Administrator',
     'super_admin',
     true
   );
   ```
3. Click **Run** ✅

---

## ✅ Step 6: Test Connection (30 sec)

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open browser: `http://localhost:3000/auth/login`

3. Login with:
   ```
   Email: admin@eyecare.com
   Password: YourSecurePassword123!
   ```

4. If successful, you'll be redirected to `/dashboard/cases` ✅

---

## 🎉 Done!

Your backend is now running! You should see:
- ✅ Login page working
- ✅ Authentication successful
- ✅ Dashboard accessible
- ✅ No console errors

---

## 🚨 Troubleshooting

### "Invalid API key"
- Check `.env.local` has correct keys
- Restart dev server: `npm run dev`

### "relation does not exist"
- Run all 4 migrations in order
- Check SQL Editor for errors

### "Login failed"
- Verify admin user was created
- Check password is correct
- Ensure user role was assigned

### "Cannot connect to Supabase"
- Check Project URL is correct
- Verify project is not paused
- Check internet connection

---

## 📚 Next Steps

1. ✅ Backend setup complete
2. 🔄 Connect frontend pages to Supabase
3. 🧪 Test CRUD operations
4. 🚀 Deploy to production

---

## 📞 Need Help?

- [Full Setup Guide](./BACKEND_SETUP_GUIDE.md)
- [Supabase Docs](https://supabase.com/docs)
- [Troubleshooting Guide](./BACKEND_SETUP_GUIDE.md#troubleshooting)

---

**Total Time**: ~5 minutes ⏱️  
**Status**: Ready to use! 🚀
