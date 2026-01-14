---
name: Create Blood & Advice Page
overview: Extract Blood Investigation (blood_sugar, blood_tests) and Advice Remarks (advice_remarks) data from the cases page into a new standalone page with database setup, API routes, form component, listing page, and print functionality.
todos:
  - id: db-migration-blood-advice
    content: Create database migration for blood_advice_records table with blood_investigation_data JSONB and advice_remarks TEXT columns
    status: completed
  - id: update-types-blood-advice
    content: Add BloodAdviceRecord interface and bloodAdviceApi to lib/services/api.ts
    status: completed
    dependencies:
      - db-migration-blood-advice
  - id: create-api-routes-blood-advice
    content: Create API routes for blood-advice (GET, POST) and blood-advice/[id] (GET, PUT, DELETE)
    status: completed
    dependencies:
      - update-types-blood-advice
  - id: create-form-blood-advice
    content: Create blood-advice-form.tsx component with patient selection, blood investigation fields, and advice remarks
    status: completed
    dependencies:
      - update-types-blood-advice
  - id: create-page-blood-advice
    content: Create blood-advice page with list, search, pagination, and CRUD operations
    status: completed
    dependencies:
      - create-api-routes-blood-advice
      - create-form-blood-advice
  - id: create-print-blood-advice
    content: Create blood-advice-print.tsx component with blood investigation and advice sections
    status: completed
    dependencies:
      - update-types-blood-advice
  - id: update-navigation-blood-advice
    content: Add Blood & Advice link to sidebar navigation
    status: completed
  - id: update-layout-blood-advice
    content: Add blood-advice page name mapping to layout
    status: completed
---

# Create Blood & Advice Page

## Overview

Extract "Blood Investigation" and "Advice" data from the cases page into a new standalone page called "Blood & Advice". This includes:

- Blood Investigation: blood_sugar (string) and blood_tests (array of strings)
- Advice Remarks: advice_remarks (text)

## Data Structure from Cases Page

From `case-form.tsx` and database schema:

- **blood_sugar**: String (stored in `examination_data.blood_investigation.blood_sugar`)
- **blood_tests**: Array of strings (stored in `examination_data.blood_investigation.blood_tests`)
- **advice_remarks**: Text (stored as direct column `advice_remarks` in encounters table)

## Implementation Steps

### Step 1: Database Migration

**File:** `supabase/migrations/058_create_blood_advice_records_table.sql`

Create new table `blood_advice_records` with:

- `id` (uuid, primary key)
- `patient_id` (uuid, foreign key to patients)
- `record_date` (date)
- `record_time` (time)
- `record_number` (text, unique)
- `blood_investigation_data` (JSONB) - stores blood_sugar and blood_tests
- `advice_remarks` (text) - stores advice/remarks
- `created_at`, `updated_at` timestamps
- RLS policies for CRUD operations
- Indexes on patient_id, record_date, record_number

### Step 2: Update API Service Types

**File:** `lib/services/api.ts`

Add:

- `BloodAdviceRecord` interface
- `BloodAdviceFilters` interface
- `bloodAdviceApi` object with `list`, `get`, `create`, `update`, `delete` methods

### Step 3: Create API Routes

**Files:**

- `app/api/blood-advice/route.ts` - GET (list), POST (create)
- `app/api/blood-advice/[id]/route.ts` - GET (get by id), PUT (update), DELETE (delete)

Include:

- RBAC permission checks
- Structured logging
- Data validation
- Error handling

### Step 4: Create Form Component

**File:** `components/forms/blood-advice-form.tsx`

Include:

- Patient selection dropdown
- Record details (date, time, record number)
- Blood Investigation section:
  - Blood Sugar input field
  - Blood Tests MultiSelect (using master data bloodTests category)
- Advice Remarks section:
  - Textarea for advice/remarks
- Use `useMasterData` hook for blood tests dropdown
- Use `DialogContent` with `onCloseButtonClickOnly={true}`
- Follow same design pattern as other form components

### Step 5: Create Listing Page

**File:** `app/(dashboard)/blood-advice/page.tsx`

Include:

- List view with table
- Search functionality
- Pagination
- Add/Edit/Delete actions
- Print button
- Use `useApiList`, `useApiForm`, `useApiDelete` hooks
- Follow same design pattern as other listing pages (cases, vision, diagnosis-tests, treatments-medications)

### Step 6: Create Print Component

**File:** `components/print/blood-advice-print.tsx`

Include:

- Patient information
- Record information
- Blood Investigation section (blood_sugar, blood_tests)
- Advice Remarks section
- Use `PrintModalShell`, `PrintHeader`, `PrintSection`, `PrintGrid`
- Use `useMasterData` for UUID resolution of blood tests
- Follow same design pattern as other print components

### Step 7: Update Navigation

**File:** `components/shared/app-sidebar.tsx`

Add "Blood & Advice" link under "CLINICAL" section

### Step 8: Update Layout

**File:** `app/(dashboard)/layout.tsx`

Add "/blood-advice": "Blood & Advice" to `pathToPageName` mapping

## Technical Details

### JSONB Structure:

```typescript
blood_investigation_data: {
  blood_sugar?: string
  blood_tests?: string[] (array of UUIDs or strings)
}
```

### Data Storage:

- `blood_investigation_data`: JSONB column storing blood investigation data
- `advice_remarks`: Direct TEXT column storing advice/remarks

## Files to Create/Modify

**New Files:**

1. `supabase/migrations/058_create_blood_advice_records_table.sql`
2. `app/api/blood-advice/route.ts`
3. `app/api/blood-advice/[id]/route.ts`
4. `components/forms/blood-advice-form.tsx`
5. `app/(dashboard)/blood-advice/page.tsx`
6. `components/print/blood-advice-print.tsx`

**Modified Files:**

1. `lib/services/api.ts` - Add types and API methods
2. `components/shared/app-sidebar.tsx` - Add navigation link
3. `app/(dashboard)/layout.tsx` - Add page name mapping