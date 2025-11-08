# 📋 Master Data Integration - Detailed Implementation Plan

## 🎯 Objective
Connect all dropdown fields in the Cases form to Master Data, allowing admins to manage dropdown options centrally.

---

## 📊 Current State Analysis

### Dropdown Fields Identified in Cases Form

Based on analysis of `/components/case-form.tsx`, here are ALL the dropdown categories:

#### **1. Visit Information**
- Visit No: ["First", "Follow-up-1", "Follow-up-2", "Follow-up-3"]

#### **2. Complaints Section**
- **Complaints** (42 options currently hardcoded in `COMPLAINT_OPTIONS`)
- **Eye Selection**: ["Right eye", "Left eye", "Both eye"]

#### **3. Vision Section**
- **Visual Acuity** (30+ options in `VISUAL_ACUITY_OPTIONS`)
  - Examples: "6/4P", "6/5P", "6/6P", "6/9P", "6/12", "6/18", "6/36", "6/60", etc.

#### **4. Examination Section**
- Various examination findings (in `COMPLAINT_OPTIONS`)

#### **5. Blood Investigation**
- **Blood Tests** (19 options in `BLOOD_TEST_OPTIONS`)
  - Examples: "CBC", "BT", "CT", "PT-INR", "RBS", "FBS", "PP2BS", "HIV", etc.

#### **6. Diagnosis Section**
- **Diagnosis** (70+ options in `DIAGNOSIS_OPTIONS`)
  - Examples: "PANOPHTHALMITIS", "ACUTE CONJUNCTIVITS", "CATARACT", etc.

#### **7. Test Section (SAC Syringing)**
- **SAC Status**: ["Patent", "Not Patent", "Regurgitant"]

#### **8. I.O.P Section**
- **I.O.P Ranges**: ["10-15 mmHg", "15-20 mmHg", "20-25 mmHg", "> 25 mmHg"]

#### **9. Advice Section**
- **Drug/Medicine** (125+ options in `MEDICINE_OPTIONS`)
- **Eye Selection**: ["Right eye", "Left eye", "Both eye"]
- **Dosage** (16+ options in `DOSAGE_OPTIONS`)
  - Examples: "1 TIMES A DAY", "2 TIMES A DAY", "3 TIMES A DAY", etc.
- **Route**: ["Oral", "Topical", "IV", "IM", "SC"]
- **Duration**: Free text input

#### **10. Treatments Section**
- **Treatments** (same as `SURGERY_OPTIONS`, 80+ options)

#### **11. Surgery Section**
- **Surgeries** (80+ options in `SURGERY_OPTIONS`)
  - Examples: "FOREIGNBODY", "GLAUCOMA", "CATARACT", "PTERYGIUM", etc.

#### **12. Patient History**
- **Lens Options** (NEEDS TO BE ADDED)
  - This was mentioned by user but not currently in the form

---

## 🗂️ Master Data Categories Required

Based on the analysis, we need these Master Data categories:

### **Existing Categories** (to expand):
1. ✅ **Complaints** - Keep and populate from current list
2. ✅ **Treatments** - Keep and populate from current list
3. ✅ **Medicines** - Keep and populate from current list
4. ✅ **Surgeries** - Keep and populate from current list
5. ✅ **Diagnostic Tests** - Already exists as "Tests"
6. ✅ **Eye Conditions** - Already exists as "Conditions"
7. ✅ **Payment Methods** - Keep
8. ✅ **Insurance Providers** - Keep

### **New Categories to Add**:
9. 🆕 **Visual Acuity Options** - Vision measurements (6/6, 6/9, etc.)
10. 🆕 **Blood Tests** - Blood investigation options (CBC, BT, CT, etc.)
11. 🆕 **Diagnosis** - All diagnosis options
12. 🆕 **Dosages** - Dosage frequencies and instructions
13. 🆕 **Routes** - Medicine administration routes (Oral, Topical, IV, etc.)
14. 🆕 **Eye Selection** - Right eye, Left eye, Both eye
15. 🆕 **Visit Types** - First, Follow-up-1, Follow-up-2, etc.
16. 🆕 **SAC Status** - Patent, Not Patent, Regurgitant
17. 🆕 **IOP Ranges** - I.O.P measurement ranges
18. 🆕 **Lens Options** - Different lens types (user requested)

---

## 🏗️ Implementation Strategy

### **Phase 1: Create Master Data Context**
Create a React Context to share Master Data across the entire application.

**File**: `/contexts/master-data-context.tsx`

```tsx
interface MasterData {
  complaints: string[]
  treatments: string[]
  medicines: string[]
  surgeries: string[]
  diagnosticTests: string[]
  eyeConditions: string[]
  paymentMethods: string[]
  insuranceProviders: string[]
  visualAcuity: string[]
  bloodTests: string[]
  diagnosis: string[]
  dosages: string[]
  routes: string[]
  eyeSelection: string[]
  visitTypes: string[]
  sacStatus: string[]
  iopRanges: string[]
  lensOptions: string[]
}
```

### **Phase 2: Expand Master Data Page**
Update `/app/(dashboard)/dashboard/master/page.tsx` to include all 18 categories with tabs.

### **Phase 3: Update Cases Form**
Replace all hardcoded dropdown arrays with data from Master Data Context.

### **Phase 4: Fix Button Colors**
- **Case History Button**: Change from orange to black
- **Action Buttons**: Use consistent blue (primary color)
- **Next/Previous Buttons**: Use primary blue
- **Add Case Button**: Use primary blue

---

## 📝 Detailed Implementation Steps

### Step 1: Create Master Data Context
- [x] Create context file
- [x] Define interface for all 18 categories
- [x] Initialize with current hardcoded data
- [x] Provide add/delete functions
- [x] Wrap app with provider

### Step 2: Update Master Data Page
- [x] Add 10 new tabs (total 18)
- [x] Populate initial data from current constants
- [x] Connect add/delete handlers
- [x] Update statistics cards
- [x] Add search functionality per tab

### Step 3: Connect Cases Form to Context
- [x] Import Master Data Context
- [x] Replace all hardcoded arrays
- [x] Update SimpleCombobox components
- [x] Test all dropdowns

### Step 4: Fix Button Colors
- [x] Find Case History button (orange)
- [x] Change to black/secondary
- [x] Verify action buttons are primary blue
- [x] Check consistency across form

### Step 5: Testing
- [x] Add item in Master Data → appears in Cases form
- [x] Delete item in Master Data → removed from Cases form
- [x] All dropdowns working
- [x] Button colors consistent

---

## 🎨 Button Color Specifications

### Colors to Use:
- **Primary Blue** (Action buttons): `className="...primary blue styles"`
  - Add Case
  - Next
  - Previous
  - Save
  - Submit
  - Add buttons

- **Black/Secondary** (Case History): `className="...secondary or outline styles"`
  - Case History tab/button

- **Destructive Red** (Delete): Keep existing red for delete actions

---

## 🔄 Data Flow

```
Master Data Page (Admin adds/deletes)
        ↓
Master Data Context (State management)
        ↓
Cases Form (Consumes data in dropdowns)
```

---

## ✅ Success Criteria

1. All 18 Master Data categories visible in tabs
2. Admin can add new items to any category
3. Admin can delete items from any category
4. Cases form dropdowns populate from Master Data Context
5. Adding item in Master Data immediately available in Cases form
6. Deleting item in Master Data removes from Cases form dropdowns
7. Button colors consistent throughout UI
8. Toast notifications work for all operations

---

## 📦 Files to Modify

1. **NEW**: `/contexts/master-data-context.tsx` - Create context
2. **UPDATE**: `/app/(dashboard)/dashboard/master/page.tsx` - Add 10 new tabs
3. **UPDATE**: `/components/case-form.tsx` - Connect to context
4. **UPDATE**: `/app/(dashboard)/layout.tsx` - Wrap with provider
5. **UPDATE**: Button colors in Cases form

---

## 🚀 Estimated Timeline

- Phase 1 (Context): 15 minutes
- Phase 2 (Master Data Page): 30 minutes  
- Phase 3 (Cases Form): 20 minutes
- Phase 4 (Button Colors): 10 minutes
- Phase 5 (Testing): 15 minutes

**Total: ~90 minutes**

---

## 📋 Current Progress

- [x] Analysis complete
- [x] Plan created
- [ ] Implementation in progress...

