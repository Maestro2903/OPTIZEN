# Remaining Implementation Plan - EYECARE HMS

## Date: 2025-11-08

Based on the comprehensive requirements document provided, this plan outlines what remains to be implemented and how to use the components/patterns already created.

---

## ✅ Already Completed Modules

### 1. Patient Module - ✅ COMPLETE
- International phone numbers with country codes
- Country → State dynamic dropdowns (36 Indian states, 50 US states, etc.)
- All fields working and connected to backend
- Export functionality
- **No further work needed**

### 2. Operation Module - ✅ COMPLETE  
- Schedule operation popup/dialog fully functional
- Searchable dropdowns for patients, doctors, surgery types
- All fields (IOL, payment, anesthesia, etc.) implemented
- Connected to backend APIs
- **No further work needed**

### 3. Master Module - ✅ COMPLETE
- Added all required categories:
  - Roles, Room Types, Surgery Types, Expense Categories
  - All 22 categories total
- Three-column layout present
- Settings removed
- All data accessible via APIs
- **No further work needed**

### 4. Employees Module - ✅ COMPLETE
- Auto-generated Employee ID (EMP-2025-0001 format)
- International phone support ready
- Roles from Master section
- Searchable role dropdown (can use SearchableSelect component)
- **No further work needed**

### 5. Reusable Components - ✅ CREATED
- `SearchableSelect` component - Ready to use everywhere
- `PhoneNumberInput` component - International phone support
- `Command` component - Search infrastructure
- `Checkbox` component - Consistent styling
- Export utilities - CSV/JSON export
- **Ready to apply to other modules**

---

## 🔨 Modules Requiring Implementation

### Priority 1: Critical Business Logic (High Priority)

#### 1. Appointments Module - 🟡 PARTIAL
**Current State:** Basic structure exists, but searchable dropdowns not fully implemented

**Required Changes:**
```typescript
// File: app/(dashboard)/dashboard/appointments/page.tsx

// Add these imports
import { SearchableSelect } from "@/components/ui/searchable-select"
import { patientsApi, employeesApi, masterDataApi } from "@/lib/services/api"

// Add state for options
const [patientOptions, setPatientOptions] = React.useState<SearchableSelectOption[]>([])
const [doctorOptions, setDoctorOptions] = React.useState<SearchableSelectOption[]>([])
const [roomOptions, setRoomOptions] = React.useState<SearchableSelectOption[]>([])

// Load data
React.useEffect(() => {
  const loadData = async () => {
    // Load patients
    const patientsRes = await patientsApi.list({ limit: 1000 })
    if (patientsRes.success && patientsRes.data) {
      setPatientOptions(patientsRes.data.map(p => ({
        value: p.id,
        label: `${p.full_name} (${p.patient_id})`
      })))
    }
    
    // Load doctors from employees
    const doctorsRes = await employeesApi.list({ role: 'Doctor', limit: 1000 })
    if (doctorsRes.success && doctorsRes.data) {
      setDoctorOptions(doctorsRes.data.map(d => ({
        value: d.id,
        label: d.full_name
      })))
    }
    
    // Load room types from master data
    const roomsRes = await masterDataApi.list({ category: 'room_types', limit: 100 })
    if (roomsRes.success && roomsRes.data) {
      setRoomOptions(roomsRes.data.map(r => ({
        value: r.name,
        label: r.name
      })))
    }
  }
  loadData()
}, [])

// In the AppointmentForm component, replace Select with SearchableSelect:
<SearchableSelect
  options={patientOptions}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select patient"
  searchPlaceholder="Search patients..."
/>
```

**Estimated Time:** 2-3 hours

---

#### 2. Cases Module - 🔴 NEEDS WORK
**Required Features:**
- Searchable patient dropdown
- Auto-generate case number
- Searchable treatment dropdown  
- Searchable medicine dropdown with medicine type, advice, duration
- Case history check

**Implementation Guide:**

**A. Update case-form.tsx:**
```typescript
// Add to imports
import { SearchableSelect } from "@/components/ui/searchable-select"

// Add state for master data
const [treatments, setTreatments] = React.useState<SearchableSelectOption[]>([])
const [medicines, setMedicines] = React.useState<SearchableSelectOption[]>([])
const [medicineTypes, setMedicineTypes] = React.useState<string[]>([])

// Load master data
React.useEffect(() => {
  const loadMasterData = async () => {
    const treatmentsRes = await masterDataApi.list({ category: 'treatments' })
    if (treatmentsRes.success && treatmentsRes.data) {
      setTreatments(treatmentsRes.data.map(t => ({
        value: t.name,
        label: t.name
      })))
    }
    
    const medicinesRes = await masterDataApi.list({ category: 'medicines' })
    if (medicinesRes.success && medicinesRes.data) {
      setMedicines(medicinesRes.data.map(m => ({
        value: m.name,
        label: m.name
      })))
    }
  }
  loadMasterData()
}, [])

// Replace treatment input with SearchableSelect
<SearchableSelect
  options={treatments}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select treatment"
  searchPlaceholder="Search treatments..."
/>

// For medicine section, use SearchableSelect for medicine name
<SearchableSelect
  options={medicines}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select medicine"
  searchPlaceholder="Search medicines..."
/>
```

**B. Auto-generate Case Number:**
```typescript
// In case creation handler
const generateCaseNumber = () => {
  const timestamp = Date.now()
  const year = new Date().getFullYear()
  return `CASE-${year}-${timestamp.toString().slice(-6)}`
}

// When creating case:
const caseNumber = generateCaseNumber()
```

**C. Case History Check:**
```typescript
// Add function to check existing cases
const checkCaseHistory = async (patientId: string) => {
  const response = await casesApi.list({ patient_id: patientId })
  if (response.success && response.data && response.data.length > 0) {
    // Patient has history - show it
    return response.data
  }
  return null
}

// When patient is selected:
const handlePatientSelect = async (patientId: string) => {
  const history = await checkCaseHistory(patientId)
  if (history) {
    // Show case history UI
    setCaseHistory(history)
  }
}
```

**Estimated Time:** 4-6 hours

---

#### 3. Billing Module - 🟡 NEEDS AUTO-POPULATE
**Required Feature:** Auto-populate case number when patient selected

**Implementation:**
```typescript
// File: app/(dashboard)/dashboard/billing/page.tsx or invoice-form.tsx

// Add state
const [patientCases, setPatientCases] = React.useState<Case[]>([])

// Watch patient selection
const selectedPatientId = form.watch("patient_id")

// Auto-load cases when patient selected
React.useEffect(() => {
  const loadPatientCases = async () => {
    if (!selectedPatientId) {
      setPatientCases([])
      return
    }
    
    const response = await casesApi.list({ patient_id: selectedPatientId })
    if (response.success && response.data) {
      setPatientCases(response.data)
      
      // Auto-select the most recent case
      if (response.data.length > 0) {
        const mostRecentCase = response.data[0]
        form.setValue("case_id", mostRecentCase.id)
        form.setValue("case_no", mostRecentCase.case_no)
      }
    }
  }
  
  loadPatientCases()
}, [selectedPatientId])

// Make case number field read-only
<Input 
  value={form.watch("case_no")} 
  readOnly 
  disabled 
  className="bg-muted"
/>
```

**Estimated Time:** 1-2 hours

---

### Priority 2: Supporting Modules (Medium Priority)

#### 4. Discharge Module - 🔴 NEEDS CONNECTION
**Required:** Connect to patients and operations

**Implementation:**
```typescript
// Similar to OperationForm pattern
const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
const [operations, setOperations] = React.useState<SearchableSelectOption[]>([])

// Load data
React.useEffect(() => {
  const loadData = async () => {
    const patientsRes = await patientsApi.list({ limit: 1000 })
    if (patientsRes.success && patientsRes.data) {
      setPatients(patientsRes.data.map(p => ({
        value: p.id,
        label: `${p.full_name} (${p.patient_id})`
      })))
    }
    
    const opsRes = await operationsApi.list({ status: 'completed', limit: 1000 })
    if (opsRes.success && opsRes.data) {
      setOperations(opsRes.data.map(o => ({
        value: o.id,
        label: `${o.operation_name} - ${o.operation_date}`
      })))
    }
  }
  loadData()
}, [])

// Use SearchableSelect in form
<SearchableSelect
  options={patients}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select patient"
  searchPlaceholder="Search patients..."
/>
```

**Estimated Time:** 2-3 hours

---

#### 5. Pharmacy Module - 🔴 NEEDS CATEGORIES
**Required:** Connect categories from master data

**Implementation:**
```typescript
// File: components/pharmacy-item-form.tsx

const [categories, setCategories] = React.useState<SearchableSelectOption[]>([])

React.useEffect(() => {
  const loadCategories = async () => {
    // Load from master data or create dedicated pharmacy_categories
    const response = await masterDataApi.list({ category: 'medicine_categories' })
    if (response.success && response.data) {
      setCategories(response.data.map(c => ({
        value: c.name,
        label: c.name
      })))
    }
  }
  loadCategories()
}, [])

// Replace category Select with SearchableSelect
<SearchableSelect
  options={categories}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select category"
  searchPlaceholder="Search categories..."
/>
```

**Note:** May need to add `medicine_categories` to master_data table:
```sql
INSERT INTO master_data (category, name, description, sort_order) VALUES
('medicine_categories', 'Antibiotics', 'Antibiotic medications', 1),
('medicine_categories', 'Analgesics', 'Pain relief medications', 2),
('medicine_categories', 'Eye Drops', 'Ophthalmic solutions', 3),
-- etc.
```

**Estimated Time:** 2-3 hours

---

#### 6. Beds/Bids Module - 🔴 NEEDS SEARCHABLE DROPDOWNS
**Required:** Searchable dropdowns for patients, beds, doctors, surgery types

**Implementation:**
```typescript
// File: components/bed-assignment-form.tsx

const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
const [beds, setBeds] = React.useState<SearchableSelectOption[]>([])
const [doctors, setDoctors] = React.useState<SearchableSelectOption[]>([])
const [surgeryTypes, setSurgeryTypes] = React.useState<SearchableSelectOption[]>([])

React.useEffect(() => {
  const loadData = async () => {
    // Load patients
    const patientsRes = await patientsApi.list({ limit: 1000 })
    if (patientsRes.success && patientsRes.data) {
      setPatients(patientsRes.data.map(p => ({
        value: p.id,
        label: `${p.full_name} (${p.patient_id})`
      })))
    }
    
    // Load available beds
    const bedsRes = await bedsApi.list({ status: 'available' })
    if (bedsRes.success && bedsRes.data) {
      setBeds(bedsRes.data.map(b => ({
        value: b.bed.id,
        label: `${b.bed.bed_number} - ${b.bed.ward_name}`
      })))
    }
    
    // Load doctors
    const doctorsRes = await employeesApi.list({ role: 'Doctor' })
    if (doctorsRes.success && doctorsRes.data) {
      setDoctors(doctorsRes.data.map(d => ({
        value: d.id,
        label: d.full_name
      })))
    }
    
    // Load surgery types from master
    const surgeryRes = await masterDataApi.list({ category: 'surgery_types' })
    if (surgeryRes.success && surgeryRes.data) {
      setSurgeryTypes(surgeryRes.data.map(s => ({
        value: s.name,
        label: s.name
      })))
    }
  }
  loadData()
}, [])

// Use SearchableSelect for all fields
<SearchableSelect
  options={patients}
  // ... config
/>
```

**Estimated Time:** 3-4 hours

---

#### 7. Certificates Module - 🟡 NEEDS VISUAL ACUITY FIX
**Required:** Fix visual accuracy dropdown

**Implementation:**
```typescript
// File: components/certificate-forms.tsx

const visualAcuityOptions = [
  { value: "6/4", label: "6/4" },
  { value: "6/4P", label: "6/4P" },
  { value: "6/5", label: "6/5" },
  { value: "6/5P", label: "6/5P" },
  { value: "6/6", label: "6/6" },
  { value: "6/6P", label: "6/6P" },
  { value: "6/9", label: "6/9" },
  { value: "6/9P", label: "6/9P" },
  { value: "6/12", label: "6/12" },
  { value: "6/12P", label: "6/12P" },
  { value: "6/18", label: "6/18" },
  { value: "6/24", label: "6/24" },
  { value: "6/36", label: "6/36" },
  { value: "6/60", label: "6/60" },
  { value: "FC 1M", label: "FC 1M" },
  { value: "FC 3M", label: "FC 3M" },
  { value: "HM", label: "Hand Movements" },
  { value: "PL+", label: "Perception of Light" },
]

// Replace Input with SearchableSelect
<SearchableSelect
  options={visualAcuityOptions}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select visual acuity"
  searchPlaceholder="Search acuity..."
/>
```

**Estimated Time:** 1-2 hours

---

#### 8. Attendance Module - 🔴 NEEDS STAFF DROPDOWN
**Required:** Searchable staff dropdown from employees

**Implementation:**
```typescript
// File: components/attendance-form.tsx

const [staff, setStaff] = React.useState<SearchableSelectOption[]>([])

React.useEffect(() => {
  const loadStaff = async () => {
    const response = await employeesApi.list({ status: 'active', limit: 1000 })
    if (response.success && response.data) {
      setStaff(response.data.map(e => ({
        value: e.id,
        label: `${e.full_name} (${e.role})`
      })))
    }
  }
  loadStaff()
}, [])

// Replace staff selection with SearchableSelect
<SearchableSelect
  options={staff}
  value={field.value}
  onValueChange={field.onChange}
  placeholder="Select staff member"
  searchPlaceholder="Search staff..."
/>

// Add multi-select support if needed for bulk attendance
```

**Estimated Time:** 2-3 hours

---

### Priority 3: Data Visualization (Lower Priority)

#### 9. Revenue Module - 🟡 NEEDS REAL DATA
**Required:** Replace sample graphs with real data

**Implementation:**
```typescript
// File: components/revenue-charts.tsx

// Replace mock data with API calls
const [revenueData, setRevenueData] = React.useState<any>(null)

React.useEffect(() => {
  const loadRevenueData = async () => {
    const response = await revenueApi.getSummary({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    })
    
    if (response.success && response.data) {
      setRevenueData(response.data)
    }
  }
  loadRevenueData()
}, [])

// Update chart components to use real data:
<ResponsiveContainer>
  <BarChart data={revenueData?.dailyRevenue}>
    <Bar dataKey="income" fill="#10b981" />
    <Bar dataKey="expenses" fill="#ef4444" />
  </BarChart>
</ResponsiveContainer>
```

**Note:** Backend API needs to return properly formatted data:
```typescript
{
  totalIncome: number,
  totalExpenses: number,
  netProfit: number,
  dailyRevenue: Array<{ date: string, income: number, expenses: number }>,
  incomeByCategory: Record<string, number>,
  expensesByCategory: Record<string, number>
}
```

**Estimated Time:** 3-4 hours

---

## 📊 Implementation Summary

### Total Estimated Time: 24-35 hours

| Module | Priority | Complexity | Time | Status |
|--------|----------|-----------|------|--------|
| Appointments | High | Low | 2-3h | 🟡 Partial |
| Cases | High | High | 4-6h | 🔴 Major |
| Billing | High | Low | 1-2h | 🟡 Minor |
| Discharge | Medium | Medium | 2-3h | 🔴 New |
| Pharmacy | Medium | Medium | 2-3h | 🔴 Connect |
| Beds/Bids | Medium | Medium | 3-4h | 🔴 Major |
| Certificates | Medium | Low | 1-2h | 🟡 Fix |
| Attendance | Medium | Medium | 2-3h | 🔴 Connect |
| Revenue | Low | Medium | 3-4h | 🟡 Data |

---

## 🎯 Recommended Implementation Order

### Sprint 1 (8-12 hours):
1. ✅ Cases Module (treatment/medicine dropdowns, case history)
2. ✅ Billing Module (auto-populate case number)
3. ✅ Appointments Module (searchable dropdowns)

### Sprint 2 (8-12 hours):
4. ✅ Beds/Bids Module (all searchable dropdowns)
5. ✅ Discharge Module (patient/operation connections)
6. ✅ Attendance Module (staff dropdown)

### Sprint 3 (8-12 hours):
7. ✅ Pharmacy Module (category connections)
8. ✅ Certificates Module (visual acuity fix)
9. ✅ Revenue Module (real data graphs)

---

## 🔧 Reusable Patterns

All implementations should follow these established patterns:

### Pattern 1: Loading Master Data
```typescript
const [options, setOptions] = React.useState<SearchableSelectOption[]>([])

React.useEffect(() => {
  const loadData = async () => {
    const response = await masterDataApi.list({ category: 'your_category' })
    if (response.success && response.data) {
      setOptions(response.data.map(item => ({
        value: item.name,
        label: item.name
      })))
    }
  }
  loadData()
}, [])
```

### Pattern 2: Dependent Dropdowns
```typescript
const selectedParent = form.watch("parent_id")

React.useEffect(() => {
  const loadDependentData = async () => {
    if (!selectedParent) {
      setChildOptions([])
      return
    }
    
    const response = await api.list({ parent_id: selectedParent })
    if (response.success && response.data) {
      setChildOptions(response.data.map(/* ... */))
    }
  }
  loadDependentData()
}, [selectedParent])
```

### Pattern 3: Auto-generating IDs
```typescript
const generateId = (prefix: string) => {
  const timestamp = Date.now()
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${year}-${timestamp.toString().slice(-6)}-${random}`
}
```

---

## ✅ Testing Checklist

For each implemented module, verify:

- [ ] Searchable dropdowns load data from backend
- [ ] Data saves correctly to backend
- [ ] Appears in relevant tables immediately
- [ ] Export functionality works
- [ ] Form validation works
- [ ] Loading states show properly
- [ ] Error handling works
- [ ] Toast notifications appear
- [ ] Mobile responsive
- [ ] No console errors

---

## 🚀 Next Steps

1. **Start with Cases Module** (highest business value)
   - Most complex but most critical
   - Sets pattern for other forms

2. **Then Billing** (quick win)
   - Simple auto-populate feature
   - Immediate value

3. **Then Appointments** (user-facing)
   - High visibility feature
   - Improves UX significantly

4. **Continue with remaining modules** based on priority

---

## 📦 Required Dependencies

All dependencies already installed:
- ✅ `cmdk` - For searchable dropdowns
- ✅ `react-phone-number-input` - For international phones
- ✅ All UI components created

No additional installations needed.

---

## 🛠️ Backend API Requirements

Ensure these endpoints exist and return proper data:

```typescript
// All APIs should follow this pattern:
GET /api/{resource}?page=1&limit=10&search=query&sortBy=field&sortOrder=asc
POST /api/{resource}
PUT /api/{resource}/{id}
DELETE /api/{resource}/{id}

// Master data
GET /api/master-data?category={category}
POST /api/master-data

// Specific requirements:
GET /api/cases?patient_id={id} // For case history
GET /api/revenue/summary?month={}&year={} // For graphs
GET /api/employees?role=Doctor // For doctors list
GET /api/beds?status=available // For available beds
```

---

## 📝 Documentation

After implementation, update:
- `IMPLEMENTATION_SUMMARY.md` with new completed features
- API documentation with new endpoints used
- Component documentation with usage examples
- Testing documentation with test cases

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't create new patterns** - Use existing SearchableSelect component
2. **Don't skip loading states** - Always show loading UI
3. **Don't forget error handling** - Wrap API calls in try-catch
4. **Don't hardcode options** - Always fetch from backend/master data
5. **Don't skip validation** - Use Zod schemas consistently
6. **Don't forget toast notifications** - Provide user feedback
7. **Don't skip mobile testing** - Test on small screens

---

## 🎓 Learning Resources

### For Developers New to Project:

1. **Study these files first:**
   - `components/operation-form.tsx` - Complete form example
   - `components/ui/searchable-select.tsx` - Reusable dropdown
   - `lib/services/api.ts` - API patterns
   - `lib/hooks/useApi.ts` - API hooks

2. **Understand these patterns:**
   - React Hook Form with Zod validation
   - Searchable Select implementation
   - API integration with hooks
   - Master data usage

3. **Reference implementations:**
   - Operations page - Complete CRUD
   - Patients page - International phone
   - Master page - Category management

---

**End of Implementation Plan**

This plan provides everything needed to complete the remaining 40% of the Hospital Management System. All tools, components, and patterns are ready - just need to apply them to remaining modules.
