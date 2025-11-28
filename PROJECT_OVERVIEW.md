# EYECARE (OPTIZEN) - Comprehensive Project Overview

**Version**: 1.0.0  
**Project Name**: OPTIZEN CRM - Eye Care Management System  
**Repository**: https://github.com/Maestro2903/OPTIZEN  
**Status**: Active Development

---

## 1. Project Summary

EYECARE/OPTIZEN is a comprehensive **Eye Care Management System (CRM)** designed for eye care clinics and hospitals. It's a full-stack web application built with modern technologies, providing an end-to-end solution for managing:

- **Patient Records & History** - Complete medical profiles with case tracking
- **Appointments** - Scheduling, rescheduling, and doctor availability management
- **Clinical Cases** - Diagnosis, treatment plans, and examination data
- **Billing & Invoicing** - Invoice generation, payment tracking, revenue analytics
- **Pharmacy Management** - Medication inventory and prescription tracking
- **Bed Management** - Ward operations, bed assignments, and patient admission
- **Employee/Staff** - Role-based access control and attendance tracking
- **Certificates & Discharges** - Medical certificate and discharge summary generation
- **Financial Reports** - Revenue, expenses, and comprehensive analytics

---

## 2. Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router (SSR/SSG)
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Pre-built React components
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form state management
- **Zod** - Runtime schema validation
- **Zustand** - Lightweight state management
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend as a Service (PostgreSQL + Auth + Real-time)
  - PostgreSQL Database
  - Authentication (Email/OAuth)
  - Real-time Subscriptions
  - Storage (for documents/images)
  - Edge Functions (optional)
- **Next.js API Routes** - Server-side endpoints

### Development Tools
- **TypeScript** - Strict type checking
- **ESLint** - Code linting
- **Docsify** - Documentation generator
- **Git** - Version control

### Deployment
- **Vercel** (recommended) - Next.js hosting
- **Docker** - Container support
- Other platforms: Netlify, Self-hosted

---

## 3. Project Structure

```
EYECARE/
├── app/                                  # Next.js App Router
│   ├── (dashboard)/                     # Protected dashboard routes
│   │   ├── appointments/                # Appointment management UI
│   │   ├── patients/                    # Patient management UI
│   │   ├── cases/                       # Case management UI
│   │   ├── billing/                     # Billing & invoice UI
│   │   ├── beds/                        # Bed management UI
│   │   ├── pharmacy/                    # Pharmacy management UI
│   │   ├── employees/                   # Employee/staff management UI
│   │   ├── finance/                     # Financial reports UI
│   │   ├── dashboard/                   # Main dashboard
│   │   └── ...                          # Other modules
│   │
│   ├── api/                             # RESTful API endpoints
│   │   ├── patients/                    # Patient CRUD operations
│   │   ├── appointments/                # Appointment CRUD operations
│   │   ├── cases/                       # Case CRUD operations
│   │   ├── invoices/                    # Invoice operations
│   │   ├── beds/                        # Bed management operations
│   │   ├── pharmacy/                    # Pharmacy operations
│   │   ├── employees/                   # Employee operations
│   │   ├── finance/                     # Financial operations
│   │   ├── certificates/                # Certificate generation
│   │   ├── discharges/                  # Discharge management
│   │   ├── revenue/                     # Revenue tracking
│   │   ├── expenses/                    # Expense tracking
│   │   ├── attendance/                  # Attendance tracking
│   │   ├── master-data/                 # Master data management
│   │   ├── access-control/              # User access control (admin)
│   │   └── ...                          # Other API endpoints (23 total)
│   │
│   ├── auth/                            # Authentication pages
│   │   ├── login/                       # Login page
│   │   ├── register/                    # Registration page
│   │   ├── logout/                      # Logout handler
│   │   └── callback/                    # OAuth callback
│   │
│   ├── portal/                          # Patient portal (future enhancement)
│   ├── layout.tsx                       # Root layout
│   ├── globals.css                      # Global styles
│   └── page.tsx                         # Home page
│
├── components/                          # React components
│   ├── dialogs/                         # Modal/dialog components
│   ├── forms/                           # Form components
│   ├── features/                        # Feature-specific components
│   ├── print/                           # Print layout components
│   ├── shared/                          # Shared/reusable components
│   ├── ui/                              # shadcn/ui components
│   ├── landing/                         # Landing page components
│   ├── layout/                          # Layout components
│   └── index.ts                         # Component exports
│
├── lib/                                 # Utility libraries & services
│   ├── services/                        # API service layer
│   │   ├── api.ts                       # Centralized API calls
│   │   ├── api-client.ts                # API client utilities
│   │   ├── rbac.ts                      # RBAC service
│   │   ├── audit.ts                     # Audit logging service
│   │   └── session.ts                   # Session management service
│   │
│   ├── supabase/                        # Supabase client setup
│   │   ├── server.ts                    # Server-side client (with auth)
│   │   ├── client.ts                    # Client-side client
│   │   └── database.types.ts            # Auto-generated database types
│   │
│   ├── middleware/                      # Middleware utilities
│   │   ├── rbac.ts                      # RBAC middleware
│   │   └── ...                          # Other middleware
│   │
│   ├── utils/                           # Utility functions
│   │   ├── id-generator.ts              # ID generation
│   │   ├── query-params.ts              # Query parameter parsing
│   │   ├── api-errors.ts                # Error handling
│   │   └── ...                          # Other utilities
│   │
│   ├── constants/                       # Constants & configs
│   │   ├── roles.ts                     # Role definitions
│   │   ├── medical.ts                   # Medical data constants
│   │   └── operationsMock.ts            # Mock data
│   │
│   ├── rbac-client.ts                   # Client-safe RBAC utilities
│   ├── auth-utils.ts                    # Authentication utilities
│   └── utils.ts                         # General utilities
│
├── hooks/                               # Custom React hooks
├── contexts/                            # React contexts
├── styles/                              # Global CSS styles
├── public/                              # Static assets
│
├── supabase/                            # Supabase configuration
│   ├── migrations/                      # Database migrations (45 files)
│   │   ├── 001_initial_schema.sql       # Initial schema
│   │   ├── 002_rls_policies.sql         # Row-level security
│   │   ├── 003_pharmacy_attendance.sql  # Pharmacy & attendance
│   │   ├── ...
│   │   └── 045_*.sql                    # Latest migration
│   │
│   └── seed.sql                         # Seed data
│
├── docs/                                # Documentation (Docsify)
│   ├── index.html                       # Docsify entry point
│   ├── README.md                        # Documentation home
│   ├── configuration/                   # Setup guides
│   ├── deployment/                      # Deployment guides
│   └── development/                     # Dev guides
│
├── scripts/                             # Utility scripts
├── middleware.ts                        # Next.js middleware (auth redirect)
├── next.config.js                       # Next.js configuration
├── tailwind.config.ts                   # Tailwind configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json                         # Dependencies & scripts
├── .env.example                         # Environment template
├── .env.local                           # Local env (not committed)
├── README.md                            # Main README
├── READMEAPI.md                         # API documentation
└── LICENSE                              # MIT License
```

---

## 4. Core Features & Modules

### 4.1 Patient Management
- **Location**: `app/(dashboard)/patients/`, `app/api/patients/`
- **Features**:
  - Create, read, update, delete patient records
  - Patient search and filtering by status, gender, state
  - Duplicate patient detection
  - Complete medical history tracking
  - Patient ID auto-generation
  - Pagination support (max 100 per page)
- **API**: `GET|POST /api/patients`, `GET|PUT|DELETE /api/patients/[id]`

### 4.2 Appointment Management
- **Location**: `app/(dashboard)/appointments/`, `app/api/appointments/`
- **Features**:
  - Schedule appointments with providers (doctors)
  - Conflict detection (prevents double-booking)
  - Time validation (24-hour format)
  - Status tracking (scheduled, checked-in, in-progress, completed, cancelled, no-show)
  - Doctor schedule management
  - Appointment filtering by date, status, patient
  - Appointment rescheduling and reassignment
- **API**: `GET|POST /api/appointments`, `GET|PUT|DELETE /api/appointments/[id]`

### 4.3 Case Management
- **Location**: `app/(dashboard)/cases/`, `app/api/cases/`
- **Features**:
  - Create and track patient cases
  - Chief complaint, symptoms, and history recording
  - Vision data tracking (unaided, pinhole, aided, near vision)
  - Examination findings (refraction, anterior/posterior segment, IOP, blood investigation)
  - Diagnosis and treatment plans
  - Prescription management
  - Diagnostic tests tracking
  - Medical notes and remarks
  - JSONB fields for flexible data storage
- **API**: `GET|POST /api/cases`, `GET|PUT|DELETE /api/cases/[id]`

### 4.4 Billing & Invoice Management
- **Location**: `app/(dashboard)/billing/`, `app/api/invoices/`
- **Features**:
  - Invoice generation with unique invoice numbers
  - Line items with quantity, rate, and amount calculation
  - Discount and tax handling
  - Payment status tracking (paid, partial, unpaid)
  - Invoice status management (draft, sent, paid, overdue, cancelled)
  - Amount tracking (subtotal, total, balance due, amount paid)
  - Invoice filtering and search
  - Metrics and reporting
- **API**: `GET|POST /api/invoices`, `GET|PUT|DELETE /api/invoices/[id]`

### 4.5 Pharmacy Management
- **Location**: `app/(dashboard)/pharmacy/`, `app/api/pharmacy/`
- **Features**:
  - Medication inventory management
  - Prescription tracking
  - Stock management
  - Medicine catalog with dosage and routes
  - Pharmacy metrics and reporting
- **API**: `GET|POST /api/pharmacy`, `GET|PUT|DELETE /api/pharmacy/[id]`

### 4.6 Bed Management
- **Location**: `app/(dashboard)/beds/`, `app/api/beds/`, `app/api/bed-assignments/`
- **Features**:
  - Ward and bed management
  - Bed status tracking (available, occupied, maintenance, reserved, cleaning)
  - Patient bed assignment with admission/discharge dates
  - Days in ward calculation
  - Bed type and ward type classification
  - Daily rates and billing integration
- **API**: `GET|POST /api/beds`, `GET|PUT|DELETE /api/beds/[id]`

### 4.7 Finance & Revenue Management
- **Location**: `app/(dashboard)/finance/`, `app/api/finance/`, `app/api/finance-revenue/`, `app/api/revenue/`
- **Features**:
  - Revenue tracking by type (consultation, surgery, pharmacy, diagnostic, lab)
  - Payment method tracking (cash, card, UPI, bank transfer, cheque)
  - Payment status (received, pending, partial)
  - Expense management with categories
  - Financial dashboard with KPIs
  - Revenue and expense analytics
  - Monthly comparison and trends
  - Metrics and reporting
- **API**: Multiple endpoints for financial operations

### 4.8 Certificates & Medical Documents
- **Location**: `app/(dashboard)/certificates/`, `app/api/certificates/`, `app/api/discharges/`
- **Features**:
  - Medical certificate generation
  - Eye test certificates with visual acuity data
  - Sick leave certificates
  - Custom certificates
  - Discharge summaries
  - Print-friendly layouts
  - Certificate numbering and tracking
- **API**: `GET|POST /api/certificates`, `GET|PUT|DELETE /api/certificates/[id]`

### 4.9 Employee & Staff Management
- **Location**: `app/(dashboard)/employees/`, `app/api/employees/`
- **Features**:
  - Staff profiles and details
  - Department assignment
  - Role-based access control (RBAC)
  - Attendance tracking
  - Doctor schedule management
  - Staff performance tracking
- **API**: `GET|POST /api/employees`, `GET|PUT|DELETE /api/employees/[id]`

### 4.10 Reports & Analytics
- **Dashboard**: Main analytics dashboard with KPIs
- **Revenue Reports**: Income analysis and trends
- **Attendance Reports**: Staff attendance tracking
- **Financial Reports**: Comprehensive financial analytics
- **Operational Analytics**: System performance metrics
- **Custom Reports**: Exportable data and charts

### 4.11 Access Control & User Management
- **Location**: `app/api/access-control/`
- **Features**:
  - Super admin user management
  - Role assignment
  - Permission modification
  - User access control (admin only)
  - Audit trail

---

## 5. Database Architecture

### 5.1 Key Tables
The database consists of 45 migrations managing:

**Core Tables**:
- `users` - User accounts with roles and metadata
- `patients` - Patient records with demographics and medical history
- `appointments` - Appointment scheduling
- `cases` - Clinical case records
- `invoices` - Invoice generation and tracking
- `invoice_items` - Line items for invoices
- `beds` - Bed configuration and management
- `bed_assignments` - Patient bed assignments
- `pharmacy` - Medication inventory
- `finance_revenue` - Revenue transactions
- `expenses` - Expense tracking
- `certificates` - Medical certificates
- `discharges` - Discharge records
- `attendance` - Employee attendance
- `operations` - Surgical operations
- `master_data` - Reference data (diagnoses, treatments, medicines, dosages)

**Support Tables**:
- `audit_logs` - Audit trail for compliance
- `session_management` - Session tracking
- `complaint_categories` - Chief complaint classifications
- `diagnostic_tests` - Diagnostic test types

### 5.2 Security Features
- **Row-Level Security (RLS)** - Database-level access control
- **Foreign Key Constraints** - Data integrity
- **Unique Constraints** - Data consistency
- **Check Constraints** - Business rule enforcement
- **Audit Logging** - Compliance tracking

### 5.3 Data Types
- JSONB fields for flexible data storage:
  - `complaints` - Chief complaints with categories
  - `treatments` - Treatment details
  - `diagnostic_tests` - Test results
  - `vision_data` - Vision measurements
  - `examination_data` - Clinical examination findings

---

## 6. Authentication & Authorization

### 6.1 Authentication
- **Supabase Auth** - Email/password authentication
- **OAuth Support** - Google, GitHub, etc. (configurable)
- **Session Management** - Cookie-based sessions
- **CSRF Protection** - OAuth state parameter validation

### 6.2 Authorization - RBAC
**User Roles** (16 supported):
- `super_admin` - Full system access
- `hospital_admin` - Administrative functions
- `receptionist` - Appointment and patient management
- `optometrist` - Clinical and optical operations
- `ophthalmologist` - Full clinical access
- `technician` - Clinical support
- `billing_staff` - Billing and invoicing
- `nurse` - Patient care and bed management
- `finance` - Financial operations
- `pharmacy_staff`/`pharmacy` - Medication management
- `lab_technician` - Laboratory operations
- `manager` - Department management
- `read_only` - View-only access
- `admin` - Administrative role
- `patient` - Patient portal (read-only own records)
- `doctor` - Alias for ophthalmologist

**Permission Matrix**:
Each role has permissions for:
- `view`, `create`, `edit`, `print`, `delete`
- Across 24 modules (patients, appointments, cases, billing, pharmacy, etc.)

**Implementation**:
- Client-safe RBAC utilities: `lib/rbac-client.ts`
- Server-side middleware: `lib/middleware/rbac.ts`
- Role constants: `lib/constants/roles.ts`
- Middleware protection: `middleware.ts` (Next.js)

---

## 7. API Architecture

### 7.1 API Service Layer
**File**: `lib/services/api.ts`

- **Centralized API calls** - Single source for all API interactions
- **Type-safe responses** - `ApiResponse<T>` interface
- **Generic CRUD methods** - `getList`, `getById`, `create`, `update`, `delete`
- **Pagination support** - Page, limit, total, hasNextPage
- **Error handling** - Formatted error messages
- **Query parameter building** - Automatic URL construction
- **Authentication** - Automatic bearer token inclusion

**Exported Services**:
- `patientsApi`
- `appointmentsApi`
- `casesApi`
- `invoicesApi`
- `certificatesApi`
- `dischargesApi`
- `bedsApi`
- `revenueApi`
- `expensesApi`
- `financeApi`
- `financeRevenueApi`
- `realtimeService`

### 7.2 API Route Pattern
All routes follow RESTful conventions:

```typescript
// GET - List with pagination, filtering, sorting
export async function GET(request: NextRequest) {
  // 1. Authorization check
  const authCheck = await requirePermission('module', 'view')
  
  // 2. Query parameter extraction and validation
  // 3. Database query with filters, sorting, pagination
  // 4. Response with metadata
  
  return NextResponse.json({ success: true, data, pagination })
}

// POST - Create new resource
export async function POST(request: NextRequest) {
  // 1. Authorization check
  // 2. Request body validation
  // 3. Business logic validation (e.g., conflict checking)
  // 4. Database insert
  // 5. Return created resource
  
  return NextResponse.json({ success: true, data }, { status: 201 })
}

// PUT|PATCH - Update resource
// DELETE - Remove resource
```

### 7.3 Query Parameters
Standard pagination and filtering:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `search` - Full-text search
- `sortBy` - Sort column (validated allowlist)
- `sortOrder` - 'asc' or 'desc' (default: 'desc')
- Module-specific filters (status, gender, date, etc.)

### 7.4 Error Handling
- **Status codes**: 200, 201, 400, 401, 403, 404, 409, 500
- **Error responses**: `{ error: string, details?: string, code?: string }`
- **Database errors**: Formatted user-friendly messages
- **Validation errors**: 400 with specific field validation messages

---

## 8. Client Setup

### 8.1 Supabase Clients
**Server-side** (`lib/supabase/server.ts`):
- `createClient()` - Service role in dev, SSR client in prod
- `createAuthenticatedClient()` - Always uses cookies with auth
- `createServiceClient()` - Admin operations bypassing RLS

**Client-side** (`lib/supabase/client.ts`):
- Standard Supabase client for browser context

### 8.2 Database Types
- Auto-generated from Supabase: `lib/supabase/database.types.ts`
- Type-safe queries with inference
- Keep synced with migrations

---

## 9. Development Workflow

### 9.1 Local Setup
```bash
# 1. Clone and install
git clone https://github.com/Maestro2903/OPTIZEN.git
cd EYECARE
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in Supabase credentials

# 3. Database setup
supabase link --project-ref your-project-ref
supabase db push

# 4. Run development server
npm run dev
# Visit http://localhost:3000
```

### 9.2 Available Scripts
```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Production build
npm run start      # Run production server
npm run lint      # Run ESLint
npm run docs      # Serve docs (port 3001)
npm run docs:dev  # Docs with auto-open
```

### 9.3 Code Organization
- **Components**: Feature-based organization in `components/`
- **API Routes**: Module-based in `app/api/`
- **Services**: Centralized in `lib/services/`
- **Utilities**: Reusable functions in `lib/utils/`
- **Types**: Supabase auto-generated + feature-specific

### 9.4 TypeScript Configuration
- **Target**: ES2017
- **Strict**: false (configurable)
- **Path alias**: `@/*` maps to project root
- **Excluded**: `node_modules`, `WEBSITE`

---

## 10. Middleware & Security

### 10.1 Next.js Middleware
**File**: `middleware.ts`

Functions:
- **Session check** - Validates authenticated users
- **Route protection** - Redirects unauthenticated users to login
- **Role verification** - Super admin only for `/access-control`
- **Auth bypass** - Allows `/auth`, `/api`, `/portal`, `/book` without session
- **Authenticated redirect** - Sends logged-in users from auth pages to dashboard

### 10.2 RBAC Middleware
**File**: `lib/middleware/rbac.ts`

- `requirePermission(module, action)` - API route protection
- Returns `{ authorized: boolean, response?: NextResponse, context?: AuthContext }`
- Checks both user role and specific action permission
- Returns 401 if no session, 403 if permission denied

---

## 11. Configuration & Environment

### 11.1 Environment Variables
```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
SUPABASE_ACCESS_TOKEN=xxxxx

# Application (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Figma (optional for design integration)
FIGMA_API_KEY=xxxxx
```

### 11.2 Configuration Files
- `next.config.js` - Next.js config
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Tailwind CSS config
- `components.json` - shadcn/ui config
- `.eslintrc.json` - ESLint rules

---

## 12. Deployment

### 12.1 Vercel (Recommended)
1. Push to GitHub
2. Connect in Vercel dashboard
3. Set environment variables
4. Deploy automatically on push

### 12.2 Environment Variables for Production
- All variables from `.env.example` must be set
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- Use Vercel's secrets management

### 12.3 Build Configuration
- Next.js 14+ with App Router
- Server Actions enabled (10MB body limit)
- TypeScript strict checking
- Webpack optimizations for DNS

---

## 13. Testing & Quality

### 13.1 Code Quality
- **ESLint** - Next.js recommended rules
- **TypeScript** - Strict type checking
- **Prettier** - Code formatting (configured)
- **Import conventions** - See dev guide

### 13.2 Current Status
- ✅ Core modules implemented
- ✅ RBAC system complete
- ✅ Database migrations (45 files)
- ✅ API layer with validation
- ✅ Authentication and authorization
- ✅ Financial and reporting modules
- 📋 Mobile app (roadmap)
- 📋 Advanced analytics (roadmap)
- 📋 Device integration (roadmap)
- 📋 Multi-language (roadmap)

---

## 14. Documentation

- **Main Docs**: `docs/` directory with Docsify
- **API Docs**: `READMEAPI.md`
- **Deployment**: `docs/deployment/`
- **Configuration**: `docs/configuration/`
- **Development**: `docs/development/`

Serve locally: `npm run docs`

---

## 15. Key Design Patterns

### 15.1 API Service Pattern
Centralized service layer for all API calls with type safety and error handling.

### 15.2 RBAC Pattern
Middleware-based permission checking at API route level with client-side UI hiding.

### 15.3 Component Organization
Feature-based structure with shared components and layouts.

### 15.4 Type Safety
End-to-end TypeScript with Zod schema validation.

### 15.5 Data Validation
Server-side validation in API routes + client-side with React Hook Form.

---

## 16. Common Operations

### 16.1 Adding a New Module
1. Create database table with migration
2. Create API routes: `app/api/module/route.ts`
3. Create API service: Add to `lib/services/api.ts`
4. Create UI components: `components/` and `app/(dashboard)/module/`
5. Add RBAC permissions: Update `lib/rbac-client.ts`
6. Add middleware check: Update `lib/middleware/rbac.ts`

### 16.2 Adding a New Role
1. Add role constant: `lib/rbac-client.ts`
2. Define permissions: `PERMISSIONS` object
3. Update middleware: If special handling needed
4. Test access control

### 16.3 Creating an API Endpoint
1. Create route file: `app/api/module/route.ts`
2. Add permission check: `requirePermission()`
3. Validate input: Extract and validate query/body params
4. Implement logic: Database query or business logic
5. Return response: Standardized JSON response
6. Add error handling: 400/401/403/404/500 errors

---

## 17. Architecture Highlights

### 17.1 Strengths
✅ Comprehensive feature set for eye care management
✅ Type-safe end-to-end with TypeScript
✅ Granular RBAC with 16 roles and 24 modules
✅ Scalable API architecture with service layer
✅ Real-time capabilities via Supabase
✅ Production-ready error handling
✅ Audit logging and compliance support
✅ Modern frontend with responsive UI
✅ Flexible JSONB fields for medical data
✅ Database-level security with RLS

### 17.2 Areas for Enhancement
⚠️ Mobile app (in roadmap)
⚠️ Advanced analytics features
⚠️ Medical device integrations
⚠️ Offline capability
⚠️ Advanced search with full-text indices
⚠️ Batch operations for data import/export
⚠️ WebSocket real-time updates

---

## 18. Quick Links

- **GitHub**: https://github.com/Maestro2903/OPTIZEN
- **Documentation Site**: https://maestro2903.github.io/OPTIZEN/
- **Issues & Discussions**: GitHub Issues/Discussions
- **License**: MIT

---

## 19. Support & Contact

- **Issues**: Open GitHub issue
- **Discussions**: GitHub Discussions
- **Documentation**: See docs/ directory
- **Contributing**: Fork and submit PR

---

**Last Updated**: November 28, 2025  
**Maintained by**: Maestro2903
