# UUID Handling - Quick Reference Card

## ✅ DO THIS

```typescript
// Display readable IDs to users
<TableCell>{patient.patient_id}</TableCell>        // Medical Record Number
<TableCell>{appointment.appointment_date}</TableCell>  // Date, not ID
<TableCell>{invoice.invoice_number}</TableCell>    // Invoice number
<TableCell>{operation.operation_date}</TableCell>  // Operation date
<TableCell>{employee.employee_id}</TableCell>      // Employee number
<p>Patient: {patient.full_name}</p>                // Patient name

// Use UUIDs internally
const handleUpdate = (id) => {
  api.updatePatient(id)  // id is UUID, not shown to users
}

database.query('WHERE id = ?', patientId)  // UUID for database lookups

// Console logs with UUIDs (development only)
console.log('Updated patient:', patientId)
console.error('Error creating appointment:', appointmentId)

// Generic error messages
toast({ description: "Failed to update patient" })
alert("An error occurred. Please try again.")
```

---

## ❌ DON'T DO THIS

```typescript
// Never display UUIDs to users
<TableCell>{patient.id}</TableCell>  // ❌ Shows UUID
<p>ID: {caseData.id}</p>              // ❌ Shows UUID
<div>{appointment.id}</div>           // ❌ Shows UUID

// Never include UUIDs in error messages
toast({ 
  description: `Failed to update ${patientId}`  // ❌ Shows UUID
})

alert(`Operation ${operationId} failed`)  // ❌ Shows UUID

// Never display UUIDs in forms to users
<Input value={formData.id} />          // ❌ Shows UUID
<FormField value={patient.id} />       // ❌ Shows UUID

// Never show UUIDs in dialogs/modals
<DialogTitle>Edit {caseData.id}</DialogTitle>  // ❌ Shows UUID
```

---

## Database Schema Pattern

```sql
-- ✅ CORRECT PATTERN

CREATE TABLE patients (
  id UUID PRIMARY KEY,              -- Internal UUID (NEVER display)
  patient_id TEXT UNIQUE NOT NULL,  -- Readable MRN (DISPLAY to users)
  full_name TEXT NOT NULL,          -- Patient name (DISPLAY to users)
  created_at TIMESTAMP              -- Creation date (DISPLAY if relevant)
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY,              -- Internal UUID (NEVER display)
  appointment_date DATE NOT NULL,   -- Date (DISPLAY to users)
  start_time TIME NOT NULL,         -- Time (DISPLAY to users)
  patient_id TEXT,                  -- Patient reference (DISPLAY as MRN)
  doctor_id UUID,                   -- Doctor reference (use name instead)
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Display pattern:
SELECT 
  appointment_date,
  start_time,
  p.patient_id,           -- Display this (MRN)
  p.full_name,            -- Display this (name)
  d.full_name             -- Display this (doctor name)
FROM appointments a
JOIN patients p ON a.patient_id = p.patient_id
LEFT JOIN doctors d ON a.doctor_id = d.id;
```

---

## Real-World Examples

### Patient Table Display
```typescript
patients.map(patient => (
  <TableRow key={patient.id}>                {/* ✅ key uses UUID */}
    <TableCell>{patient.patient_id}</TableCell>  {/* ✅ Show MRN */}
    <TableCell>{patient.full_name}</TableCell>   {/* ✅ Show name */}
    <TableCell>{patient.mobile}</TableCell>      {/* ✅ Show contact */}
    <TableCell>{patient.email}</TableCell>       {/* ✅ Show email */}
  </TableRow>
))
```

### Patient Dialog
```typescript
export function PatientDetailModal({ patient }) {
  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>Patient Details</DialogTitle>  {/* ✅ Generic title */}
      </DialogHeader>
      <div className="space-y-4">
        <DetailItem 
          label="Medical Record Number" 
          value={patient.patient_id}  {/* ✅ Show MRN */}
        />
        <DetailItem 
          label="Name" 
          value={patient.full_name}   {/* ✅ Show name */}
        />
        {/* Never show patient.id here */}
      </div>
    </Dialog>
  )
}
```

### Error Handling
```typescript
try {
  await api.createPatient(data)
} catch (error) {
  // ❌ WRONG
  toast({ description: `Failed to create ${patientId}` })
  
  // ✅ CORRECT
  toast({ description: "Failed to create patient" })
  
  // ✅ OK for development logs
  console.error('Patient creation failed:', patientId, error)
}
```

### Form Field Handling
```typescript
const PatientForm = ({ patient }) => {
  const form = useForm()
  
  useEffect(() => {
    if (patient) {
      form.reset({
        // Keep patient_id in state but don't display it
        patient_id: patient.patient_id,
        full_name: patient.full_name,
        email: patient.email,
        // etc.
      })
    }
  }, [patient])
  
  return (
    <Form>
      {/* ❌ Don't show this field to users */}
      {/* <FormField name="patient_id" /> */}
      
      {/* ✅ Show user-friendly fields */}
      <FormField name="full_name" label="Name" />
      <FormField name="email" label="Email" />
      <FormField name="mobile" label="Mobile" />
    </Form>
  )
}
```

---

## Common Fields Reference

| Entity | UUID Field | Display Field | Example |
|--------|-----------|---------------|---------|
| Patient | `id` | `patient_id` (MRN) | "PAT-20251129-ABC123" |
| Appointment | `id` | `appointment_date` | "29 Nov 2025" |
| Case | `id` | `case_no` | "CASE-001" |
| Operation | `id` | `operation_date` | "29 Nov 2025" |
| Employee | `id` | `employee_id` | "EMP-001" |
| Invoice | `id` | `invoice_number` | "INV-001" |
| Bed | `id` | `bed_number` | "Bed-101" |
| Certificate | `id` | `certificate_number` | "CERT-001" |

---

## Checklist for Code Review

- [ ] No `{record.id}` in JSX
- [ ] Error messages don't contain IDs
- [ ] Toast messages are generic
- [ ] Table cells show readable data
- [ ] Form labels don't show system IDs
- [ ] Dialog content is user-friendly
- [ ] Print output doesn't show UUIDs
- [ ] Console logs can have UUIDs (dev-only)

---

## React Key Props

```typescript
// ✅ Keys can (should) use UUIDs
{patients.map(patient => (
  <div key={patient.id}>  {/* ✅ Use UUID for React key */}
    {patient.patient_id}  {/* ✅ Display readable ID */}
  </div>
))}

// React key is NOT rendered to DOM, so UUID is fine there
```

---

## Testing

**What to check in browser**:
1. Open any table/list - no UUIDs visible ✅
2. Open any dialog - no UUIDs visible ✅
3. Trigger an error - message is generic ✅
4. Check form fields - no ID fields displayed ✅
5. Print a document - no UUIDs in output ✅
6. Open browser console - UUIDs OK there ✅

---

## Quick Fixes

If you find a UUID being displayed:

```typescript
// Found this in code
<TableCell>{appointment.id}</TableCell>

// Replace with appropriate readable data
<TableCell>{appointment.appointment_date}</TableCell>
// OR
<TableCell>{appointment.patient_name}</TableCell>
// OR
<TableCell>{formatDate(appointment.created_at)}</TableCell>
```

---

## When in Doubt

**Ask yourself**: "Would a non-technical user understand this value?"

- ✅ "Patient: John Doe" - Clear
- ✅ "Appointment: 29 Nov 2025 at 2:00 PM" - Clear
- ✅ "Invoice #INV-001" - Clear
- ❌ "550e8400-e29b-41d4-a716-446655440000" - Confusing
- ❌ "Patient: 550e8400-e29b-41d4" - Wrong

---

**Remember**: UUIDs are for the system, readable IDs are for users.
