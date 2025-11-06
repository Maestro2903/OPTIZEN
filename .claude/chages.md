# Comprehensive Plan to Replicate OpticNauts Application

## Project Overview
OpticNauts is an **Ophthalmology Management System** designed to streamline patient care, case management, operations, billing, and reporting for eye care practices.

---

## Technical Stack Recommendation

### Frontend
- **Framework**: React.js with TypeScript
- **UI Library**: Material-UI or Ant Design
- **State Management**: Redux Toolkit or Zustand
- **Form Management**: React Hook Form
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Date Handling**: date-fns or Day.js
- **Rich Text Editor**: Quill or Draft.js
- **Drawing Canvas**: Fabric.js or Konva.js (for eye diagram tool)
- **PDF Generation**: jsPDF + html2canvas or React-PDF
- **Charts**: Recharts or Chart.js

### Backend
- **Framework**: Node.js with Express.js or NestJS
- **Database**: PostgreSQL (primary) + MongoDB (for file storage)
- **ORM**: Prisma or TypeORM
- **Authentication**: JWT + bcrypt
- **File Storage**: AWS S3 or local storage with multer
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Joi or class-validator

### DevOps
- **Containerization**: Docker
- **Version Control**: Git
- **CI/CD**: GitHub Actions or GitLab CI
- **Hosting**: AWS/Azure/DigitalOcean

---

## Database Schema Design

### Core Tables

```sql
-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'staff') NOT NULL,
    full_name VARCHAR(100),
    mobile VARCHAR(15),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    age INTEGER,
    gender ENUM('Male', 'Female', 'Other'),
    mobile VARCHAR(15),
    email VARCHAR(100),
    blood_group VARCHAR(5),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    district VARCHAR(50),
    remarks TEXT,
    other_information TEXT,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cases
CREATE TABLE cases (
    id UUID PRIMARY KEY,
    case_no VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    case_date DATE NOT NULL,
    visit_no VARCHAR(20),
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Case History
CREATE TABLE case_history (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    history_type VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patient History
CREATE TABLE patient_history (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),
    treatment_id UUID REFERENCES treatments(id),
    years INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Complaints
CREATE TABLE complaints (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    complaint_name VARCHAR(100) NOT NULL,
    eye ENUM('Right', 'Left', 'Both'),
    duration VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vision and Refraction
CREATE TABLE vision_refraction (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    eye ENUM('Right', 'Left') NOT NULL,
    
    -- Vision Unaided
    vision_unaided VARCHAR(20),
    
    -- Vision Pinhole
    vision_pinhole VARCHAR(20),
    
    -- Vision Aided
    vision_aided VARCHAR(20),
    
    -- Near Vision
    near_vision VARCHAR(20),
    
    -- Refraction - Distant
    distant_sph DECIMAL(5,2),
    distant_cyl DECIMAL(5,2),
    distant_axis INTEGER,
    distant_va VARCHAR(20),
    
    -- Refraction - Near
    near_sph DECIMAL(5,2),
    near_cyl DECIMAL(5,2),
    near_axis INTEGER,
    near_va VARCHAR(20),
    
    -- Refraction - PG
    pg_sph DECIMAL(5,2),
    pg_cyl DECIMAL(5,2),
    pg_axis INTEGER,
    pg_va VARCHAR(20),
    
    -- Auto Refraction
    auto_refraction TEXT,
    
    purpose VARCHAR(100),
    quality VARCHAR(100),
    remark TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Examination
CREATE TABLE examination (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    eye ENUM('Right', 'Left') NOT NULL,
    
    -- Anterior Segment
    eyelids VARCHAR(100),
    conjunctiva VARCHAR(100),
    cornea VARCHAR(100),
    anterior_chamber VARCHAR(100),
    iris VARCHAR(100),
    lens VARCHAR(100),
    anterior_remarks TEXT,
    
    -- Posterior Segment
    vitreous VARCHAR(100),
    disc VARCHAR(100),
    retina VARCHAR(100),
    posterior_remarks TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Blood Investigation
CREATE TABLE blood_investigations (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    cbc BOOLEAN DEFAULT false,
    rbs BOOLEAN DEFAULT false,
    hbsag BOOLEAN DEFAULT false,
    c_anca BOOLEAN DEFAULT false,
    thyroid_tests BOOLEAN DEFAULT false,
    bt BOOLEAN DEFAULT false,
    fbs BOOLEAN DEFAULT false,
    hcv BOOLEAN DEFAULT false,
    csr BOOLEAN DEFAULT false,
    s_creatinine BOOLEAN DEFAULT false,
    ct BOOLEAN DEFAULT false,
    pp2bs BOOLEAN DEFAULT false,
    ana_profile BOOLEAN DEFAULT false,
    crp BOOLEAN DEFAULT false,
    sodium_levels BOOLEAN DEFAULT false,
    pt_inr BOOLEAN DEFAULT false,
    hiv BOOLEAN DEFAULT false,
    p_anca BOOLEAN DEFAULT false,
    ra_factor BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Diagnosis
CREATE TABLE diagnosis (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    diagnosis_text TEXT NOT NULL,
    eye ENUM('Right', 'Left', 'Both'),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Diagnostic Tests
CREATE TABLE diagnostic_tests (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    
    -- SAC Syringing
    sac_syringing_right VARCHAR(50),
    sac_syringing_left VARCHAR(50),
    
    -- Intraocular Pressure
    iop_right VARCHAR(50),
    iop_left VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatments/Medicines
CREATE TABLE treatments (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('Medicine', 'Surgery', 'Therapy') NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Advice (Prescriptions)
CREATE TABLE advice (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    drug_name VARCHAR(100) NOT NULL,
    eye ENUM('Right', 'Left', 'Both'),
    dosage VARCHAR(50),
    route VARCHAR(50),
    duration VARCHAR(50),
    quantity INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Surgery Details
CREATE TABLE surgeries (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    surgery_name VARCHAR(100) NOT NULL,
    eye ENUM('Right', 'Left', 'Both'),
    anesthesia VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Eye Diagrams
CREATE TABLE eye_diagrams (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    eye ENUM('Right', 'Left') NOT NULL,
    diagram_data JSON NOT NULL, -- Stores canvas drawing data
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Operations
CREATE TABLE operations (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    patient_id UUID REFERENCES patients(id),
    operation_name VARCHAR(100) NOT NULL,
    operation_date DATE NOT NULL,
    begin_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER, -- in minutes
    eye ENUM('Right', 'Left', 'Both'),
    sys_diagnosis TEXT,
    anesthesia TEXT,
    operation_notes TEXT,
    payment_mode ENUM('Cash', 'Card', 'Insurance', 'Online') NOT NULL,
    amount DECIMAL(10,2),
    iol_name VARCHAR(100),
    iol_power VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Discharges
CREATE TABLE discharges (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    operation_id UUID REFERENCES operations(id),
    ipd_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    
    date_of_admission DATE NOT NULL,
    time_of_admission TIME NOT NULL,
    date_of_discharge DATE NOT NULL,
    time_of_discharge TIME NOT NULL,
    
    diagnosis TEXT,
    operation_details TEXT,
    anesthesia TEXT,
    treatment_of_discharge TEXT,
    
    advice_template VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Discharge Advice
CREATE TABLE discharge_advice (
    id UUID PRIMARY KEY,
    discharge_id UUID REFERENCES discharges(id),
    drug_name VARCHAR(100) NOT NULL,
    eye ENUM('Right', 'Left', 'Both'),
    dosage VARCHAR(50),
    route VARCHAR(50),
    duration VARCHAR(50),
    quantity INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY,
    certificate_type ENUM('Leave', 'Fitness', 'Concern', 'Other') NOT NULL,
    patient_id UUID REFERENCES patients(id),
    case_id UUID REFERENCES cases(id),
    patient_name VARCHAR(100),
    complaint_name VARCHAR(100),
    operation_name VARCHAR(100),
    issue_date DATE NOT NULL,
    consultation_date DATE,
    surgery_date DATE,
    certificate_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Billing
CREATE TABLE billing (
    id UUID PRIMARY KEY,
    ipd_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    case_id UUID REFERENCES cases(id),
    operation_id UUID REFERENCES operations(id),
    discharge_id UUID REFERENCES discharges(id),
    
    billing_date DATE NOT NULL,
    department_type ENUM('Surgery Billing', 'OPD', 'IPD') NOT NULL,
    
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing Items
CREATE TABLE billing_items (
    id UUID PRIMARY KEY,
    billing_id UUID REFERENCES billing(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    unit VARCHAR(20),
    rate DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master Data Tables

-- Master: Complaints
CREATE TABLE master_complaints (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master: Treatments
CREATE TABLE master_treatments (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master: Medicines
CREATE TABLE master_medicines (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50),
    dosage_options TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master: Surgeries
CREATE TABLE master_surgeries (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master: Dosages
CREATE TABLE master_dosages (
    id UUID PRIMARY KEY,
    dosage VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master: IOL (Intraocular Lens)
CREATE TABLE master_iol (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    power VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard Statistics (Materialized View or Computed)
CREATE VIEW dashboard_statistics AS
SELECT 
    (SELECT COUNT(*) FROM patients) as total_patients,
    (SELECT COUNT(*) FROM cases WHERE status = 'Active') as total_cases,
    (SELECT COUNT(*) FROM operations WHERE operation_date >= CURRENT_DATE - INTERVAL '30 days') as monthly_operations,
    (SELECT COUNT(*) FROM discharges WHERE date_of_discharge >= CURRENT_DATE - INTERVAL '30 days') as monthly_discharges,
    (SELECT SUM(final_amount) FROM billing WHERE billing_date >= CURRENT_DATE - INTERVAL '30 days') as monthly_revenue;

-- Audit Trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Application Architecture

### Folder Structure

```
opticnauts/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── styles/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── ChartCard.tsx
│   │   │   │   └── RecentItems.tsx
│   │   │   ├── patient/
│   │   │   │   ├── PatientList.tsx
│   │   │   │   ├── PatientForm.tsx
│   │   │   │   └── PatientSearch.tsx
│   │   │   ├── case/
│   │   │   │   ├── CaseList.tsx
│   │   │   │   ├── AddCase/
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   ├── CaseHistoryForm.tsx
│   │   │   │   │   ├── PatientHistoryForm.tsx
│   │   │   │   │   ├── ComplainForm.tsx
│   │   │   │   │   ├── VisionRefractionForm.tsx
│   │   │   │   │   ├── ExaminationForm.tsx
│   │   │   │   │   ├── BloodInvestigationForm.tsx
│   │   │   │   │   ├── DiagnosisForm.tsx
│   │   │   │   │   ├── DiagnosticTestForm.tsx
│   │   │   │   │   ├── AdviceForm.tsx
│   │   │   │   │   └── DiagramForm.tsx
│   │   │   │   └── CaseDetail.tsx
│   │   │   ├── operation/
│   │   │   │   ├── OperationList.tsx
│   │   │   │   ├── OperationForm.tsx
│   │   │   │   └── OperationDetail.tsx
│   │   │   ├── discharge/
│   │   │   │   ├── DischargeList.tsx
│   │   │   │   ├── DischargeForm.tsx
│   │   │   │   └── DischargeDetail.tsx
│   │   │   ├── billing/
│   │   │   │   ├── BillingList.tsx
│   │   │   │   ├── BillingForm.tsx
│   │   │   │   └── BillingDetail.tsx
│   │   │   ├── certificate/
│   │   │   │   ├── CertificateList.tsx
│   │   │   │   ├── CertificateForm.tsx
│   │   │   │   └── CertificateTemplates/
│   │   │   ├── master/
│   │   │   │   ├── ComplaintMaster.tsx
│   │   │   │   ├── TreatmentMaster.tsx
│   │   │   │   ├── MedicineMaster.tsx
│   │   │   │   └── ...
│   │   │   └── reports/
│   │   │       ├── CaseReport.tsx
│   │   │       ├── OperationReport.tsx
│   │   │       ├── DischargeReport.tsx
│   │   │       └── BillingInvoice.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   └── useDebounce.ts
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── Cases.tsx
│   │   │   ├── Operations.tsx
│   │   │   ├── Discharges.tsx
│   │   │   ├── Billing.tsx
│   │   │   ├── Certificates.tsx
│   │   │   └── Master.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── patientService.ts
│   │   │   ├── caseService.ts
│   │   │   ├── operationService.ts
│   │   │   ├── dischargeService.ts
│   │   │   ├── billingService.ts
│   │   │   └── certificateService.ts
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── patientSlice.ts
│   │   │   │   ├── caseSlice.ts
│   │   │   │   └── ...
│   │   │   └── api/
│   │   │       └── apiSlice.ts
│   │   ├── types/
│   │   │   ├── patient.ts
│   │   │   ├── case.ts
│   │   │   ├── operation.ts
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── environment.ts
│   │   │   └── swagger.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── patient.controller.ts
│   │   │   ├── case.controller.ts
│   │   │   ├── operation.controller.ts
│   │   │   ├── discharge.controller.ts
│   │   │   ├── billing.controller.ts
│   │   │   ├── certificate.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logger.middleware.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── patient.model.ts
│   │   │   ├── case.model.ts
│   │   │   ├── operation.model.ts
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── patient.routes.ts
│   │   │   ├── case.routes.ts
│   │   │   ├── operation.routes.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── patient.service.ts
│   │   │   ├── case.service.ts
│   │   │   ├── pdf.service.ts
│   │   │   └── email.service.ts
│   │   ├── types/
│   │   │   └── express.d.ts
│   │   ├── utils/
│   │   │   ├── bcrypt.ts
│   │   │   ├── jwt.ts
│   │   │   └── helpers.ts
│   │   ├── validators/
│   │   │   ├── patient.validator.ts
│   │   │   ├── case.validator.ts
│   │   │   └── ...
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Detailed Implementation Plan

### Phase 1: Project Setup & Infrastructure (Week 1)

#### 1.1 Initialize Project
- Set up Git repository
- Create frontend (React + TypeScript + Vite)
- Create backend (Node.js + Express + TypeScript)
- Configure ESLint, Prettier
- Set up Docker for PostgreSQL

#### 1.2 Database Setup
- Install and configure PostgreSQL
- Create database schema based on tables above
- Set up Prisma ORM
- Create initial migrations
- Seed master data (complaints, medicines, etc.)

#### 1.3 Authentication System
- Implement JWT-based authentication
- Create login/logout endpoints
- Set up protected routes
- Create user management (CRUD)

---

### Phase 2: Core UI Components (Week 2)

#### 2.1 Layout Components
- **Header**: Logo, user profile, notifications
- **Sidebar**: Navigation menu with icons
- **MainLayout**: Container for all pages
- **Footer**: Copyright info

#### 2.2 Common Components
- **Button**: Primary, secondary, danger variants
- **Input**: Text, number, email, password variants
- **Select**: Dropdown with search capability
- **Table**: Sortable, filterable, paginated
- **Modal**: For forms and confirmations
- **DatePicker**: For date/time selection
- **Checkbox**: For boolean selections
- **RadioButton**: For single selections
- **TextArea**: For long text inputs
- **LoadingSpinner**: For async operations
- **AlertMessage**: Success/error/warning notifications

#### 2.3 Theme & Styling
- Set up color scheme (orange primary as per branding)
- Create responsive grid system
- Define typography
- Create CSS variables for consistency

---

### Phase 3: Patient Management (Week 3)

#### 3.1 Patient List Page
**Features:**
- Table with columns: SR. NO., NAME, AGE, GENDER, MOBILE, EMAIL, STATE, ACTION
- Search/filter by name, mobile, email
- Pagination (10 items per page)
- Action buttons: Edit, Delete, View

**Components:**
- `PatientList.tsx`
- `PatientSearch.tsx`
- `PatientTable.tsx`

**API Endpoints:**
```
GET    /api/patients           - Get all patients (with pagination & filters)
GET    /api/patients/:id       - Get single patient
POST   /api/patients           - Create patient
PUT    /api/patients/:id       - Update patient
DELETE /api/patients/:id       - Delete patient
```

#### 3.2 Add/Edit Patient Form
**Fields:**
- Patient Name* (text)
- Age* (number)
- Gender* (select: Male/Female/Other)
- Mobile No* (text, 10 digits validation)
- Email (email validation)
- Blood Group (select: A+, A-, B+, B-, O+, O-, AB+, AB-)
- Address (textarea)
- City (text)
- State (text)
- District (text)
- Remarks (textarea)
- Other Information (textarea)

**Validation:**
- Required fields marked with *
- Mobile: 10 digits, numbers only
- Email: valid email format
- Age: 1-120 range

**Component:** `PatientForm.tsx` (used in modal)

---

### Phase 4: Case Management - Part 1: Register & Basic Info (Week 4)

#### 4.1 Case List Page
**Features:**
- Table with columns: SR. NO., CASE NO, PATIENT NAME, AGE, EMAIL, MOBILE, GENDER, STATE, ACTION
- Search by case number, patient name, mobile
- Filter by date range, status
- Pagination
- Quick actions: View, Edit, Delete, Print

**Component:** `CaseList.tsx`

**API Endpoints:**
```
GET    /api/cases              - Get all cases (with filters)
GET    /api/cases/:id          - Get single case
POST   /api/cases              - Create case
PUT    /api/cases/:id          - Update case
DELETE /api/cases/:id          - Delete case
```

#### 4.2 Add Case - Register Form
**Multi-step form with left sidebar navigation:**

**Step 1: Register**
- Case No* (auto-generated, format: OPT + YYXXXX)
- Case Date* (date picker, default: today)
- Visit No* (select: First, Follow-up-1, Follow-up-2, etc.)
- Patient* (searchable dropdown with "Add New Patient" button)

**Component:** `RegisterForm.tsx`

---

### Phase 5: Case Management - Part 2: Medical Forms (Week 5-6)

#### 5.1 Case History Form
**Component:** `CaseHistoryForm.tsx`
- Display message: "No case history data is available for this patient"
- Allow adding history entries (free text)

#### 5.2 Patient History Form
**Component:** `PatientHistoryForm.tsx`
- Toggle: Past / Treatment (orange highlight on active)
- Treatment dropdown (from master_treatments)
- Years field (e.g., "2 Years")
- "+ Add Treatment" button
- Table showing: TREATMENT, YEARS, ACTION (delete)
- **Medicines Section:**
  - R / L / B checkboxes for eye selection
  - Medicine Name (searchable dropdown)
  - Type (dropdown)
  - Advice (text)
  - Duration (text)
  - "+ Add Medicine" button
  - Table: MEDICINE NAME, TYPE, ADVICE, DURATION, ACTION

#### 5.3 Complain Form
**Component:** `ComplainForm.tsx`
- Toggle: Common Complain (orange when ON)
- Complaint dropdown (from master_complaints)
- Eye dropdown (Right/Left/Both)
- Duration field (text)
- "+ Add" button
- Table: COMPLAIN, EYE, DURATION, ACTION
- Remarks textarea with print checkbox

#### 5.4 Vision and Refraction Form
**Component:** `VisionRefractionForm.tsx`

**Layout:** Two columns (Right Eye | Left Eye)

**Vision Section:**
- Visual Acuity (Unaided) - VP dropdown
- Pin-Hole (VP) - VP dropdown
- Visual Acuity (Aided) - VP dropdown
- Near Visual - VP dropdown

**Refraction Section:**
- **Distant:** SPH, CYL, AXIS, VA (dropdown) - for both eyes
- **Near:** SPH, CYL, AXIS, VA - for both eyes
- **PG:** SPH, CYL, AXIS, VA - for both eyes
- **Purpose:** Dropdown (Constant Use, etc.)
- **Quality:** Text input
- **Remark:** Textarea

**Auto Refraction Section:**
- Right Eye: SPH, CYL, AXIS fields
- Left Eye: SPH, CYL, AXIS fields

#### 5.5 Examination Form
**Component:** `ExaminationForm.tsx`

**Anterior Segment** (with print checkbox):
- Eyelids: Right Eye / Left Eye text inputs
- Conjunctiva: Right Eye / Left Eye
- Cornea: Right Eye / Left Eye
- Anterior Chamber: Right Eye / Left Eye
- Iris: Right Eye / Left Eye
- Lens: Right Eye / Left Eye
- Remarks: Textarea

**Posterior Segment** (with print checkbox):
- Vitreous: Right Eye / Left Eye
- Disc: Right Eye / Left Eye
- Retina: Right Eye / Left Eye
- Remarks: Textarea

**General Remarks** (with print checkbox):
- Textarea

#### 5.6 Blood Investigation Form
**Component:** `BloodInvestigationForm.tsx`

Checkboxes in 4 columns:
- CBC, BT, CT, PT-INR
- RBS, FBS, PP2BS, HIV
- HbSAG, HCV, ANA-PROFILE, P-ANCA
- C-ANCA, CSR, CRP, R.A.FACTOR
- T3, T4, TSH, ANTI TPO, S CREATININE, S. SODIUM LEVELS

#### 5.7 Diagnosis Form
**Component:** `DiagnosisForm.tsx`
- Diagnosis textarea
- Eye dropdown (Right/Left/Both)
- "+ Add" button
- Table: DIAGNOSIS, EYE, ACTION

#### 5.8 Diagnostic Test Form
**Component:** `DiagnosticTestForm.tsx`

**SAC Syringing:**
- Right Eye: Status dropdown
- Left Eye: Status dropdown
- Toggle for active

**I.O.P. (Intraocular Pressure):**
- Right Eye: Dropdown (Select I.O.P Right)
- Left Eye: Dropdown (Select I.O.P Left)
- Toggle for active

---

### Phase 6: Case Management - Part 3: Treatment & Diagram (Week 7)

#### 6.1 Advice Form
**Component:** `AdviceForm.tsx`

**Drug/Medicine Section:**
- Drug Name toggle (ON = orange)
- Eye dropdown (Right/Left/Both)
- Dosage dropdown
- Route dropdown (e.g., "Select route")
- Duration (text, e.g., "Select days")
- Quantity dropdown
- "+ Add" button
- Table: DRUG NAME, EYE, DOSAGE, ROUTE, DURATION, QTY, ACTION
- Message: "No advice added."

**Surgery Details Section:**
- Eye dropdown
- Surgery Name dropdown (toggle ON = orange)
- Anesthesia text input
- "+ Add" button
- Table: EYE, SURGERY NAME, ANESTHESIA, ACTION
- Message: "No surgery details added."

**Remarks Section:**
- Textarea with print checkbox

#### 6.2 Eye Diagram Tool
**Component:** `DiagramForm.tsx`

**Features:**
- Canvas for drawing on eye images
- Two canvases: Right Eye | Left Eye
- Toolbar icons:
  - Undo (circular arrow left)
  - Redo (circular arrow right)
  - Clear (trash icon)
  - Copy (clipboard icon)
  - Download (download arrow)
  - Color picker (current color indicator)
  - Brush size slider (e.g., "2px")
  - Active indicator: "Active: Right Eye" / "Active: Left Eye"

**Eye Diagram:**
- Pre-loaded eye illustration (almond shape with iris and pupil)
- Clickable to activate that canvas for drawing

**Tip Message:**
"Click on either eye canvas to make it active. Use the toolbar above to draw, undo, redo, clear individual canvas or both, or download both eyes together. Adjust color and brush size as needed."

**Implementation:**
- Use Fabric.js or Konva.js for canvas
- Store drawing data as JSON in database
- Generate PNG image for reports
- Support touch and mouse input

---

### Phase 7: Operation Management (Week 8)

#### 7.1 Operation List Page
**Component:** `OperationList.tsx`

**Table Columns:**
- SR. NO.
- DATE
- PATIENT NAME
- OPERATION
- BEGIN TIME
- END TIME
- DURATION
- AMOUNT
- ACTION (Edit, Delete, View, Print icons)

**Filters:**
- Date filter
- Patient Name search
- "+ Add Operation" button
- Filter & Reset buttons

**Sample Data:**
- 15/10/2025, Karan Singh, FOREIGNBODY, 12:00, 13:00, 60 min, ₹30000
- 11/10/2025, Arjun Verma, FOREIGNBODY, 12:00, 13:00, 60 min, ₹30000

#### 7.2 Add Operation Form
**Component:** `OperationForm.tsx`

**Fields:**
- Patient* (dropdown with "Add New Patient" link)
- Case* (dropdown, filtered by patient)
- Operation toggle
- Date* (date picker, default: 06-11-2025)
- Begin Time* (time picker)
- End Time* (time picker)
- Duration* (calculated or manual input)
- Eye Name* (dropdown: Right/Left/Both)
- Sys. Diagnosis (textarea)
- Anesthesia (textarea)
- Operation Notes (rich text editor with print checkbox)
  - Toolbar: Normal dropdown, B, I, U, Strikethrough, Lists, Indent, Align, Link, Clear formatting
- Payment By (dropdown with print checkbox): Cash, Card, UPI, etc.
- Amount* (number input)
- IOL Name (text with print checkbox)
- IOL Power (text input)

**Buttons:** Add, Discard

**API Endpoints:**
```
GET    /api/operations         - Get all operations
GET    /api/operations/:id     - Get operation details
POST   /api/operations         - Create operation
PUT    /api/operations/:id     - Update operation
DELETE /api/operations/:id     - Delete operation
```

---

### Phase 8: Discharge Management (Week 9)

#### 8.1 Discharge List Page
**Component:** `DischargeList.tsx`

**Table Columns:**
- SR. NO.
- DATE OF ADMISSION
- PATIENT NAME
- DATE OF DISCHARGE
- BEGIN TIME
- END TIME
- DURATION
- AMOUNT (if linked to billing)
- ACTION

**Note:** Table appears empty initially based on screenshots

#### 8.2 Add Discharge Form
**Component:** `DischargeForm.tsx`

**Fields:**

**Top Section:**
- IPD Number* (auto-generated dropdown, e.g., "15-10-2025 - 412")
- Patient* (dropdown with "Add New Patient" button)
- Case* (dropdown)
- Discharge Date* (date picker)

**Patient Information Display Box** (gray background):
- Name: [Patient Name]
- Age: [Age]
- Gender: [Gender]
- Mobile: [Mobile]
- Email: [Email]

**Operation Dropdown:**
- Select from linked operations (e.g., "15-10-2025 - 412")

**Admission Details:**
- Date of Admission* (date picker)
- Date of Discharge* (date picker)
- Time of Admission* (time picker)
- Time of Discharge* (time picker)

**Medical Information:**
- Diagnosis (textarea with print checkbox)
- Operation Details (rich text editor with print checkbox)
  - Same toolbar as operation notes
- Anesthesia (textarea with print checkbox)
- Treatment of Discharge (textarea)

**Advice on Discharge:**
- Dropdown: "Select default advice template" (with print checkbox)
  - Options: DCR-Extension, Cataract, etc.
- **Add Medicine Section:**
  - Drug Name toggle (ON = orange)
  - Eye dropdown
  - Dosage dropdown
  - Route dropdown
  - Duration (text, "Select days")
  - Quantity dropdown
  - "+ Add" button
- Table: DRUG NAME, EYE, DOSAGE, ROUTE, DURATION, QTY, ACTION
- Message: "No advice added."

**Buttons:** Add, Discard

**API Endpoints:**
```
GET    /api/discharges         - Get all discharges
GET    /api/discharges/:id     - Get discharge details
POST   /api/discharges         - Create discharge
PUT    /api/discharges/:id     - Update discharge
DELETE /api/discharges/:id     - Delete discharge
```

---

### Phase 9: Billing Management (Week 10)

#### 9.1 Billing List Page
**Component:** `BillingList.tsx`

**Table Columns:**
- SR. NO.
- DATE
- PATIENT NAME
- DEPARTMENT TYPE (e.g., "surgeryBilling", "OPD", "IPD")
- BILLING TYPE (e.g., "mainBill")
- TOTAL AMOUNT (₹)
- ACTION

**Filters:**
- Patient Name search
- Filter & Reset buttons
- "+ Add Billing" button

**Pagination:** 10/page

#### 9.2 Add Billing Form
**Component:** `BillingForm.tsx`

**Fields:**
- IPD Number* (auto-generated or text input)
- Patient* (dropdown with "Add New Patient" button)
- Case* (dropdown, filtered by patient)
- Operation* (dropdown, filtered by case)
- Discharge (dropdown, optional)
- Department* (dropdown): Surgery Billing, OPD, IPD, etc.
- Date* (date picker, default: 06-11-2025)

**Billing Items Section:**
- Table with columns: ITEM, UNIT, RATE, DISCOUNT (IN RS.), AMOUNT, REMARKS
- "+ Add Item" button (orange)
- Each row has:
  - Item (dropdown)
  - Unit (text)
  - Rate (number)
  - Disc (discount in Rs, number)
  - Amt (calculated, number)
  - Remarks (text)

**Total Display:**
- Right-aligned: "Total: 0.00"

**Buttons:** Add, Discard

**Calculation Logic:**
```
Item Amount = (Rate * Unit) - Discount
Total Amount = Sum of all Item Amounts
```

**API Endpoints:**
```
GET    /api/billing            - Get all bills
GET    /api/billing/:id        - Get bill details
POST   /api/billing            - Create bill
PUT    /api/billing/:id        - Update bill
DELETE /api/billing/:id        - Delete bill
GET    /api/billing/generate-ipd - Generate IPD number
```

---

### Phase 10: Certificate Management (Week 11)

#### 10.1 Certificate List Page
**Component:** `CertificateList.tsx`

**Table Columns:**
- SR. NO.
- DATE
- PATIENT NAME
- CASE NO.
- CERTIFICATE TYPE (e.g., "illnessCertificate", "concernCertificate")
- CERTIFICATE LINK (eye icon to view)
- ACTION (Edit, Delete icons)

**Filters:**
- Date filter
- Patient Name search
- Certificate type dropdown
- Filter & Reset buttons
- "+ Add Certificate" button

**Pagination:** 10/page

#### 10.2 Add Certificate Form
**Component:** `CertificateForm.tsx`

**Fields:**
- Certificate Type* (dropdown)
  - Options: Leave Certificate, Fitness Certificate, Concern Certificate, etc.
- Patient* (dropdown with "Add New Patient" button)
- Case* (dropdown, filtered by patient)
- Patient Name* (text, auto-filled from patient)
- Complaint Name (text)
- Operation Name (text)
- Date* (date picker, default: 13-10-2025)
- Consultation Date (date picker)
- Surgery Date (date picker)

**Buttons:** Add, Discard

**Certificate Types & Templates:**

1. **Leave Certificate:**
   - Template includes patient details, operation date, diagnosis
   - Rest period recommendation
   - Doctor signature

2. **Fitness Certificate:**
   - States patient is fit to resume work/academics
   - Post-operation assessment
   - Clearance date

3. **Concern Certificate ("To Whomsoever It May Concern"):**
   - Chief complaints
   - Examination details
   - Treatment advice
   - Follow-up schedule

**API Endpoints:**
```
GET    /api/certificates       - Get all certificates
GET    /api/certificates/:id   - Get certificate
POST   /api/certificates       - Create certificate
PUT    /api/certificates/:id   - Update certificate
DELETE /api/certificates/:id   - Delete certificate
GET    /api/certificates/:id/pdf - Generate PDF
```

---

### Phase 11: Master Data Management (Week 12)

#### 11.1 Master Menu
**Component:** `MasterMenu.tsx`

**Dropdown Options:**
- Lens
- Complaint
- Treatment
- Medicine
- Dosage
- Surgery
- Blood Investigation
- Diagnosis

#### 11.2 Complaint Master
**Component:** `ComplaintMaster.tsx`

**Features:**
- List of complaints
- Search by name
- "+ Add Complaint" button
- Edit/Delete actions

**Sample Data:**
1. Detail
2. foreignbody sensation
3. dimness of vision
4. diplopia
5. SUDDEN LOSS OF VISION
6. FLASHES OF LIGHT
7. REDNESS OF EYES
8. STIKENESS (should be STICKINESS)
9. HEADACHE
10. ITHCING IN EYES (should be ITCHING)

**Form Fields:**
- Complaint Name* (text)
- Is Active (toggle)

**Similar Structure for:**
- Treatment Master
- Medicine Master (add: Type, Dosage Options)
- Dosage Master
- Surgery Master (add: Description)
- Lens Master
- Diagnosis Master

**API Pattern:**
```
GET    /api/master/complaints  - Get all complaints
POST   /api/master/complaints  - Add complaint
PUT    /api/master/complaints/:id - Update
DELETE /api/master/complaints/:id - Delete
```

---

### Phase 12: Dashboard (Week 13)

#### 12.1 Dashboard Layout
**Component:** `Dashboard.tsx`

**Top Section:**
- Welcome message: "Welcome to Optic Glow! 👋"
- Subtitle: "Medicine Practice Management System"
- **Monthly Revenue Card:** ₹1,222.00

**Medical Statistics** (4 cards):
1. **Total Patients:** 962 (View Details link)
2. **Total Cases:** 963 (View Details link)
3. **Operations:** 734 (View Details link)
4. **Certificates:** 371 (View Details link)

**Quick Actions** (4 buttons):
1. Add Patient (Register new patient icon)
2. New Case (Create medical case icon)
3. Schedule Operation (Plan surgery icon)
4. Generate Bill (Create invoice icon)

**Medical Data Overview** (Bar Chart):
- X-axis: Patients, Cases, Operations, Discharges, Billing
- Y-axis: Count (0-1000)
- Color: Blue bars

**Data Distribution** (Pie Chart):
- Patients: 30%
- Cases: 30%
- Billing: 7%
- Discharges: 11%
- Operations: 97%
- Colors: Blue, Green, Red, Orange, Purple

**Performance Summary** (4 metrics):
1. **Success Rate:** 39% (Cases to Discharges)
2. **Operation Efficiency:** 76% (Cases requiring Surgery)
3. **Billing Coverage:** 23% (Patients with Bills)
4. **Case Activity:** 100% (Patients with Cases)

**Recent Patients** (5 items with "View All" link):
1. PRIYA NAIR - 9868412848
2. AARAV MEHTA - 9856452114
3. NISHANT KAREKAR - 9319018067
4. KEVIN PATEL - 1231359183
5. AISHABEN THAKIR - 6456445154

**Recent Cases** (5 items with "View All" link):
1. AARAV MEHTA - 02/08/2025
2. NISHANT KAREKAR - 26/09/2025
3. PRIYA NAIR - 19/08/2025
4. AISHABEN THAKIR - 15/08/2025
5. AISHABEN THAKIR - 16/08/2025

**Recent Billing** (5 items with "View All" link):
1. NISHANT KAREKAR - 16/09/2025 - ₹30000.00
2. YAGNA KAUSHAL - 16/07/2025 - ₹50000
3. YULAX JIRANI PATEL - 18/03/2025 - ₹50000
4. YOGESH RANJAN - 12/07/2025 - ₹8500
5. VIDHYALBA PATEL - 26/03/2024 - ₹58000

**Bottom Section:**
- Total Medicines: 1024 (View Details)
- Total Lens Types: 77 (View Details)
- Total Treatments: 153 (View Details)
- Total Certificates: 4 (View Details)

**API Endpoints:**
```
GET /api/dashboard/stats          - All statistics
GET /api/dashboard/recent-patients
GET /api/dashboard/recent-cases
GET /api/dashboard/recent-billing
GET /api/dashboard/chart-data
```

---

### Phase 13: Report Generation (Week 14)

#### 13.1 Report Templates

**1. Case Report**
**Component:** `CaseReport.tsx`

**Content:**
- Letterhead with logo
- Case No, Date
- Patient Information: Name, Age/Sex, Address, Mobile
- Chief Complaints
- Vision & Refraction (table format)
- Examination: Anterior & Posterior Segment
- Diagnosis
- Advice (medicines table)
- Doctor signature

**2. Operation Report**
**Component:** `OperationReport.tsx`

**Content:**
- Letterhead
- Date, Case No
- Patient Information
- Operation Details:
  - Operation name
  - Eye operated
  - Diagnosis
  - Anesthesia
- Medical Information (if IOL):
  - IOL details
- Payment Information
- Doctor signature

**3. Discharge Report**
**Component:** `DischargeReport.tsx`

**Content:**
- Letterhead
- Patient Information
- IPD No, Case No
- Date of Admission/Discharge
- Time of Admission/Discharge
- Diagnosis
- Operation Details
- Anesthesia Used
- Operative Note
- Advice (medicines table)
- Doctor signature

**4. Billing Invoice**
**Component:** `BillingInvoice.tsx`

**Content:**
- Letterhead: "INVOICE - MAINBILL"
- Bill No, Bill Date
- Case No, IPD/Reg No
- Admission/Discharge dates
- Patient Name
- Name of TPA (if applicable)
- Billing Items table:
  - DESCRIPTION, UNIT, RATE, DISCOUNT, AMOUNT
- **Indoor Treatment Charges Summary:**
  - Total Treatment Charges
  - Discount
  - Balance Amount (in words)

**5. Certificate Templates**
**Component:** `CertificateTemplates.tsx`

Three types already covered in Phase 10.

#### 13.2 PDF Generation
**Service:** `pdf.service.ts`

**Features:**
- Use jsPDF + html2canvas
- Generate PDFs from HTML templates
- Include logo and branding
- Support letterhead design
- Enable download and email

**Implementation:**
```typescript
// Example structure
export class PDFService {
  async generateCaseReport(caseId: string): Promise<Blob> {
    // Fetch case data
    // Render HTML template
    // Convert to PDF
    // Return blob
  }
  
  async generateOperationReport(operationId: string): Promise<Blob> { ... }
  async generateDischargeReport(dischargeId: string): Promise<Blob> { ... }
  async generateBillingInvoice(billId: string): Promise<Blob> { ... }
  async generateCertificate(certificateId: string): Promise<Blob> { ... }
}
```

---

### Phase 14: Employee Management (Week 15)

**Note:** This feature is mentioned in the top navigation but no screenshots were provided. Based on standard practice, here's the suggested implementation:

#### 14.1 Employee List
**Component:** `EmployeeList.tsx`

**Table Columns:**
- SR. NO.
- NAME
- ROLE (Doctor, Admin, Staff)
- EMAIL
- MOBILE
- STATUS (Active/Inactive)
- ACTION

#### 14.2 Add Employee Form
**Component:** `EmployeeForm.tsx`

**Fields:**
- Full Name*
- Email*
- Mobile*
- Role* (dropdown: Doctor, Admin, Staff)
- Username*
- Password* (only when creating)
- Status (toggle: Active/Inactive)

**API Endpoints:**
```
GET    /api/employees          - Get all employees
GET    /api/employees/:id      - Get employee
POST   /api/employees          - Create employee
PUT    /api/employees/:id      - Update employee
DELETE /api/employees/:id      - Delete employee
```

---

### Phase 15: Additional Features & Refinements (Week 16)

#### 15.1 Search & Filters
- Implement global search across entities
- Advanced filters for each list page
- Date range pickers
- Export to Excel functionality

#### 15.2 Audit Trail
- Log all create/update/delete operations
- Track user actions
- Timestamp all changes

#### 15.3 Notifications
- Success messages after operations
- Error handling with user-friendly messages
- Confirmation dialogs for delete actions

#### 15.4 Responsive Design
- Mobile-friendly layouts
- Tablet optimization
- Touch-friendly controls

#### 15.5 Performance Optimization
- Lazy loading of routes
- Image optimization
- API response caching
- Debouncing search inputs

---

### Phase 16: Testing & Deployment (Week 17-18)

#### 16.1 Testing
- Unit tests for services and utilities
- Integration tests for API endpoints
- End-to-end tests for critical flows
- User acceptance testing (UAT)

#### 16.2 Documentation
- API documentation (Swagger)
- User manual
- Developer documentation
- Deployment guide

#### 16.3 Deployment
- Set up production database
- Configure environment variables
- Deploy backend to server
- Deploy frontend to CDN
- Set up SSL certificates
- Configure backups

---

## Key Features Summary

### 1. **Patient Management**
- Add/Edit/Delete patients
- Comprehensive patient profiles
- Search and filter capabilities

### 2. **Case Management**
- Multi-step case registration
- Detailed medical examination forms
- Vision and refraction testing
- Blood investigation tracking
- Diagnosis recording
- Treatment planning

### 3. **Operation Management**
- Schedule and track operations
- Record operation details
- IOL information
- Payment tracking

### 4. **Discharge Management**
- Comprehensive discharge process
- Admission/discharge date-time tracking
- Discharge advice templates
- Treatment summaries

### 5. **Billing System**
- Itemized billing
- Multiple departments (OPD/IPD/Surgery)
- Discount management
- Invoice generation

### 6. **Certificate Generation**
- Leave certificates
- Fitness certificates
- Medical certificates
- Customizable templates

### 7. **Master Data Management**
- Complaints
- Treatments
- Medicines
- Dosages
- Surgeries
- Diagnoses

### 8. **Reporting**
- Case reports
- Operation reports
- Discharge summaries
- Billing invoices
- Printable formats with letterhead

### 9. **Eye Diagram Tool**
- Interactive drawing canvas
- Separate canvases for each eye
- Drawing tools (brush, eraser)
- Undo/redo functionality
- Save and export diagrams

### 10. **Dashboard & Analytics**
- Real-time statistics
- Performance metrics
- Recent activities
- Data visualization (charts)

---

## Design Guidelines

### Color Scheme
- **Primary Orange:** #FF6B35 (buttons, highlights)
- **Dark Gray:** #333333 (text)
- **Light Gray:** #F5F5F5 (backgrounds)
- **White:** #FFFFFF
- **Success Green:** #4CAF50
- **Error Red:** #F44336
- **Warning Yellow:** #FFC107

### Typography
- **Font Family:** 'Inter', 'Roboto', or system fonts
- **Headings:** Bold, larger sizes
- **Body:** Regular weight, readable size (14-16px)
- **Labels:** Medium weight, 12-14px

### UI Elements
- **Buttons:**
  - Primary: Orange background, white text, rounded corners
  - Secondary: White background, gray border, gray text
  - Danger: Red background, white text
- **Forms:**
  - Clear labels above inputs
  - Required fields marked with asterisk (*)
  - Validation messages below fields
- **Tables:**
  - Striped rows for readability
  - Hover effects
  - Action icons on the right
- **Modals:**
  - Centered on screen
  - Semi-transparent backdrop
  - Close button (X) in top-right

### Branding
- **Logo:** "OpticNauts" with icon
- **Tagline:** "See Beyond. Manage Smarter."
- **Letterhead Design:**
  - Logo at top
  - Orange geometric patterns
  - Professional layout

---

## API Structure Examples

### 1. Patient API
```typescript
// GET /api/patients?page=1&limit=10&search=john
{
  data: [
    {
      id: "uuid",
      patient_name: "John Doe",
      age: 45,
      gender: "Male",
      mobile: "9876543210",
      email: "john@example.com",
      blood_group: "O+",
      address: "123 Street",
      city: "Mumbai",
      state: "Maharashtra",
      district: "Mumbai",
      created_at: "2025-01-15T10:30:00Z"
    }
  ],
  total: 100,
  page: 1,
  limit: 10
}

// POST /api/patients
{
  patient_name: "Jane Smith",
  age: 32,
  gender: "Female",
  mobile: "9876543211",
  email: "jane@example.com",
  // ... other fields
}

// Response: 201 Created
{
  id: "new-uuid",
  patient_name: "Jane Smith",
  // ... all fields
}
```

### 2. Case API
```typescript
// POST /api/cases
{
  case_no: "OPT251001",
  patient_id: "patient-uuid",
  case_date: "2025-11-06",
  visit_no: "First",
  
  // Register data
  register: { ... },
  
  // Complaints
  complaints: [
    {
      complaint_name: "Dimness of Vision",
      eye: "Both",
      duration: "2 weeks"
    }
  ],
  
  // Vision & Refraction
  vision_refraction: {
    right_eye: {
      distant_sph: -2.25,
      distant_cyl: -0.5,
      // ...
    },
    left_eye: { ... }
  },
  
  // Examination
  examination: {
    right_eye: {
      eyelids: "Normal",
      conjunctiva: "Clear",
      // ...
    },
    left_eye: { ... }
  },
  
  // ... other sections
}
```

### 3. Operation API
```typescript
// POST /api/operations
{
  case_id: "case-uuid",
  patient_id: "patient-uuid",
  operation_name: "Cataract Surgery",
  operation_date: "2025-11-15",
  begin_time: "10:00:00",
  end_time: "11:30:00",
  duration: 90,
  eye: "Right",
  sys_diagnosis: "Age-related cataract",
  anesthesia: "Local anesthesia with sedation",
  operation_notes: "Phacoemulsification performed...",
  payment_mode: "Cash",
  amount: 30000,
  iol_name: "Alcon Acrysof",
  iol_power: "+20.0D"
}
```

---

## Security Considerations

### 1. Authentication
- JWT tokens with expiration
- Refresh token mechanism
- Secure password hashing (bcrypt)

### 2. Authorization
- Role-based access control (RBAC)
- Protect sensitive routes
- API endpoint permissions

### 3. Data Protection
- Encrypt sensitive data
- Secure database connections
- Input validation and sanitization
- SQL injection prevention (use ORM)
- XSS protection

### 4. HIPAA Compliance (if applicable)
- Patient data encryption
- Audit logs
- Access controls
- Data backup and recovery

---

## Performance Optimization

### 1. Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- Minimize bundle size

### 2. Backend
- Database indexing
- Query optimization
- Connection pooling
- Caching (Redis)
- Load balancing

### 3. Database
- Proper indexing on foreign keys
- Normalized schema
- Regular backups
- Query performance monitoring

---

## Deployment Checklist

### Pre-Deployment
- [ ] All features tested
- [ ] Security audit completed
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Backup strategy in place

### Deployment Steps
1. Set up production database
2. Run migrations
3. Seed master data
4. Deploy backend API
5. Deploy frontend application
6. Configure DNS
7. Set up monitoring and logging
8. Create initial admin user

### Post-Deployment
- [ ] Monitor application performance
- [ ] Check error logs
- [ ] Verify all features working
- [ ] Set up automated backups
- [ ] Configure alerts
- [ ] Train users
- [ ] Provide documentation

---

## Maintenance Plan

### Daily
- Monitor application health
- Check error logs
- Verify backups

### Weekly
- Review performance metrics
- Update dependencies (security patches)
- User feedback review

### Monthly
- Database optimization
- Security audit
- Feature usage analysis
- User training sessions

### Quarterly
- Major feature updates
- Infrastructure review
- Disaster recovery drill

---

## Future Enhancements (Post-MVP)

1. **Mobile App** (iOS/Android)
2. **Appointment Scheduling System**
3. **SMS/Email Notifications**
4. **Inventory Management** (medicines, IOLs, equipment)
5. **Staff Attendance & Payroll**
6. **Patient Portal** (view reports, book appointments)
7. **Telemedicine Integration**
8. **Advanced Analytics** (ML-based insights)
9. **Multi-language Support**
10. **Integration with Medical Devices** (autorefractor, tonometer)
11. **WhatsApp Integration** (appointment reminders)
12. **Insurance Claim Management**

---

## Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| 1 | 1 week | Project setup & infrastructure |
| 2 | 1 week | Core UI components |
| 3 | 1 week | Patient management |
| 4 | 1 week | Case management - Register |
| 5-6 | 2 weeks | Case management - Medical forms |
| 7 | 1 week | Treatment & diagram |
| 8 | 1 week | Operation management |
| 9 | 1 week | Discharge management |
| 10 | 1 week | Billing management |
| 11 | 1 week | Certificate management |
| 12 | 1 week | Master data |
| 13 | 1 week | Dashboard |
| 14 | 1 week | Report generation |
| 15 | 1 week | Employee management |
| 16 | 1 week | Additional features |
| 17-18 | 2 weeks | Testing & deployment |

**Total: ~18 weeks (4.5 months)**

---

## Cost Estimation (Development)

### Team Structure
- 1 Full-stack Developer (or 1 Frontend + 1 Backend)
- 1 UI/UX Designer (part-time)
- 1 QA Tester (part-time)
- 1 Project Manager (part-time)

### Infrastructure Costs (Annual)
- Domain: $15
- SSL Certificate: $50 (or free with Let's Encrypt)
- Hosting (VPS): $50-200/month
- Database: Included in hosting or $20-50/month
- Storage (for images): $10-30/month
- Email service: $10-20/month



---

