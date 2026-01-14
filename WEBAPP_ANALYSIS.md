# EYECARE (OPTIZEN) Web Application Analysis

## Executive Summary

This is a comprehensive **Eye Care Management System (CRM)** built with Next.js 14+, React 18, TypeScript, and Supabase. The application is designed for eye care clinics and hospitals to manage patients, appointments, cases, billing, pharmacy, and more.

---

## 🏗️ Architecture Overview

### Frontend Stack
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+ with shadcn/ui components
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend Stack
- **BaaS**: Supabase (PostgreSQL database + Auth + Storage)
- **API**: Next.js API Routes (RESTful)
- **Authentication**: Supabase Auth with session management
- **Authorization**: Role-Based Access Control (RBAC)

---

## 📊 Database Schema

### Core Tables

#### 1. **users** (extends Supabase auth.users)
- Extends Supabase authentication
- Stores user profile: email, full_name, role, phone, avatar_url
- Role enum: super_admin, hospital_admin, receptionist, optometrist, ophthalmologist, technician, billing_staff, patient

#### 2. **patients**
- Patient demographics and medical information
- Fields: patient_id (MRN), full_name, email, mobile, gender, date_of_birth, address, city, state, postal_code
- Medical: allergies, systemic_conditions, medical_history, current_medications, insurance_provider, insurance_number
- Status: active/inactive

#### 3. **appointments**
- Appointment scheduling
- Links: patient_id, provider_id (doctor)
- Fields: appointment_date, start_time, end_time, type, status, room, notes
- Status: scheduled, checked-in, in-progress, completed, cancelled, no-show

#### 4. **encounters** (Medical Cases)
- Patient visit records / case management
- Links: patient_id, provider_id, appointment_id (optional)
- Core fields: case_no, encounter_date, visit_type, chief_complaint
- Medical data: JSONB fields for complaints, treatments, diagnostic_tests, vision_data, examination_data
- Status: active, completed, cancelled, pending

#### 5. **invoices**
- Billing and invoicing
- Links: patient_id, encounter_id (optional)
- Fields: invoice_number, invoice_date, due_date, subtotal, discount_amount, tax_amount, total_amount, amount_paid, balance_due
- Payment: payment_method, payment_status, status
- Items stored as JSONB array

#### 6. **pharmacy_items**
- Pharmacy inventory management
- Fields: name, sku, category, stock_quantity, unit_price, selling_price, mrp, reorder_level, supplier
- Stock tracking with stock_movements table

#### 7. **beds**
- Bed/ward management
- Fields: bed_number, ward, status (available, occupied, maintenance), patient_id (when occupied)

#### 8. **bed_assignments**
- Patient-bed assignment history
- Tracks bed assignments with dates and status

#### 9. **operations**
- Surgical procedure records
- Links: patient_id, surgeon_id, case_id
- Fields: operation_date, operation_time, surgery_name, anesthesia, eye (OD/OS/Both)
- Follow-up tracking: followup_date, followup_notes

#### 10. **master_data**
- Reference data lookup table
- Categories: medicines, dosages, routes, complaints, complaint_categories, diagnostic_tests, surgeries, anesthesia_types, eye_selection, etc.
- Used for dropdowns and data validation

#### 11. **employees**
- Staff/employee management
- Links to users table
- Fields: employee_id, department, designation, joining_date, salary, etc.

#### 12. **attendance**
- Employee attendance tracking
- Fields: employee_id, date, check_in_time, check_out_time, status

#### 13. **certificates**
- Medical certificate generation
- Links: patient_id, encounter_id
- Fields: certificate_type, issue_date, content (JSONB)

#### 14. **discharges**
- Patient discharge records
- Links: patient_id, encounter_id, bed_assignment_id
- Fields: discharge_date, discharge_summary, instructions

#### 15. **finance_revenue**
- Revenue tracking
- Fields: date, type, amount, description, payment_method

#### 16. **expenses**
- Expense management
- Fields: date, category, amount, description, payment_method

#### 17. **stock_movements**
- Inventory movement tracking
- Tracks: movement_type (sale, purchase, adjustment), item_type (pharmacy/optical), quantity, unit_price
- Links to invoices for sales tracking

#### 18. **appointment_requests**
- Public appointment booking requests
- Fields: patient_name, phone, email, preferred_date, preferred_time, status (pending, accepted, rejected)

#### 19. **old_patient_records**
- Historical patient record storage
- Links to Supabase Storage for file attachments

#### 20. **treatment_medication_records**
- Treatment and medication tracking
- Links: patient_id, encounter_id

#### 21. **blood_advice_records**
- Blood investigation advice records
- Links: patient_id, encounter_id

### RBAC Tables (from migration 008)

#### 22. **roles**
- System roles definition

#### 23. **permissions**
- Granular permissions (action + resource)

#### 24. **role_permissions**
- Role-to-permission mappings

#### 25. **user_roles**
- User role assignments with scope and expiration

### Audit & Security

#### 26. **audit_logs**
- System audit trail
- Tracks: user_id, action, table_name, record_id, old_data, new_data, ip_address

#### 27. **sessions**
- Session management table

---

## 🔐 Security & Authorization

### Authentication
- Supabase Auth with email/password
- Session management via cookies (SSR)
- Middleware protects dashboard routes
- Public routes: `/auth/login`, `/portal`, `/book` (appointment booking)

### Authorization (RBAC)
- **Role-Based Access Control** implemented in `lib/rbac-client.ts`
- **Permission Matrix**: 27+ modules × 5 actions (view, create, print, edit, delete)
- **Roles**:
  - `super_admin`: Full access
  - `hospital_admin`: Most permissions (except audit logs)
  - `receptionist`: Patient/appointment management
  - `optometrist` / `ophthalmologist`: Medical professional access
  - `technician`: Limited medical access
  - `billing_staff`: Financial operations
  - `pharmacy_staff`: Pharmacy management
  - `nurse`: Patient care + bed management
  - `finance`: Financial operations
  - `lab_technician`: Diagnostic tests
  - `manager`: Department management
  - `read_only`: View-only access

### Middleware Protection
- `middleware.ts`: Protects routes, checks authentication, enforces RBAC
- API routes use `requirePermission()` from `lib/middleware/rbac.ts`
- Development mode bypass for testing (should be removed in production)

---

## 🔌 API Routes (Backend)

### API Structure
All API routes are in `app/api/` following RESTful conventions.

### Key API Endpoints

#### Patients (`/api/patients`)
- **GET**: List patients with pagination, filtering, search
- **POST**: Create patient (with retry logic for ID collisions)
- **GET /[id]**: Get patient details
- **PUT /[id]**: Update patient
- **DELETE /[id]**: Delete patient
- **GET /[id]/records**: Get patient case history

#### Appointments (`/api/appointments`)
- **GET**: List appointments with filtering
- **POST**: Create appointment (with conflict detection)
- **GET /[id]**: Get appointment details
- **PUT /[id]**: Update appointment
- **DELETE /[id]**: Cancel appointment
- **POST /[id]/reassign**: Reassign appointment to different provider
- **GET /metrics**: Appointment metrics

#### Cases/Encounters (`/api/cases`)
- **GET**: List cases with pagination, filtering
- **POST**: Create case/encounter (with Zod validation)
- **GET /[id]**: Get case details
- **PUT /[id]**: Update case
- **DELETE /[id]**: Delete case
- **GET /metrics**: Case metrics
- **Features**: Resolves master_data IDs to names (complaints, treatments, diagnostic_tests, surgeries)

#### Invoices (`/api/invoices`)
- **GET**: List invoices with filtering
- **POST**: Create invoice (with stock validation for inventory items)
- **GET /[id]**: Get invoice details
- **PUT /[id]**: Update invoice
- **DELETE /[id]**: Delete invoice
- **GET /metrics**: Invoice metrics
- **Features**: Automatic stock movement creation for pharmacy/optical items

#### Pharmacy (`/api/pharmacy`)
- **GET**: List pharmacy items
- **POST**: Create pharmacy item
- **GET /[id]**: Get item details
- **PUT /[id]**: Update item
- **DELETE /[id]**: Delete item
- **GET /metrics**: Pharmacy metrics

#### Beds (`/api/beds`)
- **GET**: List beds
- **POST**: Create bed
- **GET /[id]**: Get bed details
- **PUT /[id]**: Update bed
- **DELETE /[id]**: Delete bed

#### Bed Assignments (`/api/bed-assignments`)
- **GET**: List assignments
- **POST**: Assign bed to patient
- **GET /[id]**: Get assignment details
- **PUT /[id]**: Update assignment
- **DELETE /[id]**: Release bed

#### Operations (`/api/operations`)
- **GET**: List operations
- **POST**: Create operation record
- **GET /[id]**: Get operation details
- **PUT /[id]**: Update operation
- **DELETE /[id]**: Delete operation

#### Employees (`/api/employees`)
- **GET**: List employees
- **POST**: Create employee
- **GET /[id]**: Get employee details
- **PUT /[id]**: Update employee
- **DELETE /[id]**: Delete employee

#### Attendance (`/api/attendance`)
- **GET**: List attendance records
- **POST**: Create attendance record
- **POST /bulk**: Bulk attendance entry
- **GET /metrics**: Attendance metrics

#### Master Data (`/api/master-data`)
- **GET**: List master data by category
- **POST**: Create master data item
- **GET /[id]**: Get item details
- **PUT /[id]**: Update item
- **DELETE /[id]**: Delete item

#### Revenue (`/api/revenue`)
- **GET**: List revenue records
- **POST**: Create revenue record
- **GET /summary**: Revenue summary

#### Expenses (`/api/expenses`)
- **GET**: List expenses
- **POST**: Create expense
- **GET /metrics**: Expense metrics

#### Finance (`/api/finance`)
- **GET /dashboard**: Finance dashboard data

#### Certificates (`/api/certificates`)
- **GET**: List certificates
- **POST**: Create certificate
- **GET /[id]**: Get certificate (for printing)

#### Discharges (`/api/discharges`)
- **GET**: List discharges
- **POST**: Create discharge
- **GET /[id]**: Get discharge details

#### Optical Plan (`/api/optical-plan`)
- **GET**: List optical plans
- **POST**: Create optical plan
- **GET /metrics**: Optical plan metrics

#### Appointment Requests (`/api/appointment-requests`)
- **GET**: List public appointment requests
- **POST**: Create appointment request (public)
- **POST /[id]/accept**: Accept request (creates appointment)
- **POST /[id]/reject**: Reject request

#### Old Patient Records (`/api/old-patient-records`)
- **GET**: List old records
- **POST**: Create old record (with file upload)
- **GET /[id]**: Get record details
- **GET /record/[recordId]**: Get specific record file

#### Treatment Medications (`/api/treatment-medications`)
- **GET**: List treatment records
- **POST**: Create treatment record

#### Blood Advice (`/api/blood-advice`)
- **GET**: List blood advice records
- **POST**: Create blood advice record

#### Vision Records (`/api/vision-records`)
- **GET**: List vision records
- **POST**: Create vision record

#### Stock Movements (`/api/stock-movements`)
- **GET**: List stock movements
- **POST**: Create stock movement

#### Dashboard (`/api/dashboard`)
- **GET /metrics**: Dashboard metrics

#### Monitoring (`/api/monitoring`)
- **GET /health**: Health check
- **GET /metrics**: System metrics

#### Access Control (`/api/access-control`)
- **GET**: List users with roles
- **POST**: Update user roles/permissions

---

## 🎨 Frontend Structure

### Pages (App Router)

#### Dashboard Routes (`app/(dashboard)/`)
- `/patients`: Patient management
- `/appointments`: Appointment scheduling
- `/cases`: Case/encounter management
- `/billing`: Invoice management
- `/pharmacy`: Pharmacy inventory
- `/beds`: Bed management
- `/employees`: Employee management
- `/attendance`: Attendance tracking
- `/operations`: Operation records
- `/certificates`: Certificate generation
- `/discharges`: Discharge management
- `/revenue`: Revenue tracking
- `/expenses`: Expense management
- `/finance`: Finance dashboard
- `/master`: Master data management
- `/access-control`: RBAC management (super_admin only)
- `/doctor-schedule`: Doctor schedule management
- `/bookings`: Appointment booking management
- `/optical-plan`: Optical plan management
- `/vision`: Vision records
- `/diagnosis-tests`: Diagnostic test management
- `/treatments-medications`: Treatment records
- `/blood-advice`: Blood advice records
- `/old-patient-records`: Historical records
- `/out-patient-records`: Outpatient records
- `/medical-records`: Medical records

### Components

#### Feature Components (`components/features/`)
- Patient management components
- Appointment components
- Case management components
- Invoice components
- Pharmacy components
- Bed management components
- Employee components
- Attendance components
- Operation components
- Certificate components
- Discharge components
- Revenue/expense components
- Master data components
- RBAC components

#### Forms (`components/forms/`)
- Patient form
- Appointment form
- Case form
- Invoice form
- Pharmacy form
- Bed form
- Employee form
- Attendance form
- Operation form
- Certificate form
- Discharge form
- Master data form
- And more...

#### Dialogs (`components/dialogs/`)
- Patient detail modal
- Appointment dialogs
- Case view dialog
- Invoice dialogs
- Pharmacy dialogs
- Bed details dialog
- Delete confirmation dialog
- And more...

#### Print Components (`components/print/`)
- Patient print layouts
- Invoice print layouts
- Certificate print layouts
- Operation print layouts
- Discharge print layouts
- And more...

#### UI Components (`components/ui/`)
- shadcn/ui components: Button, Input, Select, Dialog, Table, etc.

---

## 🔧 Key Features

### 1. Patient Management
- Patient registration with unique patient_id (MRN)
- Patient search and filtering
- Duplicate detection
- Case history tracking
- Medical history tracking

### 2. Appointment Management
- Doctor appointment scheduling
- Appointment conflict detection
- Appointment reassignment
- Status tracking
- Calendar integration ready

### 3. Case/Encounter Management
- Comprehensive medical case records
- JSONB fields for flexible data:
  - Complaints (with categories)
  - Treatments (medications with dosages/routes)
  - Diagnostic tests
  - Vision data (unaided, pinhole, aided, near)
  - Examination data (surgeries, IOP, syringing, etc.)
- Master data resolution (IDs → names)
- Case history timeline

### 4. Billing & Finance
- Invoice generation
- Multiple billing types: consultation_operation, medical, optical
- Payment tracking
- Stock integration (pharmacy/optical items)
- Revenue/expense tracking
- Financial dashboard

### 5. Pharmacy Management
- Inventory tracking
- Stock movements
- Automatic stock deduction on invoice
- Reorder level alerts
- Pharmacy item management

### 6. Bed Management
- Bed assignment
- Ward management
- Bed availability tracking
- Patient-bed assignment history

### 7. Operation Management
- Surgical procedure records
- Follow-up tracking
- Anesthesia tracking
- Eye selection (OD/OS/Both)

### 8. Master Data
- Centralized reference data
- Categories: medicines, dosages, routes, complaints, diagnostic_tests, surgeries, etc.
- Used for dropdowns and validation

### 9. RBAC System
- Granular permissions
- Role-based access
- Module-level permissions
- Action-level permissions (view, create, edit, delete, print)

### 10. Audit Logging
- System-wide audit trail
- Tracks all data changes
- User action logging

---

## 📝 Code Patterns

### API Route Pattern
```typescript
export async function GET(request: NextRequest) {
  // 1. RBAC check
  const authCheck = await requirePermission('resource', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  // 2. Get Supabase client
  const supabase = createClient()

  // 3. Parse query parameters
  const { searchParams } = new URL(request.url)
  // ... validation

  // 4. Build query with filters
  let query = supabase.from('table').select('*')

  // 5. Execute query
  const { data, error } = await query

  // 6. Return response
  return NextResponse.json({ success: true, data })
}
```

### Validation Pattern
- Zod schemas for request validation
- Input sanitization (SQL injection prevention)
- Enum validation
- Length limits
- Format validation (email, phone, dates)

### Error Handling
- `handleDatabaseError()`: Database errors
- `handleNotFoundError()`: 404 errors
- `handleServerError()`: 500 errors
- Consistent error response format

---

## 🔍 Database Observations

### Strengths
1. **Comprehensive Schema**: Covers all aspects of eye care management
2. **Flexible JSONB Fields**: Allows for complex medical data without rigid schema
3. **Proper Indexing**: Indexes on foreign keys and search fields
4. **Audit Trail**: Complete audit logging system
5. **RBAC**: Granular permission system
6. **Stock Management**: Automatic stock tracking with movements

### Areas for Review
1. **Schema Evolution**: Many migrations suggest iterative development
2. **Data Consistency**: Some tables have evolved (e.g., patients table changed from mrn/first_name/last_name to patient_id/full_name)
3. **Master Data Resolution**: API routes resolve master_data IDs to names (could be done at DB level with views)
4. **Stock Validation**: Uses RPC function `validate_stock_availability` (check if exists)

---

## 🚀 Deployment

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

### Deployment Platforms
- Vercel (recommended)
- Netlify
- Self-hosted

### Database Migrations
- 58 migration files in `supabase/migrations/`
- Apply migrations via Supabase CLI or Dashboard SQL Editor

---

## 📚 Documentation

- Full documentation site: https://maestro2903.github.io/OPTIZEN/
- Local docs: `docs/` directory (Docsify)
- API documentation: Individual route files
- Configuration guides: `docs/configuration/`
- Deployment guides: `docs/deployment/`

---

## 🎯 Recommendations

1. **Database Connection**: Use Supabase MCP or Supabase Dashboard to verify current database state
2. **Migration Review**: Review migration files to understand schema evolution
3. **RBAC Testing**: Verify RBAC is working correctly in production (remove dev bypass)
4. **Performance**: Consider database views for master_data resolution
5. **Stock Management**: Verify `validate_stock_availability` RPC function exists
6. **Audit Logging**: Ensure audit triggers are active
7. **Indexing**: Review query patterns and add indexes as needed

---

## 📊 Summary Statistics

- **Total API Routes**: 50+ endpoints
- **Database Tables**: 27+ tables
- **User Roles**: 15+ roles
- **Permission Modules**: 27+ modules
- **Migration Files**: 58 migrations
- **Components**: 100+ React components

---

*Analysis completed on: $(date)*
*Project: EYECARE (OPTIZEN) - Eye Care Management System*

