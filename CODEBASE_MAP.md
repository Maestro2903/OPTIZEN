# EYECARE (OPTIZEN) - Complete Codebase Map

**Last Updated:** Generated for AI Assistant Reference  
**Purpose:** Comprehensive map of the entire codebase for quick problem identification and resolution

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Directory Structure](#directory-structure)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Routes](#api-routes)
6. [Database Schema](#database-schema)
7. [Components Architecture](#components-architecture)
8. [Services & Utilities](#services--utilities)
9. [Common Patterns](#common-patterns)
10. [Key Files Reference](#key-files-reference)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Project Overview

**Name:** EYECARE (OPTIZEN) - Eye Care Management System  
**Type:** Next.js 14+ Full-Stack Application  
**Database:** Supabase (PostgreSQL)  
**Purpose:** Comprehensive CRM for eye care clinics and hospitals

### Core Features
- Patient Management
- Appointment Scheduling
- Case Management
- Billing & Finance
- Pharmacy Management
- Bed Management
- Employee Management
- Medical Records
- Vision Records
- Operations Management
- Certificates & Discharges

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **Components:** shadcn/ui (Radix UI primitives)
- **Forms:** React Hook Form + Zod validation
- **State:** Zustand (minimal usage), React Context
- **Icons:** Lucide React

### Backend
- **BaaS:** Supabase
  - PostgreSQL Database
  - Authentication (Supabase Auth)
  - Real-time subscriptions
  - Storage (for file uploads)
- **API:** Next.js API Routes (RESTful)

### Development Tools
- **Linting:** ESLint
- **Testing:** Playwright (E2E)
- **Documentation:** Docsify

---

## 📁 Directory Structure

```
EYECARE/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── patients/            # Patient management page
│   │   ├── appointments/        # Appointment management
│   │   ├── cases/               # Case management
│   │   ├── billing/             # Billing pages (3 sub-routes)
│   │   ├── beds/                # Bed management
│   │   ├── pharmacy/            # Pharmacy management
│   │   ├── employees/           # Employee management
│   │   ├── master/              # Master data management
│   │   ├── operations/          # Operations management
│   │   ├── certificates/        # Certificate management
│   │   ├── discharges/          # Discharge management
│   │   ├── revenue/             # Revenue tracking
│   │   ├── attendance/          # Staff attendance
│   │   ├── finance/             # Finance dashboard
│   │   ├── vision/              # Vision records
│   │   ├── diagnosis-tests/     # Diagnosis & tests
│   │   ├── treatments-medications/ # Treatments & medications
│   │   ├── blood-advice/        # Blood & advice records
│   │   ├── medical-records/     # Medical records
│   │   ├── old-patient-records/ # Old patient records
│   │   ├── out-patient-records/ # Out-patient records
│   │   ├── optical-plan/        # Optical plan management
│   │   ├── bookings/            # Appointment bookings
│   │   ├── doctor-schedule/      # Doctor schedule
│   │   ├── access-control/      # RBAC management (super_admin only)
│   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   ├── loading.tsx          # Loading UI
│   │   └── error.tsx            # Error boundary
│   │
│   ├── api/                     # API Routes (RESTful)
│   │   ├── patients/            # Patient API
│   │   │   ├── route.ts         # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts     # GET, PUT, DELETE
│   │   │       └── records/     # GET patient records
│   │   ├── appointments/        # Appointment API
│   │   ├── cases/               # Case API
│   │   ├── invoices/            # Invoice API
│   │   ├── pharmacy/            # Pharmacy API
│   │   ├── employees/           # Employee API
│   │   ├── master-data/         # Master data API
│   │   ├── operations/          # Operations API
│   │   ├── beds/                # Bed API
│   │   ├── certificates/        # Certificate API
│   │   ├── discharges/          # Discharge API
│   │   ├── revenue/             # Revenue API
│   │   ├── expenses/            # Expenses API
│   │   ├── finance/             # Finance dashboard API
│   │   ├── finance-revenue/     # Finance revenue API
│   │   ├── attendance/          # Attendance API
│   │   ├── optical-plan/        # Optical plan API
│   │   ├── stock-movements/     # Stock movements API
│   │   ├── vision-records/      # Vision records API
│   │   ├── diagnosis-tests/     # Diagnosis tests API
│   │   ├── treatment-medications/ # Treatment medications API
│   │   ├── blood-advice/        # Blood & advice API
│   │   ├── old-patient-records/ # Old patient records API
│   │   ├── out-patient-records/ # Out-patient records API
│   │   ├── appointment-requests/ # Appointment requests API
│   │   ├── doctors/              # Doctor-specific APIs
│   │   ├── access-control/      # RBAC API
│   │   ├── dashboard/           # Dashboard metrics API
│   │   ├── monitoring/          # Health & metrics API
│   │   ├── public/              # Public APIs (no auth)
│   │   └── test-connection/     # Connection test API
│   │
│   ├── auth/                    # Authentication routes
│   │   ├── login/               # Login page
│   │   ├── callback/            # OAuth callback handler
│   │   └── logout/              # Logout handler
│   │
│   ├── portal/                  # Patient portal
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing/home page
│   ├── error.tsx                # Global error boundary
│   ├── global-error.tsx         # Global error handler
│   ├── not-found.tsx            # 404 page
│   └── loading.tsx              # Global loading UI
│
├── components/                   # React components
│   ├── dialogs/                 # Modal/dialog components
│   │   ├── patient-form-dialog.tsx
│   │   ├── appointment-view-dialog.tsx
│   │   ├── case-view-dialog.tsx
│   │   ├── invoice-view-dialog.tsx
│   │   ├── pharmacy-view-dialog.tsx
│   │   ├── bed-details-dialog.tsx
│   │   ├── certificate-print-modal.tsx
│   │   └── ... (14 total)
│   │
│   ├── forms/                   # Form components
│   │   ├── patient-form.tsx
│   │   ├── appointment-form.tsx
│   │   ├── case-form.tsx
│   │   ├── invoice-form-new.tsx
│   │   ├── pharmacy-item-form.tsx
│   │   └── ... (21 total)
│   │
│   ├── features/                # Feature-specific components
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── attendance/
│   │   ├── beds/
│   │   ├── doctors/
│   │   ├── medical-records/
│   │   ├── old-patient-records/
│   │   ├── revenue/
│   │   └── ... (13 total)
│   │
│   ├── print/                  # Print layout components
│   │   ├── print-layout.tsx
│   │   ├── print-modal-shell.tsx
│   │   ├── appointment-print.tsx
│   │   ├── case-print.tsx
│   │   └── ... (18 total)
│   │
│   ├── shared/                 # Shared components
│   │   ├── app-sidebar.tsx      # Main navigation sidebar
│   │   ├── nav-main.tsx        # Navigation menu
│   │   ├── nav-user.tsx        # User menu
│   │   ├── logo.tsx            # Logo component
│   │   └── eye-drawing-tool.tsx # Eye diagram tool
│   │
│   ├── layout/                 # Layout components
│   │   └── header.tsx          # Dashboard header
│   │
│   └── ui/                     # shadcn/ui components (41 files)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       ├── form.tsx
│       ├── input.tsx
│       └── ... (36 more)
│
├── lib/                         # Utility libraries
│   ├── supabase/               # Supabase clients
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client + service client
│   │   └── database.types.ts   # Generated DB types
│   │
│   ├── services/               # Service layer
│   │   ├── api.ts              # Main API service (2000+ lines)
│   │   ├── api-client.ts       # API client utilities
│   │   ├── audit.ts            # Audit logging
│   │   ├── rbac.ts             # RBAC service
│   │   └── session.ts          # Session management
│   │
│   ├── middleware/             # Middleware utilities
│   │   ├── rbac.ts             # RBAC permission checks
│   │   ├── logging.ts          # Request logging
│   │   ├── rateLimiter.ts      # Rate limiting
│   │   └── security.ts         # Security utilities
│   │
│   ├── utils/                  # Utility functions
│   │   ├── api-errors.ts       # Error handling
│   │   ├── date.ts             # Date utilities
│   │   ├── export.ts           # Data export
│   │   ├── id-generator.ts     # ID generation
│   │   ├── logger.ts           # Logging
│   │   ├── monitoring.ts       # Monitoring
│   │   ├── query-params.ts     # Query param utilities
│   │   ├── rbac.ts             # RBAC utilities
│   │   ├── visit-type.ts       # Visit type utilities
│   │   └── countries.ts        # Country data
│   │
│   ├── constants/              # Constants
│   │   ├── roles.ts            # Role definitions (legacy)
│   │   ├── medical.ts           # Medical constants
│   │   └── operationsMock.ts   # Mock data
│   │
│   ├── hooks/                  # Custom hooks
│   │   └── useApi.ts           # API hook
│   │
│   ├── rbac-client.ts          # Client-side RBAC (permissions matrix)
│   ├── auth-utils.ts           # Auth utilities
│   └── utils.ts                # General utilities
│
├── contexts/                    # React contexts
│   └── user-context.tsx        # User context (auth + permissions)
│
├── hooks/                       # Custom React hooks
│   ├── use-master-data.ts      # Master data hook
│   ├── use-mobile.tsx          # Mobile detection
│   └── use-toast.ts            # Toast notifications
│
├── supabase/                    # Supabase configuration
│   ├── migrations/             # Database migrations (52 files)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_pharmacy_attendance_revenue.sql
│   │   ├── 003_pharmacy_attendance_revenue.sql
│   │   ├── 004_bed_management.sql
│   │   ├── 005_master_data.sql
│   │   ├── 006_security_and_constraints.sql
│   │   ├── 008_rbac_system.sql
│   │   └── ... (45 more)
│   └── seed.sql                # Seed data
│
├── styles/                      # Global styles
│   ├── globals.css             # Global CSS
│   └── print.css               # Print styles
│
├── public/                      # Static assets
│   ├── logo.svg                # Logo
│   ├── left-eye.png            # Eye images
│   └── right-eye.png
│
├── scripts/                     # Utility scripts
│   ├── create-test-users.ts
│   ├── reset-superadmin-password.ts
│   ├── reset-test-user-passwords.ts
│   ├── test-audit-logging.ts
│   └── test-monitoring.ts
│
├── tests/                       # E2E tests
│   └── e2e/                    # Playwright tests (18 files)
│
├── docs/                        # Documentation (Docsify)
│   ├── index.html
│   ├── README.md
│   ├── configuration/
│   ├── deployment/
│   └── development/
│
├── middleware.ts                # Next.js middleware (auth + RBAC)
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── README.md                   # Project README
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login:** `/app/auth/login/page.tsx`
   - Email/password authentication via Supabase Auth
   - Redirects to `/patients` on success
   - Uses `createClient()` from `lib/supabase/client.ts`

2. **OAuth Callback:** `/app/auth/callback/route.ts`
   - Handles OAuth redirects
   - Validates state parameter (CSRF protection)
   - Exchanges code for session

3. **Logout:** `/app/auth/logout/route.ts`
   - Clears Supabase session
   - Redirects to login

4. **Middleware:** `/middleware.ts`
   - Protects all routes except `/auth/*`, `/portal/*`, `/api/*`, `/book/*`
   - Checks session on every request
   - Special handling for `/access-control` (super_admin only)

### Authorization (RBAC)

**File:** `lib/rbac-client.ts` (655 lines)

**User Roles:**
- `super_admin` - Full access
- `hospital_admin` - Almost full access
- `receptionist` - Limited create/edit
- `optometrist` - Clinical access
- `ophthalmologist` - Clinical + surgery
- `technician` - View + limited edit
- `billing_staff` - Billing access
- `patient` - View own records only
- `doctor` - Alias for ophthalmologist
- `admin` - Similar to hospital_admin
- `nurse` - Patient care + bed management
- `finance` - Financial operations
- `pharmacy_staff` / `pharmacy` - Pharmacy management
- `lab_technician` - Lab access
- `manager` - Department management
- `read_only` - View-only access

**Permission Matrix:**
- Resources: `patients`, `appointments`, `cases`, `invoices`, `pharmacy`, `employees`, `master_data`, `operations`, `beds`, `certificates`, `discharges`, `revenue`, `expenses`, `finance`, `attendance`, `optical_plan`, etc.
- Actions: `view`, `create`, `print`, `edit`, `delete`

**RBAC Middleware:** `lib/middleware/rbac.ts`
- `requirePermission(resource, action)` - Server-side permission check
- Used in all API routes

**User Context:** `contexts/user-context.tsx`
- Provides user data and permissions to components
- `useUser()` hook for accessing user context
- Methods: `hasPermission()`, `hasModuleAccess()`, `isAdmin()`, `isSuperAdmin()`

---

## 🛣️ API Routes

### API Route Pattern

All API routes follow this pattern:

```typescript
// 1. RBAC Check
const authCheck = await requirePermission('resource', 'action')
if (!authCheck.authorized) {
  return authCheck.response
}
const { context } = authCheck

// 2. Get Supabase Client
const supabase = createClient() // or createServiceClient() for admin ops

// 3. Handle Request
// GET: Query params, pagination, filtering
// POST: Validate body, create record
// PUT: Validate body, update record
// DELETE: Soft/hard delete

// 4. Return Response
return NextResponse.json({ success: true, data: ... })
```

### Key API Endpoints

#### Patients
- `GET /api/patients` - List patients (pagination, search, filters)
- `POST /api/patients` - Create patient
- `GET /api/patients/[id]` - Get patient
- `PUT /api/patients/[id]` - Update patient
- `DELETE /api/patients/[id]` - Delete patient
- `GET /api/patients/[id]/records` - Get all patient records

#### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/[id]` - Get appointment
- `PUT /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Delete appointment
- `POST /api/appointments/[id]/reassign` - Reassign appointment

#### Cases
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/[id]` - Get case
- `PUT /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

#### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/invoices/metrics` - Get invoice metrics

#### Pharmacy
- `GET /api/pharmacy` - List pharmacy items
- `POST /api/pharmacy` - Create item
- `GET /api/pharmacy/[id]` - Get item
- `PUT /api/pharmacy/[id]` - Update item
- `DELETE /api/pharmacy/[id]` - Delete item
- `GET /api/pharmacy/metrics` - Get metrics

#### Master Data
- `GET /api/master-data` - List items by category
- `POST /api/master-data` - Create item
- `GET /api/master-data/[id]` - Get item
- `PUT /api/master-data/[id]` - Update item
- `DELETE /api/master-data/[id]` - Delete item (soft/hard)

#### Other Key APIs
- `/api/beds` - Bed management
- `/api/bed-assignments` - Bed assignments
- `/api/employees` - Employee management
- `/api/operations` - Operations management
- `/api/certificates` - Certificate management
- `/api/discharges` - Discharge management
- `/api/revenue` - Revenue tracking
- `/api/expenses` - Expense tracking
- `/api/finance/dashboard` - Finance dashboard
- `/api/finance-revenue` - Finance revenue entries
- `/api/attendance` - Attendance tracking
- `/api/optical-plan` - Optical plan items
- `/api/stock-movements` - Stock movements
- `/api/vision-records` - Vision records
- `/api/diagnosis-tests` - Diagnosis tests
- `/api/treatment-medications` - Treatment medications
- `/api/blood-advice` - Blood & advice records
- `/api/old-patient-records` - Old patient records
- `/api/out-patient-records` - Out-patient records
- `/api/appointment-requests` - Appointment requests
- `/api/doctors/available` - Available doctors
- `/api/doctors/[id]/schedule` - Doctor schedule

### API Service Layer

**File:** `lib/services/api.ts` (2040 lines)

Centralized API client with:
- Type-safe API calls
- Automatic auth token handling
- Error normalization
- Pagination support
- All resource APIs exported

**Usage:**
```typescript
import { patientsApi, casesApi, invoicesApi } from '@/lib/services/api'

// List
const response = await patientsApi.list({ page: 1, limit: 10, search: 'John' })

// Get by ID
const patient = await patientsApi.getById(id)

// Create
const newPatient = await patientsApi.create(data)

// Update
const updated = await patientsApi.update(id, data)

// Delete
await patientsApi.delete(id)
```

---

## 🗄️ Database Schema

### Core Tables

**Users** (`users`)
- Extends Supabase `auth.users`
- Fields: `id`, `email`, `full_name`, `role`, `phone`, `avatar_url`, `is_active`
- Role enum: `super_admin`, `hospital_admin`, `receptionist`, `optometrist`, `ophthalmologist`, `technician`, `billing_staff`, `patient`

**Patients** (`patients`)
- Fields: `id`, `mrn` (unique), `first_name`, `last_name`, `date_of_birth`, `gender`, `phone`, `email`, `address`, `city`, `state`, `postal_code`, `emergency_contact`, `insurance_provider`, `insurance_number`, `allergies[]`, `systemic_conditions[]`, `notes`
- Indexes: `mrn`, `phone`, `last_name`

**Appointments** (`appointments`)
- Fields: `id`, `patient_id`, `provider_id`, `appointment_date`, `start_time`, `end_time`, `type`, `status`, `room`, `notes`
- Types: `consult`, `follow-up`, `surgery`, `refraction`, `other`
- Status: `scheduled`, `checked-in`, `in-progress`, `completed`, `cancelled`, `no-show`

**Cases** (`cases`)
- Fields: `id`, `case_no`, `patient_id`, `encounter_date`, `visit_type`, `chief_complaint`, `history_of_present_illness`, `past_medical_history`, `examination_findings`, `diagnosis`, `treatment_plan`, `medications_prescribed`, `follow_up_instructions`, `advice_remarks`, `status`
- JSONB fields: `complaints[]`, `treatments[]`, `diagnostic_tests[]`, `past_medications[]`, `vision_data`, `examination_data`

**Invoices** (`invoices`)
- Fields: `id`, `invoice_number`, `patient_id`, `invoice_date`, `due_date`, `subtotal`, `tax`, `discount`, `total`, `status`, `payment_method`, `paid_at`, `notes`
- Related: `invoice_items[]` table

**Pharmacy Items** (`pharmacy_items`)
- Fields: `id`, `name`, `generic_name`, `category`, `manufacturer`, `supplier`, `unit_price`, `mrp`, `stock_quantity`, `reorder_level`, `batch_number`, `expiry_date`, `hsn_code`, `gst_percentage`, `prescription_required`, `dosage_form`, `strength`, `storage_instructions`, `description`, `image_url`

**Master Data** (`master_data`)
- Generic table for reference data
- Fields: `id`, `category`, `name`, `description`, `is_active`, `sort_order`, `metadata` (JSONB)
- Categories: `wards`, `beds`, `departments`, `complaints`, `treatments`, `medicines`, `dosages`, `routes`, `surgeries`, `diagnosis`, `blood_tests`, `iop_tests`, `frames`, `lenses`, etc.

**Beds** (`beds`)
- Fields: `id`, `bed_number`, `ward_name`, `ward_type`, `bed_type`, `floor_number`, `room_number`, `status`, `daily_rate`, `description`
- Status: `available`, `occupied`, `maintenance`, `reserved`, `cleaning`

**Bed Assignments** (`bed_assignments`)
- Fields: `id`, `bed_id`, `patient_id`, `admission_date`, `discharge_date`, `expected_discharge_date`, `admission_reason`, `doctor_id`

**Operations** (`operations`)
- Fields: `id`, `patient_id`, `case_id`, `operation_name`, `operation_date`, `begin_time`, `end_time`, `duration`, `eye`, `sys_diagnosis`, `anesthesia`, `operation_notes`, `payment_mode`, `amount`, `iol_name`, `iol_power`, `status`

**Discharges** (`discharges`)
- Fields: `id`, `patient_id`, `case_id`, `admission_date`, `discharge_date`, `discharge_type`, `discharge_summary`, `final_diagnosis` (JSONB), `treatment_given` (JSONB), `condition_on_discharge`, `instructions`, `follow_up_date`, `medications` (JSONB), `vitals_at_discharge`, `doctor_id`, `status`

**Certificates** (`certificates`)
- Fields: `id`, `certificate_number`, `patient_id`, `type`, `purpose`, `issue_date`, `status`, plus type-specific fields

**Employees** (`employees`)
- Fields: `id`, `employee_id`, `full_name`, `email`, `phone`, `role`, `department`, `position`, `hire_date`, `salary`, `address`, `emergency_contact`, `emergency_phone`, `qualifications`, `license_number`, `date_of_birth`, `gender`, `blood_group`, `marital_status`, `experience`, `is_active`, `avatar_url`

**Attendance** (`attendance`)
- Fields: `id`, `user_id`, `attendance_date`, `status`, `check_in_time`, `check_out_time`, `working_hours`, `notes`, `marked_by`
- Status: `present`, `absent`, `sick_leave`, `casual_leave`, `paid_leave`, `half_day`

**Revenue** (`revenue`)
- Fields: `id`, `type` (income/expense), `category`, `description`, `amount`, `transaction_date`, `payment_method`, `reference`, `notes`, `patient_id`, `invoice_id`

**Expenses** (`expenses`)
- Fields: `id`, `expense_date`, `category`, `sub_category`, `description`, `amount`, `payment_method`, `vendor`, `bill_number`, `approved_by`, `added_by`, `notes`, `receipt_url`

**Finance Revenue** (`finance_revenue`)
- Fields: `id`, `entry_date`, `revenue_type`, `description`, `amount`, `payment_method`, `payment_status`, `paid_amount`, `patient_id`, `patient_name`, `invoice_reference`, `category`, `notes`

**Optical Items** (`optical_items`)
- Fields: `id`, `item_type`, `name`, `brand`, `model`, `sku`, `description`, `category`, `sub_category`, `size`, `color`, `material`, `gender`, `purchase_price`, `selling_price`, `mrp`, `stock_quantity`, `reorder_level`, `supplier`, `image_url`, `warranty_months`, `hsn_code`, `gst_percentage`

**Stock Movements** (`stock_movements`)
- Fields: `id`, `movement_date`, `movement_type`, `item_type`, `item_id`, `item_name`, `quantity`, `unit_price`, `total_value`, `batch_number`, `reference_number`, `supplier`, `customer_name`, `invoice_id`, `user_id`, `notes`, `previous_stock`, `new_stock`

**Vision Records** (`vision_records`)
- Fields: `id`, `patient_id`, `record_date`, `record_time`, `record_number`, `vision_data` (JSONB), `examination_data` (JSONB)

**Diagnosis Tests** (`diagnosis_tests`)
- Fields: `id`, `patient_id`, `record_date`, `record_time`, `record_number`, `diagnosis_data` (JSONB), `tests_data` (JSONB)

**Treatment Medications** (`treatment_medications`)
- Fields: `id`, `patient_id`, `record_date`, `record_time`, `record_number`, `medications_data` (JSONB), `past_medications_data` (JSONB), `past_treatments_data` (JSONB), `surgeries_data` (JSONB), `treatments_data` (JSONB)

**Blood Advice** (`blood_advice`)
- Fields: `id`, `patient_id`, `record_date`, `record_time`, `record_number`, `blood_investigation_data` (JSONB), `advice_remarks`

**Old Patient Records** (`old_patient_records`)
- Fields: `id`, `old_patient_id`, `patient_name`, `uploaded_by`, `upload_date`, `notes`
- Related: `old_patient_record_files[]` table (file storage)

**Out Patient Records** (`out_patient_records`)
- Fields: `id`, `receipt_no`, `uhd_no`, `record_date`, `record_time`, `patient_id`, `name`, `age`, `sex`, `address`, `pain_assessment_scale`, `complaints`, `diagnosis`, `tension`, `fundus`, `eye_examination` (JSONB), `vision_assessment` (JSONB), `history` (JSONB), `proposed_plan`, `rx`, `urine_albumin`, `urine_sugar`, `bp`, `weight`

**Appointment Requests** (`appointment_requests`)
- Fields: `id`, `full_name`, `email`, `mobile`, `gender`, `date_of_birth`, `appointment_date`, `start_time`, `end_time`, `type`, `provider_id`, `reason`, `notes`, `status`, `processed_by`, `processed_at`, `patient_id`, `appointment_id`

**Audit Logs** (`audit_logs`)
- Fields: `id`, `user_id`, `action`, `table_name`, `record_id`, `old_data` (JSONB), `new_data` (JSONB), `ip_address`, `created_at`

### Database Types

**File:** `lib/supabase/database.types.ts`
- Auto-generated TypeScript types from Supabase
- Used throughout the codebase for type safety

---

## 🧩 Components Architecture

### Component Organization

1. **Dialogs** (`components/dialogs/`)
   - Modal components for viewing/editing records
   - Pattern: View dialog + Form dialog
   - Examples: `patient-form-dialog.tsx`, `case-view-dialog.tsx`

2. **Forms** (`components/forms/`)
   - Reusable form components
   - Uses React Hook Form + Zod validation
   - Examples: `patient-form.tsx`, `appointment-form.tsx`

3. **Features** (`components/features/`)
   - Feature-specific components
   - Examples: `patient-search-selector.tsx`, `duplicate-patient-detector.tsx`

4. **Print** (`components/print/`)
   - Print-optimized layouts
   - Examples: `case-print.tsx`, `invoice-print.tsx`

5. **Shared** (`components/shared/`)
   - Shared across features
   - `app-sidebar.tsx` - Main navigation
   - `nav-main.tsx` - Navigation menu
   - `nav-user.tsx` - User menu

6. **UI** (`components/ui/`)
   - shadcn/ui primitives (41 components)
   - Button, Dialog, Table, Form, Input, Select, etc.

### Common Component Patterns

**Page Component:**
```typescript
"use client"
import { useUser } from '@/contexts/user-context'
import { patientsApi } from '@/lib/services/api'
import { DataGrid } from '@/components/ui/data-grid'

export default function PatientsPage() {
  const { user, hasPermission } = useUser()
  // ... state, effects, handlers
  return <DataGrid ... />
}
```

**Form Component:**
```typescript
"use client"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ ... })
export function PatientForm({ ... }) {
  const form = useForm({ resolver: zodResolver(schema) })
  // ... form logic
}
```

**Dialog Component:**
```typescript
"use client"
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

export function PatientFormDialog({ open, onOpenChange, patient }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>...</DialogContent>
    </Dialog>
  )
}
```

---

## 🔧 Services & Utilities

### Supabase Clients

**Browser Client:** `lib/supabase/client.ts`
- `createClient()` - For client components
- Uses `@supabase/ssr` `createBrowserClient`

**Server Client:** `lib/supabase/server.ts`
- `createClient()` - For server components/API routes (with cookies)
- `createServiceClient()` - Service role client (bypasses RLS)

### Middleware Utilities

**RBAC:** `lib/middleware/rbac.ts`
- `requirePermission(resource, action)` - Check permissions
- Returns `{ authorized: true, context }` or `{ authorized: false, response }`

**Logging:** `lib/middleware/logging.ts`
- Request logging utilities

**Rate Limiting:** `lib/middleware/rateLimiter.ts`
- Rate limiting utilities

**Security:** `lib/middleware/security.ts`
- Security utilities

### Utility Functions

**Date:** `lib/utils/date.ts`
- Date formatting and manipulation

**Export:** `lib/utils/export.ts`
- Data export utilities (CSV, Excel)

**ID Generator:** `lib/utils/id-generator.ts`
- Generate unique IDs (MRN, invoice numbers, etc.)

**Logger:** `lib/utils/logger.ts`
- Structured logging

**Monitoring:** `lib/utils/monitoring.ts`
- Performance monitoring

**Query Params:** `lib/utils/query-params.ts`
- Query parameter parsing

**RBAC Utils:** `lib/utils/rbac.ts`
- RBAC helper functions

**Visit Type:** `lib/utils/visit-type.ts`
- Visit type utilities

**Countries:** `lib/utils/countries.ts`
- Country data

---

## 📐 Common Patterns

### API Route Pattern

```typescript
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 1. RBAC Check
  const authCheck = await requirePermission('resource', 'view')
  if (!authCheck.authorized) {
    return authCheck.response
  }
  const { context } = authCheck

  // 2. Get Supabase Client
  const supabase = createClient()

  // 3. Parse Query Params
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const search = searchParams.get('search') || ''

  // 4. Query Database
  let query = supabase.from('table').select('*')
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  query = query.order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 5. Return Response
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}
```

### Form Pattern

```typescript
"use client"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { patientsApi } from '@/lib/services/api'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  // ...
})

export function PatientForm({ patient, onSuccess }) {
  const { toast } = useToast()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: patient || { ... }
  })

  const onSubmit = async (data) => {
    try {
      const response = patient
        ? await patientsApi.update(patient.id, data)
        : await patientsApi.create(data)
      
      if (response.success) {
        toast({ title: 'Success', description: 'Patient saved' })
        onSuccess?.(response.data)
      } else {
        toast({ title: 'Error', description: response.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  )
}
```

### Data Grid Pattern

```typescript
"use client"
import { DataGrid } from '@/components/ui/data-grid'
import { patientsApi, type Patient } from '@/lib/services/api'
import { useState, useEffect } from 'react'

export default function PatientsPage() {
  const [data, setData] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })

  useEffect(() => {
    loadData()
  }, [pagination.page])

  const loadData = async () => {
    setLoading(true)
    const response = await patientsApi.list({
      page: pagination.page,
      limit: pagination.limit
    })
    if (response.success && response.data) {
      setData(response.data)
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }))
    }
    setLoading(false)
  }

  return (
    <DataGrid
      data={data}
      columns={columns}
      loading={loading}
      pagination={pagination}
      onPaginationChange={setPagination}
    />
  )
}
```

---

## 📚 Key Files Reference

### Configuration Files

- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `middleware.ts` - Next.js middleware (auth + RBAC)
- `package.json` - Dependencies

### Core Files

- `app/layout.tsx` - Root layout
- `app/(dashboard)/layout.tsx` - Dashboard layout with sidebar
- `app/auth/login/page.tsx` - Login page
- `app/auth/callback/route.ts` - OAuth callback
- `app/auth/logout/route.ts` - Logout handler

### Service Files

- `lib/services/api.ts` - Main API service (2040 lines)
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client
- `lib/middleware/rbac.ts` - RBAC middleware
- `lib/rbac-client.ts` - Client-side RBAC permissions

### Context Files

- `contexts/user-context.tsx` - User context (auth + permissions)

### Component Files

- `components/shared/app-sidebar.tsx` - Main navigation sidebar
- `components/shared/nav-main.tsx` - Navigation menu
- `components/shared/nav-user.tsx` - User menu

---

## 🔍 Troubleshooting Guide

### Common Issues

1. **Authentication Errors**
   - Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   - Verify Supabase project is active
   - Check middleware.ts for route protection

2. **Permission Errors**
   - Check user role in `users` table
   - Verify permissions in `lib/rbac-client.ts`
   - Check `requirePermission()` call in API route

3. **Database Errors**
   - Verify migrations are applied
   - Check RLS policies in Supabase
   - Use `createServiceClient()` for admin operations

4. **Type Errors**
   - Regenerate `lib/supabase/database.types.ts` from Supabase
   - Check TypeScript configuration
   - Verify import paths use `@/` alias

5. **API Errors**
   - Check API route RBAC check
   - Verify request body validation
   - Check Supabase query syntax
   - Review error logs in console

### Debugging Tips

1. **Check User Context:**
   ```typescript
   const { user, hasPermission } = useUser()
   console.log('User:', user)
   console.log('Can view patients:', hasPermission('patients', 'view'))
   ```

2. **Check API Response:**
   ```typescript
   const response = await patientsApi.list()
   console.log('API Response:', response)
   ```

3. **Check Supabase Query:**
   ```typescript
   const { data, error } = await supabase.from('patients').select('*')
   if (error) console.error('Supabase Error:', error)
   ```

4. **Check Middleware:**
   - Add console.logs in `middleware.ts`
   - Check session in middleware
   - Verify route matching

---

## 🎯 Quick Reference

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)

### Key Imports
```typescript
// Supabase
import { createClient } from '@/lib/supabase/client' // Browser
import { createClient, createServiceClient } from '@/lib/supabase/server' // Server

// API
import { patientsApi, casesApi, invoicesApi } from '@/lib/services/api'

// RBAC
import { requirePermission } from '@/lib/middleware/rbac' // Server
import { useUser } from '@/contexts/user-context' // Client
import { hasPermission } from '@/lib/rbac-client' // Client

// Components
import { Button } from '@/components/ui/button'
import { DataGrid } from '@/components/ui/data-grid'
import { Dialog } from '@/components/ui/dialog'
```

### Common Tasks

**Add New API Route:**
1. Create `app/api/resource/route.ts`
2. Add RBAC check: `requirePermission('resource', 'action')`
3. Implement GET/POST/PUT/DELETE handlers
4. Add to `lib/services/api.ts` if needed

**Add New Page:**
1. Create `app/(dashboard)/resource/page.tsx`
2. Add route to sidebar in `components/shared/app-sidebar.tsx`
3. Add RBAC check in page component
4. Create form/view components if needed

**Add New Permission:**
1. Update `lib/rbac-client.ts` permissions matrix
2. Update API route RBAC checks
3. Update UI to check permissions

---

**End of Codebase Map**

*This document is maintained for AI assistant reference. Update when significant changes are made to the codebase structure.*

