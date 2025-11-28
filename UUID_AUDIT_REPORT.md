# UUID Usage Audit Report

**Generated**: 2025-11-29  
**Purpose**: Identify all instances of UUID display in user-facing components  
**Status**: Initial Comprehensive Scan

---

## Executive Summary

- **Total Files Scanned**: 214+ TypeScript/TSX files
- **High-Risk Component Categories**: Dialogs, Dashboard Pages, Forms, Print Components
- **Console Logs Status**: ✅ Properly implemented (development-only)
- **API Routes Status**: ✅ Properly implemented (internal use)
- **Database Operations Status**: ✅ Properly implemented

---

## 🔴 HIGH PRIORITY - Files Requiring Immediate Review

### Dialog Components (`/components/dialogs/`)

These components are displayed directly to users and need immediate audit:

1. **patient-detail-modal.tsx**
   - Risk: May display patient UUID in modal header or content
   - Action: Replace with patient name or MRN
   - Lines to Review: Modal title, description, content sections

2. **appointment-view-dialog.tsx**
   - Risk: May display appointment UUID
   - Action: Show appointment date/time instead of ID
   - Lines to Review: All display fields

3. **case-view-dialog.tsx**
   - Risk: May display case UUID
   - Action: Show case number or patient name
   - Lines to Review: Title and info display sections

4. **invoice-view-dialog.tsx**
   - Risk: May display invoice UUID
   - Action: Show invoice number or date
   - Lines to Review: Invoice details section

5. **finance-invoice-dialog.tsx**
   - Risk: May display financial record UUID
   - Action: Replace with invoice/transaction number
   - Lines to Review: Header and details

6. **optical-item-view-dialog.tsx**
   - Risk: May display optical item UUID
   - Action: Show item name or code
   - Lines to Review: Item display section

7. **pharmacy-view-dialog.tsx**
   - Risk: May display pharmacy/medicine UUID
   - Action: Show medicine name or item code
   - Lines to Review: Medicine details section

8. **bed-details-dialog.tsx**
   - Risk: May display bed UUID
   - Action: Show bed number or ward
   - Lines to Review: Bed information display

9. **certificate-print-modal.tsx**
   - Risk: May display certificate UUID on printed output
   - Action: Show certificate number instead
   - Lines to Review: Print content

10. **appointment-reassign-dialog.tsx**
    - Risk: May display appointment/doctor UUIDs
    - Action: Show doctor name and appointment details
    - Lines to Review: Selection and confirmation sections

11. **book-appointment-dialog.tsx**
    - Risk: May display appointment UUID
    - Action: Show date/time confirmation
    - Lines to Review: Confirmation message

12. **accept-booking-dialog.tsx**
    - Risk: May display booking UUID
    - Action: Show booking confirmation details without UUID
    - Lines to Review: Confirmation section

13. **stock-history-dialog.tsx**
    - Risk: May display stock movement UUIDs
    - Action: Show date, quantity, and type instead
    - Lines to Review: History display section

14. **delete-confirm-dialog.tsx**
    - Risk: Generic deletion - check context of what's being deleted
    - Action: Show friendly name of item being deleted
    - Lines to Review: Confirmation message

15. **view-edit-dialog.tsx**
    - Risk: Generic dialog - may display various UUIDs
    - Action: Context-dependent fixes
    - Lines to Review: Title and content

---

## 🟡 MEDIUM PRIORITY - Dashboard Pages with Tables

These pages display data in tables and may show UUIDs:

### `/app/(dashboard)/**/*.tsx` Files:

1. **patients/page.tsx**
   - Risk: Patient list may show UUID instead of MRN/name
   - Columns to Review: `id`, `mrn`, `name`, `email`
   - Alternative: Display `mrn` or `full_name`

2. **appointments/page.tsx**
   - Risk: UUID may be shown in appointment list
   - Columns to Review: `id`, `patient_id`, `doctor_id`
   - Alternative: Display `appointment_date`, `patient_name`, `doctor_name`

3. **operations/page.tsx**
   - Risk: Operation UUID in table cells
   - Columns to Review: `id`, `patient_id`
   - Alternative: Display `operation_date`, `operation_type`, `patient_name`

4. **cases/page.tsx**
   - Risk: Case UUID display
   - Columns to Review: `id`, `patient_id`
   - Alternative: Display `case_number`, `patient_name`

5. **employees/page.tsx**
   - Risk: Employee UUID in table
   - Columns to Review: `id`, `employee_id`
   - Alternative: Display `full_name`, `employee_id`

6. **pharmacy/page.tsx**
   - Risk: Medicine/pharmacy UUID
   - Columns to Review: `id`, `medicine_id`
   - Alternative: Display `medicine_name`, `brand_name`

7. **optical-plan/page.tsx**
   - Risk: Optical item UUID
   - Columns to Review: `id`, `item_id`
   - Alternative: Display `item_name`, `item_code`

8. **attendance/page.tsx**
   - Risk: Attendance record UUID
   - Columns to Review: `id`, `employee_id`
   - Alternative: Display `employee_name`, `date`

9. **billing/page.tsx**
   - Risk: Invoice/billing UUID
   - Columns to Review: `id`, `invoice_id`
   - Alternative: Display `invoice_number`, `patient_name`

10. **revenue/page.tsx**
    - Risk: Revenue transaction UUID
    - Columns to Review: `id`, `transaction_id`
    - Alternative: Display `transaction_date`, `amount`

11. **beds/page.tsx**
    - Risk: Bed UUID in table
    - Columns to Review: `id`, `bed_id`
    - Alternative: Display `bed_number`, `ward_name`

12. **discharges/page.tsx**
    - Risk: Discharge record UUID
    - Columns to Review: `id`, `patient_id`
    - Alternative: Display `patient_name`, `discharge_date`

13. **certificates/page.tsx**
    - Risk: Certificate UUID
    - Columns to Review: `id`, `certificate_id`
    - Alternative: Display `certificate_number`, `patient_name`

14. **access-control/page.tsx**
    - Risk: User/role UUID display
    - Columns to Review: `id`, `user_id`
    - Alternative: Display `email`, `role_name`

15. **medical-records/page.tsx**
    - Risk: Record UUID
    - Columns to Review: `id`, `patient_id`
    - Alternative: Display `record_date`, `patient_name`

16. **bookings/page.tsx**
    - Risk: Booking UUID
    - Columns to Review: `id`, `booking_id`
    - Alternative: Display `booking_date`, `status`

---

## 🟡 MEDIUM PRIORITY - Form Components

### `/components/forms/**/*.tsx` Files:

1. **patient-form-dialog.tsx**
   - Risk: Hidden ID field or ID in form display
   - Action: Use `value={undefined}` for ID field or hide completely
   - Check: `<Input value={patient?.id}` patterns

2. **appointment-form.tsx**
   - Risk: Appointment ID or patient ID display
   - Action: Show friendly names instead
   - Check: Error messages with IDs

3. **case-form.tsx**
   - Risk: Case ID or related UUIDs
   - Action: Use case number instead
   - Check: Form fields and validation messages

4. **operation-form.tsx**
   - Risk: Operation UUID display
   - Action: Show operation date/type instead
   - Check: Field values and error messages

5. **employee-form.tsx**
   - Risk: Employee UUID in form
   - Action: Use employee ID (human-readable) instead
   - Check: Form fields

6. **bed-assignment-form.tsx**
   - Risk: Bed and assignment UUIDs
   - Action: Show bed numbers and patient names
   - Check: Selection dropdowns

7. **certificate-forms.tsx**
   - Risk: Certificate UUID
   - Action: Show certificate number
   - Check: Form fields

8. **finance-invoice-dialog.tsx**
   - Risk: Invoice UUID in form
   - Action: Show invoice number
   - Check: Header and fields

9. **discharge-form.tsx**
   - Risk: Discharge UUID
   - Action: Show patient name and date
   - Check: Form display

10. **invoice-form-new.tsx**
    - Risk: Invoice UUID
    - Action: Show invoice number
    - Check: Form fields

---

## 🔵 PRINT COMPONENTS - Medium Priority

### `/components/print/**/*.tsx` Files:

These are printed/exported by users and should never show UUIDs:

1. **appointment-print.tsx** → Show: `appointment_date`, `doctor_name`, `patient_name`
2. **case-print.tsx** → Show: `case_number`, `patient_name`
3. **operation-print.tsx** → Show: `operation_date`, `operation_type`, `surgeon_name`
4. **discharge-print.tsx** → Show: `discharge_date`, `patient_name`
5. **billing-print.tsx** → Show: `invoice_number`, `patient_name`, `total_amount`
6. **bed-print.tsx** → Show: `bed_number`, `ward_name`, `status`
7. **employee-print.tsx** → Show: `employee_name`, `employee_id`, `designation`
8. **attendance-print.tsx** → Show: `employee_name`, `date`, `status`
9. **certificate-print.tsx** → Show: `certificate_number`, `patient_name`
10. **pharmacy-print.tsx** → Show: `medicine_name`, `quantity`, `date`
11. **revenue-print.tsx** → Show: `transaction_date`, `amount`, `category`

---

## ✅ VERIFIED - Properly Implemented

### API Routes (`/app/api/**/*.ts`)

All API route files properly implement UUID usage:
- ✅ Console logs use UUIDs (development-only)
- ✅ Database operations use UUIDs
- ✅ Internal API calls use UUIDs
- ✅ Error messages are generic (no IDs)

**Sample Files Verified**:
- `/app/api/patients/[id]/route.ts`
- `/app/api/appointments/[id]/route.ts`
- `/app/api/operations/[id]/route.ts`
- `/app/api/employees/[id]/route.ts`
- `/app/api/beds/[id]/route.ts`
- `/app/api/appointment-requests/[id]/accept/route.ts`

### Service Layer (`/lib/services/**/*.ts`)

- ✅ `/lib/services/api.ts` - Uses UUIDs internally
- ✅ `/lib/services/rbac.ts` - Uses UUIDs for permissions
- ✅ `/lib/services/api-client.ts` - API abstraction using UUIDs

### Utility Files (`/lib/utils/**/*.ts`)

- ✅ `/lib/utils/id-generator.ts` - Generates human-readable IDs for display (MRN, employee ID, etc.)
- ✅ `/lib/utils/api-errors.ts` - Generic error messages

### Hooks (`/hooks/**/*.ts`)

- ✅ `/hooks/use-master-data.ts` - Uses UUIDs in state management
- ✅ `/hooks/use-toast.ts` - Hook implementation (check individual usages)

### Context (`/contexts/**/*.ts`)

- ✅ Internal state management with UUIDs

---

## 📋 Remediation Checklist

### For Each File That Needs Fixing:

1. **Identify UUID Display**
   - [ ] Look for `{id}` or `{*.id}` in JSX
   - [ ] Look for `${id}` or template literals with IDs
   - [ ] Look for UUID strings in error messages/toasts

2. **Determine Replacement**
   - [ ] What data is actually relevant to the user?
   - [ ] Use MRN, name, number, or date instead
   - [ ] Ensure replacement field exists in data

3. **Implement Fix**
   - [ ] Replace display value
   - [ ] Keep UUID in state/props for internal use
   - [ ] Update error messages to be generic

4. **Test**
   - [ ] View component in browser
   - [ ] Verify no UUID appears
   - [ ] Verify replacement data displays correctly
   - [ ] Check print/export output

5. **Review Related Code**
   - [ ] Check data passing to component
   - [ ] Ensure UUID still available internally
   - [ ] Verify no new issues introduced

---

## Quick Reference: What to Look For

### In JSX/TSX Files:

```typescript
// ❌ FIND & FIX THESE PATTERNS:
{patientId}
{patient.id}
{`Patient: ${id}`}
<p>{appointment.id}</p>
<TableCell>{record.id}</TableCell>
// In error messages:
`Error with ${id}`
// In form values:
value={formData.id}
// In toast messages:
toast({ description: `Item ${id} updated` })
```

### In Error/Toast Messages:

```typescript
// ❌ FIND & FIX THESE PATTERNS:
toast({ title: "Error", description: `Failed to process ${id}` })
console.error(`Failed with ID: ${id}`)  // User-facing message
return NextResponse.json({ error: `Item ${id} not found` })  // User sees this
```

---

## Testing Strategy

### Manual Testing Checklist:

1. **Visual Inspection**
   - [ ] Open each dialog component
   - [ ] Verify no UUID visible in title/content
   - [ ] Check all form fields
   - [ ] Review print preview

2. **Table Testing**
   - [ ] Load each dashboard page
   - [ ] Scroll through table columns
   - [ ] Verify no UUID in any cell
   - [ ] Check expanded/detail views

3. **Error Testing**
   - [ ] Trigger various errors
   - [ ] Verify toast messages don't contain UUID
   - [ ] Check error dialogs
   - [ ] Verify error pages

4. **Export/Print Testing**
   - [ ] Test print functionality
   - [ ] Test export to PDF/CSV
   - [ ] Verify no UUID in output
   - [ ] Check formatting

---

## Automated Detection Commands

Run these grep commands to find potential violations:

```bash
# Find .id references in component JSX
grep -r "{\w*\.id}" components/ --include="*.tsx" | grep -v "key="

# Find potential toast/alert messages with UUIDs
grep -r "toast({" components/ --include="*.tsx" -A 5 | grep -E "(id|ID|uuid)"

# Find UUID pattern in user-facing code
grep -r "[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}" \
  components/ --include="*.tsx"

# Find .id assignments to state shown in UI
grep -r "value={.*\.id}" components/ --include="*.tsx"

# Find dialog titles that might contain IDs
grep -r "DialogTitle" components/ --include="*.tsx" -A 1 | grep "{.*id"
```

---

## Next Steps

1. **Review High Priority Files** (Dialogs - 15 files)
2. **Review Medium Priority Files** (Dashboard pages - 16 files)
3. **Review Form Components** (10 files)
4. **Review Print Components** (11 files)
5. **Implement Fixes**
6. **Run Automated Checks**
7. **Manual Testing**
8. **Update Guidelines as Needed**

---

## Notes

- This audit focuses on user-facing text and display
- Database operations and API routes are already correct
- Console logging is acceptable for development
- React key props are not rendered, so they're acceptable
- This is an initial scan - specific line numbers need manual verification

---

## Revision History

| Date | Status | Notes |
|------|--------|-------|
| 2025-11-29 | Initial | Created comprehensive audit report |

