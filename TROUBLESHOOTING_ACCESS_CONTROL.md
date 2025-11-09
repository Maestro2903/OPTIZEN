# Troubleshooting Access Control Toggles

You're logged in as Super Admin but can't toggle the access switches. Let's debug this step by step.

## Step 1: Open Browser Console

1. Press **F12** (or Cmd+Option+I on Mac)
2. Go to the **Console** tab
3. Keep it open while you try to toggle a switch

## Step 2: Check What's Happening

When you click a toggle switch, you should see these console logs:

```
✅ Expected logs:
Toggling permission: { resource: 'patients', action: 'read', currentValue: true, newValue: false }
Permission update result: { success: true, message: '...' }

❌ Or error logs:
Failed to fetch permissions: 401/403 {...}
Failed to update permission: 401/403 {...}
```

## Step 3: Common Issues & Fixes

### Issue 1: Switches are all gray (disabled)
**Cause:** Permissions not loading

**Check:**
1. Look in console for: `Fetched permissions for super_admin : {...}`
2. If you see an error, note what it says

**Fix:**
```bash
# Refresh the page
# If still broken, check if you're really logged in as super_admin
```

### Issue 2: Switches don't respond to clicks
**Cause:** `updating` state is stuck or switch is disabled

**Check:**
1. Open React DevTools
2. Find the AccessControlPage component
3. Check if `updating` is `true`

**Fix:**
```bash
# Refresh the page
```

### Issue 3: Toggle works but immediately reverts
**Cause:** API call is failing

**Check console for:**
```
Failed to update permission: 404 Permission not found
Failed to update permission: 403 Forbidden
```

**Fix Option A - Check your role:**
```sql
SELECT email, role::text FROM users WHERE email = 'superadmin@eyecare.local';
-- Should return: role = 'super_admin' (exactly this spelling)
```

**Fix Option B - Check permissions exist:**
```sql
-- Check if the permission exists in database
SELECT * FROM permissions WHERE action = 'read' AND resource = 'patients';

-- Check if you have role_permissions
SELECT COUNT(*) FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.name = 'super_admin';
-- Should return a count > 0
```

### Issue 4: 401 Unauthorized Error
**Cause:** Session expired or not properly authenticated

**Fix:**
1. Click the red "Log out" button
2. Log back in with your dev superadmin credentials (see your environment configuration or internal secrets manager)
3. Try again

### Issue 5: 403 Forbidden Error
**Cause:** Not detected as super_admin

**Fix:**
```sql
-- Verify your user record
SELECT id, email, role::text, is_active 
FROM users 
WHERE email = 'superadmin@eyecare.local';

-- Should show:
-- role: 'super_admin' (not 'admin', not 'super-admin')
-- is_active: true

-- If wrong, fix it:
UPDATE users 
SET role = 'super_admin', is_active = true 
WHERE email = 'superadmin@eyecare.local';
```

### Issue 6: Network Error
**Cause:** API endpoint not responding

**Check:**
1. Open Network tab in DevTools
2. Try to toggle a switch
3. Look for requests to `/api/access-control`
4. Click on the request to see details

**Common causes:**
- Server not running
- CORS issues
- Route not found

## Step 4: Manual Test

Try this in the browser console while on the Access Control page:

```javascript
// Test if you can call the API directly
fetch('/api/access-control?role=doctor')
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
  .catch(e => console.error('API Error:', e))
```

**Expected result:**
```json
{
  "role": { "id": "...", "name": "doctor", ... },
  "permissions": { "patients": { "read": true, ... }, ... }
}
```

**If you get an error:**
- 401 = Not logged in
- 403 = Not super admin
- 404 = Endpoint not found
- 500 = Server error

## Step 5: Quick Fix Checklist

Run through these:

```bash
# 1. Is the dev server running?
ps aux | grep "next dev"

# 2. Can you access the page?
curl http://localhost:3000/dashboard/access-control
# (Should not return 404)

# 3. Are you logged in?
# Check if you see your name in the sidebar footer

# 4. Are you super_admin?
# Your role badge should say "Super Admin" in yellow
```

## Step 6: Nuclear Option - Hard Reset

If nothing works:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear browser data
# In Chrome: Settings > Privacy > Clear browsing data
# Choose: Cookies and Cached images

# 3. Restart server
npm run dev

# 4. Login again
# Go to http://localhost:3000/auth/login
# Login with your dev superadmin credentials

# 5. Go to Access Control
# Should work now
```

## What to Report

If still broken, send me these details:

1. **Console output** when you click a toggle
2. **Network tab** - screenshot of the failed request
3. **Your role** from this query:
   ```sql
   SELECT email, role::text FROM users WHERE id = 'your-user-id';
   ```
4. **Browser** you're using (Chrome, Firefox, Safari, etc.)
5. **Any error messages** from the console

## Most Likely Cause

Based on your symptoms, the most common issue is:

**The switches show all gray/disabled** = Permissions not loading

**Quick fix:**
1. Open console (F12)
2. Look for error messages when the page loads
3. You'll probably see: `Failed to fetch permissions: 403` or similar
4. Follow the fix for that specific error above

---

**Need more help?** Share your console output and I'll tell you exactly what's wrong.

