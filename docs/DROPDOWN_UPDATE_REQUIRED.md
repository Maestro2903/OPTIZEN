# Dropdown API Integration - Required Updates

## Summary
All forms currently have hardcoded dropdown options that need to be connected to the master data API.

## Files to Update

### 1. Case Form (`components/case-form.tsx`)

**Hardcoded arrays to remove:**
- `COMPLAINT_OPTIONS` → use `complaints` from master_data
- `DIAGNOSIS_OPTIONS` → use `diagnosis` from master_data  
- `VISUAL_ACUITY_OPTIONS` → use `visual_acuity` from master_data
- `BLOOD_TEST_OPTIONS` → use `blood_tests` from master_data
- `TREATMENT_OPTIONS` → use `treatments` from master_data (already done for some sections)
- `DOSAGE_OPTIONS` → use `dosages` from master_data (already done for some sections)
- `MEDICINE_OPTIONS` → use `medicines` from master_data

**Dropdowns to update:**
1. Complaints dropdown → `SearchableSelect` with `master_data.complaints`
2. Eye selection (for complaints) → `SearchableSelect` with `master_data.eye_selection`
3. Visual Acuity fields (all 6-8 instances) → `SearchableSelect` with `master_data.visual_acuity`
4. Blood Investigation → `SearchableSelect` with `master_data.blood_tests`
5. Diagnosis → `SearchableSelect` with `master_data.diagnosis`
6. Diagnostic Test → `SearchableSelect` with `master_data.diagnostic_tests`
7. Drug Name (Advice section) → `SearchableSelect` with `master_data.medicines`
8. Route (medicine) → `SearchableSelect` with `master_data.routes`
9. Eye (medicine) → `SearchableSelect` with `master_data.eye_selection`
10. Dosage (medicine) → `SearchableSelect` with `master_data.dosages` ✅ (already done)

### 2. Operation Form (`components/operation-form.tsx`)

**Hardcoded values to replace:**
- Eye dropdown (currently: Right/Left/Both)
- Anesthesia dropdown (currently: Local/General/Topical/Regional)
- Payment Mode dropdown (currently: Cash/Card/UPI/Cheque/Insurance)

**Dropdowns to update:**
1. Operation Type → Already using API (surgery_types) ✅
2. Eye → `SearchableSelect` with `master_data.eye_selection` or `eye_options`
3. Anesthesia → `SearchableSelect` with `master_data.anesthesia_types`
4. Payment Mode → `SearchableSelect` with `master_data.payment_methods`
5. Diagnosis field → Could be `SearchableSelect` with `master_data.diagnosis` (optional)

### 3. Discharge Form (`components/discharge-form.tsx`)

**Fields to update:**
1. Diagnosis → `SearchableSelect` with `master_data.diagnosis` (currently Textarea)
2. Anesthesia → `SearchableSelect` with `master_data.anesthesia_types` (currently Textarea)

## Implementation Approach

### Step 1: Add useMasterData Hook
All forms need to import and use the `useMasterData` hook:

```typescript
import { useMasterData } from '@/hooks/use-master-data'

// Inside component:
const masterDataAPI = useMasterData()

// Load data when dialog opens:
React.useEffect(() => {
  if (open) {
    masterDataAPI.fetchMultiple([
      'complaints',
      'diagnosis',
      'visual_acuity',
      'blood_tests',
      'medicines',
      'dosages',
      'routes',
      'eye_selection',
      'diagnostic_tests'
    ])
  }
}, [open])
```

### Step 2: Replace Hardcoded Arrays
Remove all `const XXX_OPTIONS = [...]` arrays from the top of the files.

### Step 3: Update Form Fields
Replace all hardcoded Select/SimpleCombobox components with `SearchableSelect`:

```typescript
<SearchableSelect
  options={masterDataAPI.data.complaints || []}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select complaint"
  searchPlaceholder="Search complaints..."
  emptyText="No complaints found."
  loading={masterDataAPI.loading.complaints}
/>
```

### Step 4: Test All Forms
1. Open each form and verify dropdowns load data
2. Test search functionality in each dropdown
3. Verify form submission works correctly
4. Check that data saves properly to database

## Master Data Categories Mapping

| Form Field | Master Data Category | Count |
|------------|---------------------|-------|
| Complaints | `complaints` | ~220 |
| Diagnosis | `diagnosis` | ~225 |
| Visual Acuity | `visual_acuity` | ~34 |
| Blood Tests | `blood_tests` | ~23 |
| Treatments | `treatments` or `surgeries` | ~181/186 |
| Medicines | `medicines` | ~997 |
| Dosages | `dosages` | ~26 |
| Routes | `routes` | ~6 |
| Eye Selection | `eye_selection` or `eye_options` | ~3 |
| Anesthesia Types | `anesthesia_types` | ~5 |
| Payment Methods | `payment_methods` | ~8 |
| Diagnostic Tests | `diagnostic_tests` | ~11 |
| Surgery Types | `surgery_types` | ~10 |

## Priority Order

1. **High Priority** - User explicitly mentioned:
   - Complaints (all forms)
   - Eye selection (all forms)
   - Visual Acuity (Cases)
   - Blood Investigation (Cases)
   - Diagnosis (all forms)
   - Diagnostic Test (Cases)
   - Drug Name (Cases - Advice section)
   - Operation Type (Operations) ✅ Already done
   - Anesthesia (Operations, Discharge)

2. **Medium Priority** - Logical improvements:
   - Route (Cases - Advice section)
   - Payment Mode (Operations)
   - Dosage (Cases) ✅ Already done

3. **Completed**:
   - Patient dropdown ✅
   - Treatment dropdown (Cases) ✅
   - Medicine dropdown (Cases - Past History) ✅
   - Dosage dropdown (Cases - Past History) ✅
   - Surgery Types (Operations) ✅

## Status

- [ ] Case Form - Complaints dropdown
- [ ] Case Form - Eye dropdown  
- [ ] Case Form - Visual Acuity dropdowns (6-8 instances)
- [ ] Case Form - Blood Investigation dropdown
- [ ] Case Form - Diagnosis dropdown
- [ ] Case Form - Diagnostic Test dropdown
- [ ] Case Form - Drug Name dropdown (Advice)
- [ ] Case Form - Route dropdown (Advice)
- [ ] Operation Form - Eye dropdown
- [ ] Operation Form - Anesthesia dropdown
- [ ] Operation Form - Payment Mode dropdown
- [ ] Operation Form - Diagnosis dropdown (optional)
- [ ] Discharge Form - Diagnosis dropdown
- [ ] Discharge Form - Anesthesia dropdown

## Testing Checklist

After implementation:
- [ ] Case Form loads all dropdowns correctly
- [ ] Operation Form loads all dropdowns correctly
- [ ] Discharge Form loads all dropdowns correctly
- [ ] Search functionality works in all dropdowns
- [ ] All forms can submit successfully
- [ ] Data saves correctly to database
- [ ] No console errors
- [ ] Loading states display correctly
- [ ] Error handling works (toast notifications)

## Notes

- All master data is already populated in the database (1,900+ records)
- The `useMasterData` hook is already created and working
- The `SearchableSelect` component has been rebuilt and is working perfectly
- All API endpoints are functional and secured with RBAC
- No additional migrations or database changes needed

---

**Created:** November 8, 2025  
**Status:** Ready for Implementation  
**Estimated Time:** 2-3 hours for all forms

