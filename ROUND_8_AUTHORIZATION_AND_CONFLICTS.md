# Round 8 Fixes - Authorization & Improved Conflict Detection

## Overview
Implemented functional authorization checks (ownership-based) and significantly improved appointment conflict detection with proper interval overlap logic. Still requires database-level constraints for production.

---

## ✅ Appointments API Route (`/app/api/appointments/route.ts`)

### 1. **Conflict Check - Interval Overlap Logic**
**Issue:** Previous check only compared exact appointment_time, missing duration overlaps.

**Fix - Proper Interval Overlap Detection:**
```typescript
// Calculate time range for new appointment
const appointmentDuration = duration_minutes || 30
const newStartTime = appointment_time

// Parse time and calculate end time
const [hours, minutes] = newStartTime.split(':').map(Number)
const startMinutes = hours * 60 + minutes
const endMinutes = startMinutes + appointmentDuration
const endHours = Math.floor(endMinutes / 60)
const endMins = endMinutes % 60
const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`

// Check all existing appointments for overlaps
for (const existing of conflictingAppointments) {
  const existingDuration = existing.duration_minutes || 30
  const [exHours, exMinutes] = existing.appointment_time.split(':').map(Number)
  const existingStartMinutes = exHours * 60 + exMinutes
  const existingEndMinutes = existingStartMinutes + existingDuration

  // Overlap detection: (newStart < existingEnd && newEnd > existingStart)
  if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
    return NextResponse.json({
      error: `Doctor has a conflicting appointment from ${existing.appointment_time} (conflicts with requested ${newStartTime}-${newEndTime})`,
      conflict: true,
      existingAppointment: {
        time: existing.appointment_time,
        duration: existingDuration
      }
    }, { status: 409 })
  }
}
```

**Improvements:**
- ✅ Properly calculates time intervals
- ✅ Detects overlaps even with different durations
- ✅ Provides detailed error messages with conflicting times
- ⚠️ Still has TOCTOU vulnerability (requires DB constraint)

**Examples of detected overlaps:**
- New: 09:00-09:30, Existing: 09:15-09:45 → Conflict detected ✅
- New: 09:00-10:00, Existing: 09:30-10:00 → Conflict detected ✅
- New: 09:30-10:00, Existing: 09:00-09:45 → Conflict detected ✅
- New: 09:00-09:30, Existing: 10:00-10:30 → No conflict ✅

---

## ✅ Appointments API - [id] Route (`/app/api/appointments/[id]/route.ts`)

### 2. **GET Handler - Ownership-Based Authorization**
**Issue:** Any authenticated user could view any appointment.

**Fix:**
```typescript
// Authorization check: Check if user has access to this appointment
const isAuthorized = 
  appointment.created_by === session.user.id ||
  appointment.patient_id === session.user.id ||
  appointment.doctor_id === session.user.id

if (!isAuthorized) {
  return NextResponse.json({ 
    error: 'Forbidden: You do not have permission to view this appointment' 
  }, { status: 403 })
}
```

**Access Rules:**
- ✅ Creator can view
- ✅ Patient can view their own appointment
- ✅ Doctor can view their own appointment
- ❌ Other users cannot view (403 Forbidden)
- TODO: Add admin/staff role bypass

### 3. **PUT Handler - Ownership-Based Authorization**
**Issue:** Any authenticated user could update any appointment.

**Fix:**
```typescript
// Authorization check - fetch appointment first
const { data: existingAppointment, error: fetchError } = await supabase
  .from('appointments')
  .select('id, patient_id, doctor_id, created_by, status')
  .eq('id', id)
  .single()

// Check authorization - user must be creator, patient, doctor, or admin
const isAuthorized = 
  existingAppointment.created_by === session.user.id ||
  existingAppointment.patient_id === session.user.id ||
  existingAppointment.doctor_id === session.user.id

if (!isAuthorized) {
  return NextResponse.json({ 
    error: 'Forbidden: You do not have permission to update this appointment' 
  }, { status: 403 })
}
```

**Benefits:**
- ✅ Fetch-then-check pattern
- ✅ Prevents unauthorized updates
- ✅ Clear error messages
- TODO: Add admin/staff role bypass

### 4. **DELETE Handler - Enhanced Validation & Authorization**
**Issue:** Missing validation for cancellation eligibility, no authorization.

**Fix - Complete Validation:**
```typescript
// Fetch with all needed fields
const { data: currentAppointment, error: fetchError } = await supabase
  .from('appointments')
  .select('id, status, appointment_date, appointment_time, patient_id, doctor_id, created_by')
  .eq('id', id)
  .single()

// Check if already cancelled
if (currentAppointment.status === 'cancelled') {
  return NextResponse.json({ 
    error: 'Appointment is already cancelled',
    data: currentAppointment
  }, { status: 400 })
}

// Check if appointment is completed
if (currentAppointment.status === 'completed') {
  return NextResponse.json({ 
    error: 'Cannot cancel a completed appointment',
    data: currentAppointment
  }, { status: 400 })
}

// Authorization check
const isAuthorized = 
  currentAppointment.created_by === session.user.id ||
  currentAppointment.patient_id === session.user.id ||
  currentAppointment.doctor_id === session.user.id

if (!isAuthorized) {
  return NextResponse.json({ 
    error: 'Forbidden: You do not have permission to cancel this appointment' 
  }, { status: 403 })
}

// Check if appointment is in the past
const appointmentDateTime = new Date(`${currentAppointment.appointment_date}T${currentAppointment.appointment_time}`)
const now = new Date()
if (appointmentDateTime < now) {
  return NextResponse.json({ 
    error: 'Cannot cancel a past appointment',
    appointmentDate: currentAppointment.appointment_date,
    appointmentTime: currentAppointment.appointment_time
  }, { status: 400 })
}
```

**Validations Added:**
- ✅ Already cancelled check (idempotency)
- ✅ Completed status check
- ✅ Authorization check (ownership)
- ✅ Past appointment check
- ✅ Clear error messages with context

---

## ✅ Cases API - [id] Route (`/app/api/cases/[id]/route.ts`)

### 5. **PUT Handler - Ownership-Based Authorization**
**Issue:** Prefetch was inefficient, redundant null check, no actual authorization.

**Fix:**
```typescript
// Authorization check - fetch case first (only fields needed for authorization)
const { data: existingCase, error: fetchError } = await supabase
  .from('encounters')
  .select('created_by')  // Only fetch what's needed
  .eq('id', id)
  .single()

// Check authorization - user must own the case or have appropriate role
// TODO: Also check for admin role or assigned doctor role
if (existingCase.created_by !== session.user.id) {
  return NextResponse.json({ 
    error: 'Forbidden: You do not have permission to update this case' 
  }, { status: 403 })
}
```

**Improvements:**
- ✅ Only fetches needed field (created_by)
- ✅ Removed redundant null check (.single() throws PGRST116 if not found)
- ✅ Actually enforces authorization (not just TODO)
- ✅ Clear error message
- TODO: Add admin/assigned doctor checks

---

## 📊 Authorization Summary

### Implementation Status

**Appointments:**
- ✅ GET: Ownership check (creator, patient, doctor)
- ✅ PUT: Ownership check (creator, patient, doctor)
- ✅ DELETE: Ownership check + validation (creator, patient, doctor)

**Cases:**
- ✅ PUT: Ownership check (creator)

**Patients, Master-Data, Employees, Invoices:**
- ⚠️ Still scaffolded only (see previous rounds)

### Authorization Model (Implemented)

**Ownership-Based Access:**
```typescript
const isAuthorized = 
  resource.created_by === session.user.id ||
  resource.patient_id === session.user.id ||  // For appointments
  resource.doctor_id === session.user.id       // For appointments
```

**Access Matrix:**

| Role | Own Appointments | Others' Appointments | Own Cases | Others' Cases |
|------|------------------|---------------------|-----------|--------------|
| Creator | ✅ View/Edit/Delete | ❌ | ✅ Edit | ❌ |
| Patient | ✅ View/Edit/Delete | ❌ | N/A | N/A |
| Doctor | ✅ View/Edit/Delete | ❌ | N/A | N/A |
| Admin | TODO: Full access | TODO: Full access | TODO: Full access | TODO: Full access |

---

## ⚠️ Remaining Limitations

### 1. **TOCTOU Race Condition - Still Exists**
**Status:** Application-layer check only, not production-ready

Even with improved interval overlap logic, concurrent requests can still create conflicts because:
1. Time gap exists between check and insert (~50-200ms)
2. No database-level constraint

**Required for Production:**
```sql
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
```

### 2. **Role-Based Access Control - Not Implemented**
**Current:** Ownership-based only  
**Needed:** Admin and staff roles can bypass ownership checks

**TODO:**
```typescript
// Check for admin/staff roles
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', session.user.id)
  .single()

const isAdmin = userRole?.role === 'admin'
const isStaff = ['doctor', 'nurse', 'receptionist'].includes(userRole?.role)

const isAuthorized = isAdmin || isStaff || (/* ownership checks */)
```

### 3. **Database-Level Authorization - Not Implemented**
**Recommendation:** Use Supabase Row Level Security (RLS) policies

**Example RLS Policy:**
```sql
CREATE POLICY "Users can view own appointments or assigned appointments"
ON appointments FOR SELECT
USING (
  auth.uid() = created_by OR
  auth.uid() = patient_id OR
  auth.uid() = doctor_id
);
```

---

## 📝 Build Status

✅ **All TypeScript compilation passes**  
✅ **All ESLint checks pass** (1 pre-existing warning in unrelated file)  
✅ **All pages build successfully**  
✅ **Zero breaking changes**  
✅ **Authorization functional (ownership-based)**  

---

## 📈 Combined Total (All 8 Rounds)

- **Total Issues Fixed:** 94+ across 8 rounds
- **Dashboard Pages Secured:** 6
- **API Routes Secured:** 7
- **Authorization:** Partially implemented (ownership-based)
- **Conflict Detection:** Significantly improved (interval overlaps)
- **Input Validation:** Comprehensive
- **Build Status:** ✅ Passing

---

## 🎯 Next Steps for Production

### Critical (Blocking)
1. **Database Exclusion Constraint** for appointments
2. **Role-Based Access Control** (admin/staff roles)
3. **Backend Array Parameters** (multi-select filters)
4. **Aggregate Metrics APIs** (correct dashboard data)

### High Priority
5. Row Level Security (RLS) policies
6. Integration tests for authorization
7. Concurrent appointment creation tests

### Medium Priority
8. Extend authorization to all resources
9. Audit trail for authorization failures
10. Performance optimization for conflict checks

---

**Generated:** December 2024  
**Priority:** Authorization & Data Integrity  
**Issues Fixed (Round 8):** 5 critical issues  
**Build Status:** ✅ Passing  
**Authorization:** ⚠️ Partial (ownership-based, needs RBAC)  
**Conflict Detection:** ⚠️ Improved but still has TOCTOU
