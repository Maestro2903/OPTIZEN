# Patient Creation Issue - Diagnostic Guide

## Issue Identified
The API is returning **"Unauthorized"** which means authentication is required to create patients.

## Root Causes & Solutions

### 1. ✅ Not Logged In
**Symptoms:** 
- "Unauthorized" error when trying to add patients
- Redirected to login page

**Solution:**
1. Go to http://localhost:3001/auth/login
2. Log in with valid Supabase credentials
3. Try adding a patient again

### 2. ✅ Session Expired
**Symptoms:**
- Was able to add patients before, but now get "Unauthorized"
- Page loads but API calls fail

**Solution:**
1. Log out and log in again
2. Check browser console for authentication errors
3. Clear cookies and try again

### 3. ⚙️ Supabase Database Not Set Up
**Symptoms:**
- Able to log in, but patients table doesn't exist
- "relation does not exist" error

**Solution:**
Run the database migrations:

```bash
# Navigate to Supabase Dashboard
# https://supabase.com/dashboard/project/wtrkwqagxphqkwmtbhtd

# Go to SQL Editor and run these migrations in order:
# 1. Create patients table (from migrations folder)
# 2. Apply RLS policies
# 3. Apply seed data
```

### 4. 🔐 RLS Policies Not Set Up
**Symptoms:**
- Can log in, but API returns error
- "insufficient privileges" or permission denied

**Solution:**
Enable Row Level Security (RLS) and add policies:

```sql
-- Enable RLS on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all patients
CREATE POLICY "Authenticated users can view patients" 
ON patients FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Authenticated users can insert patients
CREATE POLICY "Authenticated users can create patients" 
ON patients FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Authenticated users can update patients
CREATE POLICY "Authenticated users can update patients" 
ON patients FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
```

## Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and check:
1. **Console tab** - Look for errors
2. **Network tab** - Check `/api/patients` request
   - Status Code: Should be 201 (Created), not 401 (Unauthorized)
   - Response: Look at error message

### Step 2: Test Authentication
```bash
# Check if you're logged in
# Open browser console and run:
document.cookie

# Should see something like:
# "sb-access-token=...; sb-refresh-token=..."
```

### Step 3: Test API Directly
```bash
# Get your access token from browser DevTools > Application > Cookies
# Copy the value of 'sb-access-token'

curl -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "patient_id": "PAT-TEST-001",
    "full_name": "Test Patient",
    "mobile": "9876543210",
    "gender": "male",
    "state": "Gujarat",
    "status": "active"
  }'
```

### Step 4: Check Database Tables
Verify the `patients` table exists in Supabase:

1. Go to https://supabase.com/dashboard/project/wtrkwqagxphqkwmtbhtd
2. Click "Table Editor"
3. Look for "patients" table
4. If missing, run the migrations

## Quick Fix Checklist

- [ ] Am I logged in to the application?
- [ ] Is my session still valid? (Try logging out and in)
- [ ] Does the `patients` table exist in Supabase?
- [ ] Are RLS policies configured correctly?
- [ ] Do I see any errors in browser console?
- [ ] Is the dev server running on port 3001?

## Testing Patient Creation

Once logged in, try adding a patient with these details:

- **Full Name:** Test Patient
- **Mobile:** 9876543210  
- **Gender:** Male
- **State:** Gujarat
- **Status:** Active

The system will automatically generate a unique Patient ID.

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `Unauthorized` | Not logged in | Log in first |
| `Missing required fields` | Form validation failed | Fill all required fields |
| `Patient ID already exists` | Duplicate patient_id | System generates unique ID - check form |
| `Failed to create patient` | Database error | Check Supabase logs |
| `relation "patients" does not exist` | Table not created | Run migrations |

## Need More Help?

If the issue persists:
1. Check Supabase Dashboard > Logs for detailed errors
2. Share the error from browser console
3. Verify your Supabase project is active
