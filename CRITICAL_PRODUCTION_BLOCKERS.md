# Critical Production Blockers

## 🚨 BLOCKING ISSUES - Must Fix Before Production

### 1. **TOCTOU Race Condition - Appointment Conflicts**
**Status:** ⚠️ BLOCKING - Not Production Ready  
**Location:** `app/api/appointments/route.ts` (lines 154-181)  
**Severity:** Critical

**Issue:**
Current implementation only has application-layer checks for appointment conflicts. Multiple concurrent requests can still create overlapping appointments for the same doctor at the same time.

**Current State (Partial Fix):**
```typescript
// Per-doctor conflict check (application layer only)
const { data: existingAppointment } = await supabase
  .from('appointments')
  .select('id')
  .eq('doctor_id', doctor_id)
  .gte('appointment_date', startDateTime)
  .lte('appointment_date', endDateTime)
  .neq('status', 'cancelled')
  .maybeSingle()
```

**Problem:** Time gap between check and insert allows race conditions.

**Required Fix (Database Level):**
```sql
-- Option 1: Exclusion Constraint (PostgreSQL)
ALTER TABLE appointments 
ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING gist (
  doctor_id WITH =,
  tsrange(
    (appointment_date::timestamp + appointment_time::time),
    (appointment_date::timestamp + appointment_time::time + (duration_minutes || ' minutes')::interval)
  ) WITH &&
)
WHERE (status != 'cancelled');

-- Option 2: Unique Partial Index
CREATE UNIQUE INDEX unique_active_appointments 
ON appointments (doctor_id, appointment_date, appointment_time)
WHERE status != 'cancelled';
```

**Action Items:**
- [ ] Create migration with exclusion constraint or unique index
- [ ] Test concurrent appointment creation
- [ ] Update API error handling for constraint violations
- [ ] Remove application-layer check or keep as optimization

**Owner:** Backend Team  
**ETA:** Before Production Deployment  
**Risk:** Data integrity violation, double-booking doctors

---

### 2. **Backend Array Parameter Handling**
**Status:** ⚠️ BLOCKING - Silent Failures  
**Location:** Multiple API routes  
**Severity:** High

**Issue:**
Frontend sends array values for multi-select filters (e.g., `status=['pending','completed']`), but backend doesn't handle arrays. Filters silently fail or use last value only.

**Affected Routes:**
- `app/api/appointments/route.ts` - status filter
- `app/api/patients/route.ts` - gender, status filters  
- `app/api/invoices/route.ts` - status, payment_status filters
- `app/api/employees/route.ts` - role, department, status filters
- `app/api/attendance/route.ts` - status filter

**Current State:**
```typescript
// Frontend sends
filterParams.status = ['pending', 'completed']

// Backend receives as string or comma-separated
const status = searchParams.get('status') // "pending" or "pending,completed"
```

**Required Fix:**
```typescript
// Backend must handle arrays
const status = searchParams.get('status') || ''
let statusArray: string[] = []

if (status) {
  // Parse comma-separated or array
  statusArray = status.includes(',') ? status.split(',') : [status]
  
  // Validate each status
  const allowedStatuses = ['pending', 'completed', 'cancelled']
  statusArray = statusArray.filter(s => allowedStatuses.includes(s.trim()))
}

// Apply OR-style filtering
if (statusArray.length > 0) {
  query = query.in('status', statusArray)
}
```

**Action Items:**
- [ ] Update all GET handlers to parse array parameters
- [ ] Add validation for array values
- [ ] Use `.in()` for OR-style filtering
- [ ] Update API documentation
- [ ] Add tests for multi-value filters

**Owner:** Backend Team  
**ETA:** Before Production Deployment  
**Risk:** Filters don't work, confusing UX

---

### 3. **Authorization Implementation**
**Status:** ⚠️ SCAFFOLDED ONLY - Not Implemented  
**Location:** All API routes with TODO comments  
**Severity:** Critical Security Risk

**Issue:**
Authorization checks are scaffolded with TODO comments but not implemented. Any authenticated user can:
- View/edit/delete any patient
- View/edit/delete any appointment  
- View/edit/delete any case
- Edit/delete master data
- Delete employees

**Current State:**
```typescript
// Authorization check
// TODO: Implement patient access control (ownership or assigned provider)
// For now, any authenticated user can view patients (add RBAC when available)
```

**Required Implementation:**
1. **Create user_roles table:**
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(50) NOT NULL, -- 'admin', 'doctor', 'nurse', 'receptionist'
  permissions JSONB, -- { can_edit_master_data: true, can_delete_patients: false }
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Implement ownership checks:**
```typescript
// Example for patients
const { data: access } = await supabase
  .from('patients')
  .select('id')
  .eq('id', id)
  .or(`owner_id.eq.${session.user.id},assigned_provider.eq.${session.user.id}`)
  .single()

if (!access) {
  return NextResponse.json({ 
    error: 'Forbidden: You do not have access to this patient' 
  }, { status: 403 })
}
```

3. **Implement role checks:**
```typescript
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role, permissions')
  .eq('user_id', session.user.id)
  .single()

if (userRole?.role !== 'admin' && !userRole?.permissions?.can_edit_master_data) {
  return NextResponse.json({ 
    error: 'Forbidden: Insufficient permissions' 
  }, { status: 403 })
}
```

**Action Items:**
- [ ] Design RBAC schema (roles, permissions)
- [ ] Create migrations for user_roles table
- [ ] Implement role/permission checks in all handlers
- [ ] Add unit tests for authorization
- [ ] Add ownership fields to resources (owner_id, assigned_provider)

**Owner:** Backend Team  
**ETA:** Before Production Deployment  
**Risk:** Data breach, unauthorized access, HIPAA violations

---

## ⚠️ HIGH PRIORITY - Should Fix Before Production

### 4. **Aggregate Metrics APIs**
**Status:** Missing - Incorrect Data Displayed  
**Location:** Dashboard pages  
**Severity:** High (UX Bug)

**Issue:**
Dashboard metrics (revenue, counts, statistics) are calculated from current page only, not global totals.

**Examples:**
- Billing: "Total Revenue" only sums 50 invoices on current page
- Appointments: "Total Today" only counts appointments on current page
- Cases: "Active Cases" only counts cases on current page

**Required APIs:**
```typescript
// GET /api/invoices/metrics
{
  totalRevenue: 150000,
  paidAmount: 120000,
  pendingAmount: 30000,
  invoiceCount: 450
}

// GET /api/appointments/metrics?date=2024-12-08
{
  total_today: 25,
  total_completed: 18,
  total_pending: 7,
  total_cancelled: 0
}

// GET /api/cases/metrics
{
  total: 150,
  active: 45,
  closed: 105
}
```

**Action Items:**
- [ ] Create dedicated metrics endpoints
- [ ] Use database aggregation (SUM, COUNT)
- [ ] Add caching for performance
- [ ] Update frontend to fetch from metrics APIs

**Owner:** Backend Team  
**ETA:** Before Production Deployment  
**Risk:** Misleading financial/operational data

---

### 5. **Pharmacy Low Stock Filter**
**Status:** Not Working - PostgREST Limitation  
**Location:** `app/api/pharmacy/route.ts` (lines 72-76)  
**Severity:** Medium

**Issue:**
`.lt('current_stock', 'reorder_level')` doesn't work because PostgREST treats second argument as literal string, not column reference.

**Current Workaround:**
```typescript
// TODO: Create a computed field or database view for is_low_stock
// For now, fetch and filter in application code when low_stock is requested
```

**Required Fix:**
```sql
-- Option 1: Computed Column
ALTER TABLE pharmacy_items 
ADD COLUMN is_low_stock BOOLEAN 
GENERATED ALWAYS AS (current_stock < reorder_level) STORED;

-- Then filter on it
query = query.eq('is_low_stock', true)

-- Option 2: Database View
CREATE VIEW pharmacy_low_stock AS
SELECT *, (current_stock < reorder_level) as is_low_stock
FROM pharmacy_items;

-- Option 3: PostgreSQL Function
CREATE FUNCTION get_low_stock_items()
RETURNS SETOF pharmacy_items AS $$
  SELECT * FROM pharmacy_items WHERE current_stock < reorder_level;
$$ LANGUAGE SQL;
```

**Action Items:**
- [ ] Choose approach (computed column recommended)
- [ ] Create migration
- [ ] Update API to use computed field
- [ ] Test low stock filter

**Owner:** Backend Team  
**ETA:** Sprint 2  
**Risk:** Low stock alerts don't work

---

### 6. **Client-Side ID Generation**
**Status:** Collision Risk  
**Location:** Multiple pages  
**Severity:** Medium

**Affected:**
- Cases: `OPT${year}${timestamp}-${randomSuffix}`
- Patients: `PAT-${timestamp}-${randomSuffix}` 
- Invoices: `INV-${timestamp}-${randomSuffix}`

**Issue:**
Client-side generation with `Date.now()` + random suffix can still collide under:
- Multiple tabs
- Multiple users
- Clock skew
- Random collision (birthday paradox)

**Recommended Fix:**
```typescript
// Backend generates IDs
// Option 1: UUID with prefix
const id = `PAT-${crypto.randomUUID()}`

// Option 2: Database sequence
CREATE SEQUENCE patient_id_seq START 1000;
const id = `PAT-${nextval('patient_id_seq')}`

// Option 3: Snowflake ID (timestamp + machine + sequence)
```

**Action Items:**
- [ ] Move ID generation to backend
- [ ] Update POST handlers to return generated ID
- [ ] Update frontend to use returned ID
- [ ] Add unique constraints in database

**Owner:** Backend Team  
**ETA:** Sprint 2  
**Risk:** ID collisions, data integrity issues

---

## 📋 MEDIUM PRIORITY - Post-Launch

### 7. **Filter Count Accuracy**
All filter counts show current page only. Solutions:
1. Remove counts entirely ✅ (Appointments - already done)
2. Label as "on this page" (Attendance - already done)
3. Fetch from API (recommended for production)

### 8. **Migration Idempotency**
`supabase/migrations/005_master_data.sql` needs:
```sql
INSERT INTO master_data (...) VALUES (...)
ON CONFLICT (category, name) DO NOTHING;
```

### 9. **Foreign Key ON DELETE**
`master_data.created_by` needs:
```sql
ON DELETE SET NULL
```

---

## 🔍 Documentation Corrections

### UUID Regex
**Docs:** Show incorrect pattern (8-4-4-12)  
**Code:** ✅ Correct pattern (8-4-4-4-12)  
**Action:** Update ROUND_6_FINAL_API_FIXES.md lines 194, 225, 285

### Authorization Status
**Current:** ✅ Authorization framework (all handlers)  
**Actual:** ⚠️ Authorization framework scaffolded (TODO only)  
**Action:** Update all round summaries to clarify scaffolded vs implemented

### TOCTOU Status
**Current:** ✅ Per-doctor conflict checks  
**Actual:** ⚠️ Application-layer only, race condition still exists  
**Action:** Mark as BLOCKING in ROUND_4_FIXES_SUMMARY.md

---

**Last Updated:** December 2024  
**Review Frequency:** Before each deployment  
**Approval Required:** Tech Lead + Security Team
