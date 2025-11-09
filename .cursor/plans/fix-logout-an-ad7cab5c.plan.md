<!-- ad7cab5c-57ff-4995-8503-9db2a8e41c3a 9a57334c-dd58-478c-a3a9-f7bfce2fd298 -->
# Fix Access Control Toggle System

## Problem Analysis from Logs

### Critical Issue: PostgREST Schema Cache

```
❌ Role not found in database: super_admin
code: 'PGRST116',
details: 'The result contains 0 rows'
```

**Root Cause**: PostgREST (Supabase's API layer) has a stale schema cache. Even though `super_admin` role EXISTS in database (verified ID: `0b852a34-d811-4f9f-892d-49d970aceb25`), the API cache returns 0 rows.

### Secondary Issues

1. PostgREST PGRST200: encounters.patient_id foreign key not in cache
2. CSS warning: color-adjust deprecation (line 27 in print.css)

---

## How Access Control SHOULD Work

### Complete Flow:

```
1. User loads page → Frontend fetches permissions via GET /api/access-control?role=super_admin
   ↓
2. Backend queries: SELECT id, name FROM roles WHERE name = 'super_admin'
   ↓
3. PostgREST returns role data (CURRENTLY FAILING HERE - returns 0 rows)
   ↓
4. Backend queries role_permissions table with role_id
   ↓
5. Frontend displays toggles in correct states
   ↓
6. User clicks toggle → POST /api/access-control
   ↓
7. Backend: Lookup role → Lookup permission → INSERT/DELETE from role_permissions
   ↓
8. Frontend updates UI only on success
```

**Current Failure Point**: Step 3 - PostgREST cache returns empty result

---

## Fix Plan

### Step 1: Reload PostgREST Schema Cache

**File**: Create new script `scripts/reload-postgrest-cache.js`

**Action**: Use Supabase Admin API to reload schema cache

```javascript
// Force PostgREST to reload its schema cache
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Method 1: Run NOTIFY command
await supabase.rpc('pgrst_watch', { event: 'reload schema' })

// Method 2: If above fails, use direct SQL
await supabase.from('pg_database').select('*').limit(1) // Forces cache refresh
```

**Why**: PostgREST caches schema and doesn't auto-refresh after migrations

---

### Step 2: Fix API to Use Direct Supabase Client

**File**: `app/api/access-control/route.ts`

**Issue**: Currently using `createAuthenticatedClient()` which goes through PostgREST cache

**Change**: Add fallback to bypass cache for critical queries

```typescript
// Current (line 192-196):
const { data: roleData, error: roleError } = await supabase
  .from('roles')
  .select('id, name')
  .eq('name', roleName)
  .single()

// Add fallback with raw SQL if PostgREST fails:
if (roleError?.code === 'PGRST116') {
  // Bypass PostgREST cache with direct SQL
  const { data, error } = await supabase.rpc('get_role_by_name', { role_name: roleName })
  if (!error && data) {
    roleData = data
    roleError = null
  }
}
```

**Create Database Function** (via migration):

```sql
CREATE OR REPLACE FUNCTION get_role_by_name(role_name TEXT)
RETURNS TABLE (id UUID, name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name FROM roles r WHERE r.name = role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Step 3: Force Schema Cache Reload via Migration

**File**: Create migration `fix_postgrest_cache_reload.sql`

**Action**: Send NOTIFY to PostgREST and verify tables

```sql
-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify roles table is accessible
SELECT COUNT(*) FROM roles;

-- Verify role_permissions table is accessible  
SELECT COUNT(*) FROM role_permissions;

-- Grant explicit permissions to authenticated role
GRANT SELECT, INSERT, DELETE ON role_permissions TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;
```

**Why**: Ensures PostgREST knows about schema changes and has correct permissions

---

### Step 4: Fix CSS Warning (Quick Win)

**File**: `styles/print.css` line 27

**Current**:

```css
color-adjust: exact !important;
```

**Change to**:

```css
print-color-adjust: exact !important;
```

**Note**: Must also clear `.next` cache and restart dev server for webpack to pick up change

---

### Step 5: Alternative - Use Service Role Key Directly

**File**: `lib/supabase/server.ts`

**Add new function**:

```typescript
// Use service role to bypass PostgREST for admin operations
export const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}
```

**Then in** `app/api/access-control/route.ts`:

```typescript
// For role lookup, use service client to bypass cache
const serviceClient = createServiceClient()
const { data: roleData } = await serviceClient
  .from('roles')
  .select('id, name')
  .eq('name', roleName)
  .single()
```

**Why**: Service role bypasses RLS and uses fresher cache

---

## Execution Order

1. **Reload PostgREST cache** (script + migration)
2. **Fix CSS warning** and clear cache
3. **Add database function** for direct role lookup
4. **Update API** to use service client or fallback
5. **Restart dev server** (kill all ports, clear .next)
6. **Test toggle** - should work immediately

---

## Testing Checklist

After fixes:

- [ ] GET /api/access-control?role=super_admin returns 200 (not 404)
- [ ] Console shows "✅ Role found: super_admin ID: ..."
- [ ] Toggle shows correct initial state (ON or OFF)
- [ ] Click toggle → Shows spinner
- [ ] POST /api/access-control returns 200 (not 404)
- [ ] Toggle stays in new position (no revert)
- [ ] Page refresh → Toggle state persists
- [ ] No CSS warnings in build output
- [ ] No PostgREST errors in logs

---

## Expected Results

**Before**:

- ❌ Role not found (PostgREST cache stale)
- ❌ Toggle reverts after click
- ⚠️ CSS deprecation warnings

**After**:

- ✅ Role found (cache reloaded)
- ✅ Toggle stays in position
- ✅ No warnings

---

## Files to Modify

1. `scripts/reload-postgrest-cache.js` (NEW)
2. `supabase/migrations/[timestamp]_fix_postgrest_cache.sql` (NEW)
3. `supabase/migrations/[timestamp]_create_role_lookup_function.sql` (NEW)
4. `lib/supabase/server.ts` (add `createServiceClient`)
5. `app/api/access-control/route.ts` (use service client)
6. `styles/print.css` (line 27 - fix CSS)

Total: 4 new files, 3 modified files

### To-dos

- [ ] Create script to reload PostgREST schema cache
- [ ] Create migration to notify PostgREST and grant permissions
- [ ] Create database function for direct role lookup bypassing cache
- [ ] Add createServiceClient function to lib/supabase/server.ts
- [ ] Update API route to use service client for role lookups
- [ ] Fix CSS deprecation warning in styles/print.css line 27
- [ ] Kill all dev servers, clear .next cache, and restart
- [ ] Test toggle functionality end-to-end