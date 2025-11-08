# Dropdown Integration Guide

## Overview
All dropdown fields in the application now fetch data from the backend master_data table via the `/api/master-data` route. This ensures data consistency and allows easy management of options through the Master Data page.

## Architecture

### 1. Backend API
- **Route**: `/api/master-data/route.ts`
- **Database Table**: `master_data`
- **Categories**: All dropdown categories are stored with:
  - `id`: UUID (primary key)
  - `category`: Category name (e.g., 'complaints', 'treatments', 'medicines')
  - `name`: Display name
  - `description`: Optional description
  - `is_active`: Boolean flag
  - `created_by`, `updated_by`: Audit fields

### 2. Frontend Hook
- **Location**: `/hooks/use-master-data.ts`
- **Purpose**: Centralized hook for fetching master data
- **Features**:
  - Auto-maps frontend keys to API category names
  - Loading states per category
  - Error handling with toast notifications
  - Batch fetching support
  - Refresh capability

### 3. UI Component
- **Component**: `SearchableSelect` (`/components/ui/searchable-select.tsx`)
- **Features**:
  - Search functionality
  - Keyboard navigation
  - Loading states
  - Professional styling
  - Responsive design

## Available Master Data Categories

| Frontend Key | API Category | Description |
|-------------|-------------|-------------|
| `complaints` | complaints | Patient complaints |
| `treatments` | treatments | Treatment procedures |
| `medicines` | medicines | Medicine names |
| `surgeries` | surgeries | Surgery procedures |
| `surgeryTypes` | surgery_types | Types of surgeries |
| `diagnosticTests` | diagnostic_tests | Diagnostic test names |
| `eyeConditions` | eye_conditions | Eye condition names |
| `visualAcuity` | visual_acuity | Visual acuity measurements |
| `bloodTests` | blood_tests | Blood test types |
| `diagnosis` | diagnosis | Diagnosis names |
| `dosages` | dosages | Dosage instructions |
| `routes` | routes | Administration routes |
| `eyeSelection` | eye_selection | Eye options (R/L/B) |
| `visitTypes` | visit_types | Visit types (First/Follow-up) |
| `sacStatus` | sac_status | SAC test statuses |
| `iopRanges` | iop_ranges | IOP measurement ranges |
| `iopMethods` | iop_methods | IOP measurement methods |
| `fundusFindings` | fundus_findings | Fundus examination findings |
| `corneaFindings` | cornea_findings | Cornea examination findings |
| `conjunctivaFindings` | conjunctiva_findings | Conjunctiva findings |
| `irisFindings` | iris_findings | Iris examination findings |
| `anteriorSegmentFindings` | anterior_segment_findings | Anterior segment findings |
| `lensOptions` | lens_options | Lens/visual acuity options |
| `paymentMethods` | payment_methods | Payment method types |
| `insuranceProviders` | insurance_providers | Insurance provider names |
| `roles` | roles | User role types |
| `roomTypes` | room_types | Room type classifications |
| `expenseCategories` | expense_categories | Expense category names |
| `anesthesiaTypes` | anesthesia_types | Anesthesia type options |

## Implementation Pattern

### Step 1: Import the Hook
```typescript
import { useMasterData } from "@/hooks/use-master-data"
import { SearchableSelect } from "@/components/ui/searchable-select"
```

### Step 2: Initialize in Component
```typescript
export function YourForm() {
  const masterDataAPI = useMasterData()
  const [open, setOpen] = React.useState(false)

  // Fetch required categories when form opens
  React.useEffect(() => {
    if (open) {
      masterDataAPI.fetchMultiple(['treatments', 'medicines', 'complaints'])
    }
  }, [open])
  
  // ... rest of component
}
```

### Step 3: Use in Form Fields

#### Basic Usage
```typescript
<FormField
  control={form.control}
  name="treatment_name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Treatment *</FormLabel>
      <FormControl>
        <SearchableSelect
          options={masterDataAPI.data.treatments}
          value={field.value}
          onValueChange={field.onChange}
          placeholder="Select treatment"
          searchPlaceholder="Search treatments..."
          emptyText="No treatments found."
          loading={masterDataAPI.loading.treatments}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### In Tables (Field Arrays)
```typescript
{fieldArray.map((item, index) => (
  <tr key={item.id}>
    <td className="p-3">
      <FormField
        control={form.control}
        name={`items.${index}.medicine_name`}
        render={({ field }) => (
          <SearchableSelect
            options={masterDataAPI.data.medicines}
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Select medicine"
            searchPlaceholder="Search medicines..."
            emptyText="No medicines found."
            loading={masterDataAPI.loading.medicines}
          />
        )}
      />
    </td>
  </tr>
))}
```

## Example: Case Form Implementation

The Case Form (`/components/case-form.tsx`) demonstrates the complete pattern:

### 1. Imports
```typescript
import { useMasterData as useMasterDataAPI } from "@/hooks/use-master-data"
import { SearchableSelect } from "@/components/ui/searchable-select"
```

### 2. Initialize Hook
```typescript
const masterDataAPI = useMasterDataAPI()

React.useEffect(() => {
  if (open) {
    masterDataAPI.fetchMultiple(['treatments', 'medicines', 'dosages'])
  }
}, [open])
```

### 3. Treatment Dropdown
```typescript
<FormField
  control={form.control}
  name={`past_history_treatments.${index}.treatment`}
  render={({ field }) => (
    <SearchableSelect
      options={masterDataAPI.data.treatments}
      value={field.value}
      onValueChange={field.onChange}
      placeholder="Select treatment"
      searchPlaceholder="Search treatments..."
      emptyText="No treatments found."
      loading={masterDataAPI.loading.treatments}
    />
  )}
/>
```

### 4. Medicine Dropdown
```typescript
<FormField
  control={form.control}
  name={`past_history_medicines.${index}.medicine_name`}
  render={({ field }) => (
    <SearchableSelect
      options={masterDataAPI.data.medicines}
      value={field.value}
      onValueChange={field.onChange}
      placeholder="Select medicine"
      searchPlaceholder="Search medicines..."
      emptyText="No medicines found."
      loading={masterDataAPI.loading.medicines}
    />
  )}
/>
```

## Forms to Update

Apply this pattern to ALL dropdown fields in these forms:

### ✅ Completed
- [x] `/components/case-form.tsx` - Treatment & Medicine dropdowns

### 🔄 To Be Updated

#### Patient Management
- [ ] `/components/patient-form.tsx`
  - Insurance providers
  - Blood group options

#### Appointments
- [ ] `/components/appointment-form.tsx`
  - Appointment types
  - Visit types
  - Doctors (from employees table)

#### Operations
- [ ] `/components/operation-form.tsx`
  - Surgery types ✓ (already using master data)
  - Anesthesia types
  - Surgeons (from employees table)

#### Beds
- [ ] `/components/bed-assignment-form.tsx`
  - Room types
  - Doctors ✓ (already using employees API)

#### Discharges
- [ ] `/components/discharge-form.tsx`
  - Discharge types
  - Doctors (from employees table)

#### Billing
- [ ] `/components/invoice-form.tsx`
  - Payment methods
  - Service types

#### Pharmacy
- [ ] `/components/pharmacy-form.tsx`
  - Medicine categories
  - Routes
  - Dosages

#### Certificates
- [ ] `/components/certificate-form.tsx`
  - Certificate types
  - Doctors (from employees table)

#### Revenue
- [ ] `/components/expense-form.tsx`
  - Expense categories
  - Payment methods

#### Attendance
- [ ] `/components/attendance-form.tsx`
  - Attendance status types
  - Leave types

#### Employees
- [ ] `/components/employee-form.tsx`
  - Roles
  - Department types
  - Specializations

## Performance Considerations

### 1. Lazy Loading
Only fetch data when the form dialog opens:
```typescript
React.useEffect(() => {
  if (open) {  // Only fetch when dialog is open
    masterDataAPI.fetchMultiple(['category1', 'category2'])
  }
}, [open])
```

### 2. Limit Results
The API accepts a `limit` parameter (default: 50, max: 1000):
```typescript
// Hook automatically uses limit=1000 for all categories
const response = await fetch('/api/master-data?category=medicines&limit=1000')
```

### 3. Caching
Data is cached in component state during the session. To refresh:
```typescript
masterDataAPI.refresh('medicines')  // Refresh single category
masterDataAPI.refresh()             // Refresh all categories
```

## Error Handling

The hook automatically shows toast notifications for errors:
```typescript
toast({
  title: "Failed to load treatments",
  description: error.message || "Please try again",
  variant: "destructive",
})
```

Check for errors in your component:
```typescript
{masterDataAPI.errors.treatments && (
  <Alert variant="destructive">
    <AlertDescription>
      {masterDataAPI.errors.treatments}
    </AlertDescription>
  </Alert>
)}
```

## Adding New Categories

### 1. Update Database
Add entries to `master_data` table:
```sql
INSERT INTO master_data (category, name, is_active, created_by) VALUES
('new_category', 'Option 1', true, '00000000-0000-0000-0000-000000000000'),
('new_category', 'Option 2', true, '00000000-0000-0000-0000-000000000000');
```

### 2. Update API Route
Add to `ALLOWED_CATEGORIES` in `/app/api/master-data/route.ts`:
```typescript
const ALLOWED_CATEGORIES = [
  // ... existing categories
  'new_category',
]
```

### 3. Update Hook Types
Add to `MasterDataCategories` interface in `/hooks/use-master-data.ts`:
```typescript
export interface MasterDataCategories {
  // ... existing categories
  newCategory: MasterDataOption[]
}
```

Add to `CATEGORY_MAP`:
```typescript
const CATEGORY_MAP: Record<CategoryKey, string> = {
  // ... existing mappings
  newCategory: 'new_category',
}
```

### 4. Update Master Data Page
Add to `categoryConfigs` in `/app/(dashboard)/dashboard/master/page.tsx`:
```typescript
const categoryConfigs = [
  // ... existing configs
  { key: 'new_category', label: 'New Category', title: 'New Item' },
]
```

### 5. Use in Forms
```typescript
masterDataAPI.fetchMultiple(['newCategory'])

<SearchableSelect
  options={masterDataAPI.data.newCategory}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select option"
  loading={masterDataAPI.loading.newCategory}
/>
```

## Testing Checklist

For each form you update:

- [ ] Dropdown loads data from API
- [ ] Loading state shows while fetching
- [ ] Search functionality works
- [ ] Selection updates form state
- [ ] Empty state shows when no results
- [ ] Error state shows on API failure
- [ ] Data refreshes when adding new items via Master Data page

## Benefits

1. **Centralized Data Management**: All dropdown options managed in one place
2. **Dynamic Updates**: Add/edit options without code changes
3. **Consistency**: Same options across all forms
4. **User Control**: Users can add custom options via Master Data page
5. **Better UX**: Searchable dropdowns with loading states
6. **Type Safety**: TypeScript interfaces for all categories
7. **Error Handling**: Automatic toast notifications
8. **Performance**: Lazy loading and caching

## Migration Checklist

When converting an existing dropdown:

1. [ ] Remove hardcoded options array from component
2. [ ] Import `useMasterData` hook
3. [ ] Initialize hook in component
4. [ ] Add category to `fetchMultiple` in useEffect
5. [ ] Replace Input/Select with SearchableSelect
6. [ ] Pass correct category data from hook
7. [ ] Test loading, selection, and error states
8. [ ] Remove unused imports
9. [ ] Update form validation if needed
10. [ ] Document in this guide

## Support

For issues or questions:
1. Check console for API errors
2. Verify category exists in `ALLOWED_CATEGORIES`
3. Confirm data exists in `master_data` table
4. Check network tab for API response
5. Review error toast messages

## Next Steps

1. **Immediate**: Apply pattern to all forms listed above
2. **Future**: Consider implementing:
   - Real-time updates (WebSocket/polling)
   - Infinite scroll for large datasets
   - Client-side caching with SWR/React Query
   - Multi-select dropdowns for relevant fields
   - Hierarchical categories (parent-child relationships)

