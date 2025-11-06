# Eye Care Hospital CRM - Production Implementation Plan

## Tech Stack

**Frontend:**

- Next.js 14+ (App Router), React 18+, TypeScript
- Tailwind CSS + shadcn/ui (customized for medical UX)
- React Hook Form + Zod validation
- TanStack Table, Recharts
- Zustand for state management

**Backend:**

- Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- Row Level Security (RLS) for RBAC
- Supabase Storage for medical images/documents

**Deployment:**

- Primary: Vercel (serverless)
- Alternative: AWS Amplify
- Both with environment-based configs

**Security:**

- Supabase Auth with MFA
- Field-level encryption for PHI
- Audit logging via database triggers
- TLS + AES-256 encryption

## Project Structure

```
/Users/shreeshanthr/EYECARE/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layouts
│   ├── (dashboard)/              # Main app layouts
│   │   ├── patients/             # Patient management
│   │   ├── appointments/         # Scheduling
│   │   ├── clinical/             # Charting & encounters
│   │   ├── optical/              # Optical shop
│   │   ├── billing/              # Invoicing & payments
│   │   ├── surgery/              # Surgery management
│   │   ├── telemedicine/         # Video consultations
│   │   ├── analytics/            # Reports & dashboards
│   │   └── settings/             # Admin & config
│   ├── portal/                   # Patient portal
│   └── api/                      # API routes
├── components/
│   ├── ui/                       # shadcn components (customized)
│   ├── patients/                 # Patient-specific components
│   ├── appointments/             # Calendar, booking widgets
│   ├── clinical/                 # Chart templates, VA input
│   ├── optical/                  # Inventory, POS
│   ├── billing/                  # Invoice, payment forms
│   └── shared/                   # Common components
├── lib/
│   ├── supabase/                 # Supabase client & utils
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Helpers, formatters
│   ├── validations/              # Zod schemas
│   └── constants/                # Medical codes, configs
├── supabase/
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge Functions
│   └── seed.sql                  # Demo data
├── public/
├── docs/                         # Documentation
├── tests/                        # E2E and integration tests
└── config/                       # Deployment configs
```

## Implementation Phases

### PHASE 0: Foundation & MVP

**Week 1: Project Setup & Design System**

1. Initialize Next.js 14 project with TypeScript
2. Install and configure shadcn/ui components
3. Setup Supabase project (dev, staging, prod)
4. Create custom design tokens for medical UX
5. Build core UI components (medical-themed shadcn customization)
6. Setup Tailwind config with eye care color palette
7. Create responsive layout with navigation
8. Implement dark mode support

**Week 2: Database Schema & Authentication**

1. Design comprehensive database schema:

   - patients, appointments, encounters, diagnoses
   - users, roles, permissions (RBAC)
   - audit_logs, consent_records
   - billing, invoices, payments

2. Create Supabase migrations
3. Implement Row Level Security (RLS) policies
4. Setup Supabase Auth with 8 user roles:

   - Super Admin, Hospital Admin, Receptionist
   - Optometrist, Ophthalmologist, Technician
   - Billing Staff, Patient

5. Build MFA authentication flow
6. Create audit logging triggers
7. Seed demo data (anonymized patient records)

**Week 3: Core Modules - Patients & Appointments**

1. **Patient Master Module:**

   - Create/edit patient form with validation
   - Fast fuzzy search (name, MRN, phone, national ID)
   - Patient demographics with medical history
   - Allergy tracking, systemic conditions
   - Duplicate detection & merge workflow
   - Patient detail view with tabs (demographics, history, encounters, billing)

2. **Appointment Scheduling Module:**

   - Multi-provider calendar (day/week/month views)
   - Slot type configuration (consult, post-op, refraction, surgery)
   - Smart booking with conflict detection
   - Room/resource allocation
   - Waitlist management
   - Walk-in handling
   - Drag-and-drop rescheduling

**Week 4: Clinical Charting & Check-in**

1. **Check-in Workflow:**

   - Quick patient search & check-in
   - Insurance verification screen
   - Consent capture (digital signature)
   - Queue management dashboard

2. **Clinical Charting Module:**

   - Structured ophthalmic templates
   - VA (OD/OS) input with decimal/Snellen conversion
   - Refraction input (sphere/cyl/axis)
   - IOP measurement
   - Slit-lamp findings
   - Fundus examination notes
   - ICD-10 diagnosis search & selection
   - Laterality flags (OD/OS/OU)
   - Image/PDF attachment
   - Version control & sign-off workflow
   - Quick templates for common conditions

### PHASE 1: Device Integration & Optical Shop 

**Week 5: Device Integrations**

1. Build device integration framework:

   - File upload handler (DICOM, PDF, CSV)
   - OCT parser (sample: Zeiss, Heidelberg formats)
   - Visual field parser (Humphrey field analyzer)
   - Autorefractor CSV import
   - Automatic patient/encounter mapping
   - Parsing error handling UI

2. Create device management admin panel
3. Build preview/annotation tools for images

**Week 6: Optical Shop & Inventory**

1. **Optical Order Workflow:**

   - Prescription entry form
   - Frame catalog with search/filter
   - Lens type/coating selection
   - Lab order management
   - Status tracking (ordered → received → ready → delivered)

2. **Inventory Management:**

   - SKU tracking by category (frames, lenses, contact lenses)
   - Batch/lot management
   - Reorder threshold alerts
   - Supplier management
   - Stock adjustments with audit trail

3. **Point-of-Sale (POS):**

   - Quick checkout interface
   - Invoice generation linked to patient
   - Sales returns & exchanges
   - Warranty tracking

**Week 7: Billing & Payments**

1. **Billing Module:**

   - Multi-payer support (insurance, corporate, cash)
   - Invoice generation with line items
   - Co-pay calculation
   - Discount rules engine
   - Claims generation (configurable format)
   - Refunds & adjustments

2. **Payment Integration:**

   - Stripe/Razorpay integration for cards
   - Payment status tracking
   - Partial payments & payment plans
   - Receipt generation
   - Payment gateway sandbox testing

### PHASE 2: Advanced Features 

**Week 8: Surgery Workflow**

1. Surgery scheduling with OR allocation
2. Pre-op checklist & assessment
3. Digital consent capture with signature
4. Anesthesia notes
5. Surgical details form:

   - IOL type, power, laterality
   - Procedure codes
   - Complications tracking

6. Post-op follow-up scheduling
7. Automated post-op reminders
8. Link surgical charges to billing

**Week 9: Patient Portal & Communications**

1. **Patient Portal:**

   - Appointment viewing & self-booking
   - Invoice & payment history
   - Test results (provider-gated)
   - Prescription viewer
   - Document upload
   - Secure messaging
   - Multi-language support (i18n)
   - Accessibility (WCAG AA)

2. **Communication System:**

   - SMS/Email/WhatsApp reminder templates
   - Appointment confirmation automation
   - Twilio/SendGrid integration
   - Message status tracking
   - Provider-to-provider messaging
   - Message archival to patient chart

**Week 10:Analytics**

1. **Analytics & Reporting:**

   - Daily appointment list
   - No-show rate dashboard
   - Revenue per provider
   - Inventory aging reports
   - Surgical outcomes tracking
   - Population health metrics
   - Custom report builder
   - Scheduled report delivery (email)
   - CSV/Excel export

### PHASE 3: Enterprise Features 

**Week 11: Multi-Tenant & Advanced RBAC**

1. Multi-clinic tenancy model
2. Clinic-specific settings & branding
3. Cross-clinic patient lookup
4. Attribute-based access control (ABAC)
5. Data residency controls
6. Clinic-level analytics

**Week 12: Compliance & Production Readiness**

1. **Security Hardening:**

   - Field-level encryption for PHI
   - Penetration testing
   - SAST/DAST scanning
   - Vulnerability assessment

2. **Compliance Documentation:**

   - Privacy by design documentation
   - DPIA template
   - Data retention policies
   - Breach notification workflow
   - Consent management system

3. **Production Deployment:**

   - Vercel production deployment with environment configs
   - AWS Amplify alternative deployment
   - Backup & restore procedures
   - Point-in-time recovery setup
   - Performance optimization (< 2s page loads)
   - CDN configuration
   - Rate limiting & DDoS protection

## Testing Strategy

**Unit Tests:**

- Validation schemas (Zod)
- Utility functions
- API route handlers

**Integration Tests:**

- Supabase RLS policies
- API workflows
- Device parsers with sample files

**E2E Tests (Playwright):**

- Complete patient journey: creation → appointment → check-in → charting → billing
- Optical order workflow
- Surgery workflow
- Payment processing
- RBAC enforcement (test each role's permissions)

**Security Tests:**

- Authentication bypass attempts
- Authorization boundary testing
- SQL injection tests
- XSS vulnerability scanning

**Performance Tests:**

- Load testing (100+ concurrent users)
- Search performance (< 1s)
- Page load times (< 2s)

## Documentation Deliverables

1. **Technical Documentation:**

   - API reference (OpenAPI spec)
   - Database schema diagrams
   - Architecture diagrams
   - Deployment guide

2. **User Documentation:**

   - Administrator guide
   - User manual (per role)
   - Onboarding checklist
   - Training videos/guides

3. **Operations Documentation:**

   - Runbook (backup/restore, incidents)
   - Migration guide
   - Configuration management
   - Monitoring & alerting setup

## Key Design Decisions

1. **Supabase RLS for RBAC:** Use PostgreSQL Row Level Security policies for fine-grained access control rather than middleware
2. **Server Components:** Leverage Next.js 14 App Router with React Server Components for performance
3. **Optimistic Updates:** Use optimistic UI updates with Supabase Realtime subscriptions
4. **Audit Triggers:** Database triggers for immutable audit logs
5. **Edge Functions:** Supabase Edge Functions for device parsing, notifications, claims generation
6. **Incremental Static Regeneration:** Use ISR for patient portal pages
7. **Configurable Templates:** Store clinical templates, diagnosis lists, billing rules in database for easy customization

## Success Metrics

- Check-in time ≤ 2 minutes
- Clinical charting ≤ 5 minutes per encounter
- Page load times < 2s
- Search results < 1s
- 99.9% uptime SLA
- Zero PHI breaches
- RBAC enforcement 100% accurate
- Automated reminder delivery rate > 95%

## Risk Mitigation

1. **Medical Data Accuracy:** Clinician sign-off on all templates before production use
2. **Compliance:** Legal review of consent forms and privacy policies
3. **Device Integration:** Manual upload fallback for all device types
4. **Payment Failures:** Graceful handling with retry mechanism and manual reconciliation
5. **Data Loss:** Automated backups every 6 hours, tested quarterly restores




so no i want yout o think like a designer and create a deailed design prompt for each page with pixel perfection 