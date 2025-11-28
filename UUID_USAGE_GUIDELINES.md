# UUID Usage Guidelines

## Overview

This document defines where UUIDs (Universally Unique Identifiers) are acceptable and prohibited in the EYECARE application. UUIDs should remain hidden from end users while being fully utilized in backend operations.

---

## ✅ Acceptable UUID Usage

### 1. **Console Logs (Development Only)**
- **Scope**: Backend API routes and server-side utilities
- **Files**: `/app/api/**/*.ts` files
- **Examples**:
  ```typescript
  console.log('Patient created with ID:', patientId)
  console.error('Error updating operation:', operationId, error)
  console.warn('UUID collision detected:', conflictingId)
  ```
- **Current Status**: ✅ Already properly implemented in API routes
- **Files Using**: 
  - `/app/api/appointment-requests/[id]/accept/route.ts`
  - `/app/api/operations/route.ts`
  - `/app/api/employees/[id]/route.ts`
  - All other API routes with proper console logging

### 2. **Internal API Calls**
- **Scope**: Backend-to-backend communication, service layer calls
- **Files**: 
  - `/lib/services/api.ts`
  - `/lib/services/rbac.ts`
  - `/lib/services/api-client.ts`
  - API route handlers
- **Examples**:
  ```typescript
  const response = await supabase
    .from('patients')
    .select()
    .eq('id', patientId)
  ```
- **Current Status**: ✅ Already properly implemented

### 3. **Database Operations**
- **Scope**: SQL queries, Supabase operations, data fetching
- **Files**:
  - `/lib/services/api.ts`
  - `/app/api/**/*.ts` (API routes)
  - Database migration files in `/supabase/migrations/`
- **Examples**:
  ```typescript
  const { data, error } = await supabase
    .from('cases')
    .select()
    .eq('id', caseId)

  INSERT INTO patients VALUES ('550e8400-e29b-41d4-a716-446655440000', ...)
  ```
- **Current Status**: ✅ Already properly implemented
- **Files Using**:
  - `/app/api/patients/route.ts`
  - `/app/api/appointments/route.ts`
  - `/supabase/migrations/024_add_mock_doctors.sql`
  - All other migration and API files

### 4. **React Component Props (Key Prop)**
- **Scope**: React key attributes for list rendering
- **Files**: All React components in `/components/**/*.tsx`
- **Examples**:
  ```tsx
  {patients.map(patient => (
    <div key={patient.id}>
      {patient.name}
    </div>
  ))}
  ```
- **Current Status**: ✅ Already properly implemented
- **Note**: The key prop is NOT rendered to the DOM; it's only used by React for reconciliation

### 5. **Internal State Management**
- **Scope**: Context API, hooks, local state management
- **Files**:
  - `/contexts/**/*.ts`
  - `/hooks/**/*.ts`
  - Component state variables
- **Examples**:
  ```typescript
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const context = usePatientContext()
  ```
- **Current Status**: ✅ Already properly implemented

### 6. **Query Parameters (Backend Routing Only)**
- **Scope**: API route parameters like `/api/patients/[id]`
- **Files**: `/app/api/**/*.ts`
- **Examples**:
  ```typescript
  // In route.ts files
  export async function GET(request, { params }) {
    const patientId = params.id
    // Use patientId for database lookups
  }
  ```
- **Current Status**: ✅ Already properly implemented

---

## ❌ Prohibited UUID Usage

### 1. **User-Facing Text**
- **Prohibited**: Displaying UUIDs in any user-visible content
- **Examples of Bad Code**:
  ```tsx
  // ❌ DON'T DO THIS
  <p>Patient ID: {patientId}</p>
  <h3>Case: {caseData.id}</h3>
  <div>Operation #{operation.id}</div>
  ```
- **Files to Review**: All files in `/components/dialogs/`, `/components/features/`, `/app/(dashboard)/**/*.tsx`
- **Current Risk Files**:
  - `/components/dialogs/patient-detail-modal.tsx`
  - `/components/dialogs/appointment-view-dialog.tsx`
  - `/components/dialogs/case-view-dialog.tsx`
  - `/components/dialogs/invoice-view-dialog.tsx`
  - `/components/dialogs/finance-invoice-dialog.tsx`
  - `/components/dialogs/optical-item-view-dialog.tsx`
  - `/components/dialogs/pharmacy-view-dialog.tsx`
  - `/components/dialogs/bed-details-dialog.tsx`
  - `/components/dialogs/certificate-print-modal.tsx`

### 2. **Error Messages Shown to Users**
- **Prohibited**: Including UUIDs in error toast notifications or alerts
- **Examples of Bad Code**:
  ```typescript
  // ❌ DON'T DO THIS
  toast({
    title: "Error",
    description: `Failed to update patient ${patientId}`
  })
  
  alert(`Operation ${operationId} failed: ${error.message}`)
  ```
- **Expected Instead**:
  ```typescript
  // ✅ DO THIS
  toast({
    title: "Error",
    description: "Failed to update patient. Please try again."
  })
  ```
- **Files to Review**: All component files using `useToast()` hook

### 3. **Toast Notifications**
- **Prohibited**: UUIDs in success/error/info toast messages
- **Examples of Bad Code**:
  ```typescript
  // ❌ DON'T DO THIS
  toast({
    title: "Success",
    description: `Patient ${patientId} created successfully`
  })
  ```
- **Expected Instead**:
  ```typescript
  // ✅ DO THIS
  toast({
    title: "Success",
    description: "Patient created successfully"
  })
  ```
- **Files to Review**:
  - All files importing `useToast`
  - Search pattern: `toast({`

### 4. **Table Cells/Data Display**
- **Prohibited**: Showing UUIDs in table columns
- **Examples of Bad Code**:
  ```tsx
  // ❌ DON'T DO THIS
  <TableCell>{patient.id}</TableCell>
  <TableCell>{appointment.id}</TableCell>
  ```
- **Expected Instead**:
  ```tsx
  // ✅ DO THIS
  <TableCell>{patient.mrn || patient.name}</TableCell>
  <TableCell>{appointment.doctor_name}</TableCell>
  ```
- **Files to Review**:
  - `/app/(dashboard)/patients/page.tsx`
  - `/app/(dashboard)/appointments/page.tsx`
  - `/app/(dashboard)/operations/page.tsx`
  - `/app/(dashboard)/cases/page.tsx`
  - `/app/(dashboard)/employees/page.tsx`
  - All other dashboard pages with tables

### 5. **Form Fields**
- **Prohibited**: Displaying UUIDs as field values to users
- **Examples of Bad Code**:
  ```tsx
  // ❌ DON'T DO THIS
  <Input
    label="ID"
    value={patient.id}
    readOnly
  />
  ```
- **Expected Instead**:
  ```tsx
  // ✅ DO THIS - Don't show ID field at all, or use MRN
  <Input
    label="Medical Record Number"
    value={patient.mrn}
    readOnly
  />
  ```
- **Files to Review**:
  - `/components/forms/patient-form-dialog.tsx`
  - `/components/forms/appointment-form.tsx`
  - `/components/forms/case-form.tsx`
  - `/components/forms/operation-form.tsx`
  - `/components/forms/employee-form.tsx`
  - All other form components

### 6. **Dialog/Modal Content**
- **Prohibited**: UUIDs displayed in modal bodies, headers, or footers
- **Examples of Bad Code**:
  ```tsx
  // ❌ DON'T DO THIS
  <DialogTitle>Edit Patient {patientId}</DialogTitle>
  <p>Are you sure you want to delete {operationId}?</p>
  ```
- **Expected Instead**:
  ```tsx
  // ✅ DO THIS
  <DialogTitle>Edit Patient Information</DialogTitle>
  <p>Are you sure you want to delete this operation?</p>
  ```
- **Files to Review**: All files in `/components/dialogs/`

### 7. **Print/Export Documents**
- **Prohibited**: UUIDs in printed reports or exported documents
- **Examples of Bad Code**:
  ```tsx
  // ❌ DON'T DO THIS
  <h3>Patient ID: {patient.id}</h3>
  ```
- **Expected Instead**:
  ```tsx
  // ✅ DO THIS
  <h3>Medical Record: {patient.mrn}</h3>
  ```
- **Files to Review**:
  - `/components/print/appointment-print.tsx`
  - `/components/print/case-print.tsx`
  - `/components/print/operation-print.tsx`
  - `/components/print/discharge-print.tsx`
  - `/components/print/billing-print.tsx`
  - All other print components

### 8. **URL Display (Client-Side)**
- **Prohibited**: UUIDs shown in address bar should be hidden from users
- **Note**: URL params are acceptable for internal routing but shouldn't be displayed as part of UI
- **Examples of Bad Code**:
  ```tsx
  // ❌ DON'T DO THIS
  <p>Current URL: {window.location.href}</p>
  ```

---

## Implementation Strategy

### Phase 1: Audit (CURRENT)
1. Review all components in `/components/dialogs/` for UUID display
2. Check all dashboard pages in `/app/(dashboard)/**/*.tsx`
3. Review all form components in `/components/forms/`
4. Check print components in `/components/print/`

### Phase 2: Fixes
1. Remove UUID display from dialogs
2. Replace with user-friendly identifiers (MRN, names, reference numbers)
3. Update error messages to be generic (no UUIDs)
4. Update toast notifications

### Phase 3: Validation
1. Run grep searches for UUIDs in component files
2. Add ESLint rules to prevent UUID display
3. Test all user-facing components

---

## User-Friendly Identifier Alternatives

Instead of showing UUIDs, use these alternatives:

| Entity | Show Instead | Field Name |
|--------|------------|-----------|
| Patient | Medical Record Number (MRN) or Full Name | `mrn`, `full_name` |
| Doctor | Full Name or Employee ID | `full_name`, `employee_id` |
| Appointment | Date + Time + Doctor Name | `appointment_date`, `time_slot`, `doctor_name` |
| Case | Case Number or Patient Name | `case_number`, `patient_name` |
| Operation | Operation Date + Type | `operation_date`, `operation_type` |
| Employee | Employee Name or Badge ID | `full_name`, `employee_id` |
| Invoice | Invoice Number or Date | `invoice_number`, `invoice_date` |
| Bed | Bed Number or Ward | `bed_number`, `ward_name` |

---

## Code Review Checklist

When reviewing components, check:

- [ ] No UUID in component `<p>`, `<span>`, `<div>` text content
- [ ] No UUID in table `<TableCell>` components
- [ ] No UUID in form field values displayed to users
- [ ] No UUID in toast/notification messages
- [ ] No UUID in dialog titles, descriptions, or buttons
- [ ] No UUID in print/export templates
- [ ] UUIDs only in `key={}` props for lists
- [ ] UUIDs only in console.logs or error tracking
- [ ] Error messages are generic, not ID-specific

---

## Grep Commands for Finding Violations

### Find potential violations:
```bash
# Find UUID pattern in TSX files
grep -r "[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}" \
  /components --include="*.tsx" --include="*.ts"

# Find .id references in render output
grep -r "\.id}" /components --include="*.tsx" | \
  grep -v "key=" | grep -v "console" | grep -v "router.push"

# Find potential toast/error messages with IDs
grep -r "toast({" /components --include="*.tsx" -A 5 | grep -i "id"
```

---

## Current Implementation Status

### ✅ Properly Implemented
- Console logging in API routes
- Database operations using UUIDs
- Internal API calls
- React key props

### 🔍 Needs Review
- Dialog components (patient-detail-modal, case-view-dialog, etc.)
- Dashboard table pages
- Form components
- Print components

### ⚠️ Known Issues to Fix
- None identified yet - awaiting full audit

---

## Prevention Measures

1. **Code Review**: Always check for UUID display in user-facing components
2. **Testing**: View all dialogs, modals, and tables to ensure no UUIDs visible
3. **Linting**: Consider adding ESLint rules to catch `.id` in JSX
4. **Documentation**: Keep this guide updated as new features are added

---

## FAQ

**Q: Can UUIDs appear in the browser console?**
A: Yes, console.logs are development-only and users shouldn't see them in production.

**Q: Can UUIDs be in the URL?**
A: Yes, for internal routing (e.g., `/patients/[id]/route.ts`) but shouldn't be displayed as text in the UI.

**Q: What if I need to show an ID to users?**
A: Use a user-friendly ID like MRN (Medical Record Number), Employee ID, Invoice Number, or Case Number instead.

**Q: Why hide UUIDs from users?**
A: Better UX, improved security (reduces information disclosure), and cleaner interface. Users don't need to see system identifiers.

---

## Last Updated

- **Date**: 2025-11-29
- **Status**: Initial Creation
- **Next Review**: After implementation of fixes
