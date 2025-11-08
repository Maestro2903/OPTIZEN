# ❌ UNABLE TO ADD PATIENTS - SOLUTION

## Prerequisites: Environment Setup

Before following this guide, ensure your environment variables are configured:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Never commit `.env.local` to version control!** (It's already in `.gitignore`)

4. Find your credentials in Supabase Dashboard → Settings → API

---

## 🎯 Root Cause
The issue is caused by **authentication requirement** + **database schema mismatch**.

## 🔍 Problem Breakdown

### Issue #1: Unauthorized Error
The API requires authentication. You must be **logged in** to add patients.

### Issue #2: Schema Mismatch  
The database schema from migration `001_initial_schema.sql` uses:
- ❌ `mrn` (Medical Record Number)
- ❌ `first_name` + `last_name`

But the API expects:
- ✅ `patient_id`
- ✅ `full_name`

## ✅ SOLUTION

### Step 1: Apply Database Migrations

Go to your Supabase Dashboard and run the migration:

```bash
# Open Supabase Dashboard (replace YOUR_PROJECT_ID with your actual project reference)
https://supabase.com/dashboard/project/YOUR_PROJECT_ID

# Navigate to: SQL Editor > New Query
# Run the migration file: 012_fix_patients_schema.sql
```

**OR** Use Supabase CLI:

```bash
# Link to your project (replace YOUR_PROJECT_ID with your actual project reference)
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
supabase db push
```

**OR** Run the SQL directly in Supabase Dashboard:

```sql
-- Copy the contents of:
-- supabase/migrations/012_fix_patients_schema.sql
-- And paste into SQL Editor in Supabase Dashboard
```

### Step 2: Create Test User & Login

#### Option A: Create User via Supabase Dashboard
1. Go to your Supabase Dashboard: https://supabase.com/dashboard → Select your project
2. Click **Authentication** → **Users**
3. Click **Add User** → **Create User**
4. Enter:
   - Email: `admin@eyecare.test`
   - Password: `password123` (change this!)
   - Auto Confirm User: ✅ Yes

#### Option B: Sign Up via Application
1. If you have a signup page, create an account
2. Confirm the user via Supabase Dashboard if needed

### Step 3: Login to Application

```bash
# Start dev server if not running
npm run dev

# Open browser
http://localhost:3001/auth/login

# Login with your credentials
Email: admin@eyecare.test
Password: password123
```

### Step 4: Test Patient Creation

Once logged in:
1. Go to **Patients** page
2. Click **Add Patient** button
3. Fill in the form:
   - **Full Name:** John Doe
   - **Mobile:** 9876543210
   - **Gender:** Male
   - **State:** Gujarat
4. Click **Save**

✅ Patient should be created successfully!

## 🔧 Alternative: Quick Fix Script

I've created a script to check and fix the database:

```bash
# Test database connection and schema
node scripts/test-supabase-connection.js

# Check if migrations are applied
node scripts/check-database-schema.js
```

## 🐛 Debugging

### Check if you're logged in:

Open browser console (F12) on localhost:3001:

```javascript
// Check cookies
document.cookie.includes('sb-access-token')
// Should return: true

// Or use the auth check page
```

### Check database table:

Go to Supabase Dashboard → **Table Editor** → Look for `patients` table

Verify columns:
- ✅ `patient_id` (TEXT)
- ✅ `full_name` (TEXT)
- ✅ `mobile` (TEXT)
- ✅ `gender` (TEXT)
- ✅ `status` (TEXT)

### Check API directly:

```bash
# With authentication (get token from browser cookies)
curl -X GET http://localhost:3001/api/patients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Should return: { success: true, data: [...] }
# Not: { error: "Unauthorized" }
```

## 📋 Complete Setup Checklist

- [ ] Database migrations applied (especially 012_fix_patients_schema.sql)
- [ ] `patients` table exists with correct schema
- [ ] RLS policies enabled on `patients` table
- [ ] Test user created in Supabase Authentication
- [ ] Logged into the application
- [ ] Dev server running on port 3001
- [ ] Can access http://localhost:3001/dashboard/patients
- [ ] "Add Patient" button visible
- [ ] Form opens when clicked
- [ ] Can submit form without "Unauthorized" error

## 🎯 Quick Test Command

Run this to test everything at once:

```bash
# Create and run test script
cat > /tmp/test_patient_api.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Patient Creation System"
echo ""

# Test 1: Server running?
echo "1️⃣ Checking if dev server is running..."
if curl -s http://localhost:3001 > /dev/null; then
  echo "   ✅ Server is running on port 3001"
else
  echo "   ❌ Server not running. Start with: npm run dev"
  exit 1
fi

# Test 2: API endpoint exists?
echo "2️⃣ Checking /api/patients endpoint..."
RESPONSE=$(curl -s http://localhost:3001/api/patients)
if echo "$RESPONSE" | grep -q "Unauthorized"; then
  echo "   ⚠️  API requires authentication (this is correct)"
elif echo "$RESPONSE" | grep -q "success"; then
  echo "   ✅ API is working!"
else
  echo "   ❌ API error: $RESPONSE"
fi

# Test 3: Supabase connection
echo "3️⃣ Checking Supabase configuration..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
  echo "   ✅ Supabase URL configured in .env.local"
else
  echo "   ❌ Supabase URL not configured - check .env.local"
fi

echo ""
echo "✅ Next steps:"
echo "   1. Login at: http://localhost:3001/auth/login"
echo "   2. Go to: http://localhost:3001/dashboard/patients"
echo "   3. Click 'Add Patient' and test"
EOF

chmod +x /tmp/test_patient_api.sh
/tmp/test_patient_api.sh
```

## 💡 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Unauthorized` | Not logged in | Login first at /auth/login |
| `Missing required fields` | Form incomplete | Fill: full_name, mobile, gender, state |
| `Patient ID already exists` | Duplicate patient_id | System auto-generates - clear form cache |
| `relation "patients" does not exist` | Migrations not applied | Run 012_fix_patients_schema.sql |
| `permission denied` | RLS policies missing | Apply RLS policies from migration |
| `Failed to fetch` | Server not running | Start with: npm run dev |

## 🆘 Still Not Working?

1. **Check Supabase Logs:**
   - Go to Dashboard → Logs
   - Look for errors when creating patient

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Try adding patient
   - Copy error message

3. **Check Network Tab:**
   - DevTools → Network
   - Try adding patient
   - Click on `/api/patients` request
   - Check Response tab for error details

## 📞 Debug Information to Share

If issue persists, share this info:
- Browser console error
- Network response from `/api/patients`
- Supabase logs
- Output of: `node scripts/test-supabase-connection.js`
