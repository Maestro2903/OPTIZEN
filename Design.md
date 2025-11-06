
🎨 EYE CARE HOSPITAL CRM — DESIGN PROMPT SPECIFICATION

Goal: Translate the production plan into pixel-precise Figma/Framer-ready design prompts.
Each module will specify layout grid, visual hierarchy, component system, color cues, typography, and interaction states.

⸻

🧱 1. Global Design System (applies to all pages)

Grid
	•	12-column fluid grid
	•	Max width: 1440px, Gutter: 24px
	•	Padding: 24px on desktop, 16px on mobile

Color Palette (Eye-Centric Theme)

Role	Color	Hex
Primary	Deep Sapphire	#043A6B
Accent	Aqua Blue	#009FE3
Background	Snow White	#F9FAFB
Surface	White	#FFFFFF
Divider	Cool Gray	#E5E7EB
Text Primary	Charcoal	#1F2937
Text Secondary	Slate	#6B7280
Success	Emerald	#10B981
Warning	Amber	#F59E0B
Error	Crimson	#EF4444
Information	Sky Blue	#3B82F6

Typography

Use	Font	Weight	Size
Headings	Inter	600–700	20–32px
Body	Inter	400–500	14–16px
Labels	Inter	500	12–13px
Numbers / Data	IBM Plex Mono	500	13px

Components (shadcn/ui customized)
	•	Button variants: primary, secondary, outline, ghost
	•	Input fields: subtle borders, glowing focus ring (accent blue)
	•	Cards: elevated (shadow-sm) with rounded-2xl
	•	Tables: TanStack integrated; zebra striping, sticky headers
	•	Modals/Drawers: overlay blur (20%), dim background
	•	Navigation Sidebar: icon + label, collapsible
	•	Toast notifications: color-coded (success/error/info)

⸻

🏠 2. Dashboard Overview (Landing after login)

Purpose

Give users (Admins, Doctors, Receptionists) an instant visual summary of clinic operations.

Layout
	•	Two-column grid (Main metrics + Activity Feed)
	•	Header with “Good Morning, [User Name]” and date
	•	Quick-action buttons row (e.g., + New Patient, + Appointment)
	•	Responsive card-based layout

Key Sections
	1.	KPIs Row (4 Cards)
	•	Appointments Today
	•	Patients Checked-In
	•	Revenue (₹)
	•	Pending Invoices
Each card uses iconography and color-coded accent borders.
	2.	Activity Feed (Right Column)
	•	Scrollable list of actions (new appointments, payments, notes)
	•	Time-stamped, with icons and role avatars
	3.	Charts Section
	•	Recharts integration: “Appointments Over Time” line chart
	•	Pie chart for “Visit Type Distribution”
	4.	Announcements Widget (bottom-right)
	•	Small card with internal notes or updates.

Visual Prompt (for Designer)

Clean white surface with subtle blue shadows under KPI cards. Icons minimal (Lucide). Font contrast 1.6:1 ratio. Use Framer Motion micro-animations on hover. Aim for a calm clinical aesthetic — like Apple Health meets Notion.

⸻

👤 3. Patient Management Page

Purpose

Centralized patient directory and profile details.

Layout
	•	Header: Search bar (fuzzy search by name, MRN, phone)
	•	Left Pane: Patient list with infinite scroll
	•	Right Pane: Selected patient detail view

Key Sections
	1.	Patient List Panel
	•	Table with columns: Name, MRN, Age/Sex, Last Visit, Allergies
	•	Hover card preview with photo + key stats
	•	Add New button (fixed top-right)
	2.	Patient Detail View (Tabs UI)
	•	Tabs: Demographics | Medical History | Encounters | Billing | Documents
	•	Top banner with patient photo, MRN, age, contact icons
	•	Quick actions: “New Encounter”, “Generate Report”, “Attach File”
	3.	Demographics Tab
	•	2-column layout with field grouping: Contact Info, Insurance, Address
	•	Editable inline fields
	4.	History Tab
	•	Scrollable timeline with icons (diagnoses, surgeries, allergies)
	•	Collapsible accordion for details

Design Prompt

Clean data-table experience like Linear.app. The patient profile uses soft blues and white surfaces. Emphasize “data clarity over density”. Hover states should have light glow (#E0F2FE). Patient images circular with soft drop shadow.

⸻

📅 4. Appointment Scheduling

Purpose

Manage daily, weekly, or monthly view of appointments.

Layout
	•	Top Toolbar: Provider selector, date range picker, “+ New Appointment” button
	•	Main Calendar: Interactive grid with drag/drop scheduling
	•	Right Drawer: Appointment detail panel (opens on click)

Features
	•	Color-coded slots (Consult, Surgery, Follow-up)
	•	Conflict alert badge
	•	Waitlist sidebar
	•	Drag-to-reschedule animation

Design Prompt

Think Apple Calendar + hospital workflow. Past slots gray, active slots vibrant. Hover interaction shows quick info card. Use ghost-blue glow for selected time blocks. Use subtle motion transitions between day/week views.

⸻

🧾 5. Billing & Payments

Layout
	•	Header: Filter by date, patient, payment status
	•	Invoice Table: Invoice ID, Patient, Amount, Status, Date, Method
	•	Invoice Detail Drawer: Line items, tax, discount, total, actions
	•	Payment Modal: Razorpay/Stripe mock UI

Design Prompt

Financial clarity first — white cards with high contrast dark text. Use green (#10B981) for paid, amber for pending, red for overdue. All amounts right-aligned, monospaced. Subtle animations when generating invoices.

⸻

🧠 6. Clinical Charting

Layout
	•	Top: Encounter header (Patient Info, Date, Doctor)
	•	Left Sidebar: Encounter navigation (VA, Refraction, IOP, Notes)
	•	Main Canvas: Form fields grouped by examination step
	•	Right Sidebar: Attachments (images, PDFs), previous encounters

Design Prompt

Minimal distraction mode — lots of white space. Section dividers with colored tags (“Anterior Segment”, “Fundus”, etc). Use keyboard shortcuts for form navigation. Include visual consistency for OD/OS fields (mirror layout left/right).

⸻

🛍️ 7. Optical Shop & Inventory

Layout
	•	Header Tabs: Orders | Inventory | Suppliers
	•	Inventory Table: Image thumbnail, SKU, Category, Stock, Reorder level
	•	Order Card: Shows frame, lens type, prescription
	•	POS Modal: Minimal UI for quick billing

Design Prompt

Retail-meets-clinical. Clean product thumbnails with crisp borders. POS interface should resemble Apple Store checkout — large buttons, clean receipts, blue-accent CTAs.

⸻

💳 8. Payment Gateway

Design Prompt

Minimal checkout screen, with split layout: left summary, right payment options. Stripe-style fields with floating labels. Use secure lock icons subtly. Success animation with confetti or checkmark pulse.

⸻

🏥 9. Surgery Workflow

Layout
	•	Tabs: Pre-op | Intra-op | Post-op
	•	Pre-op Checklist: Checkbox list + notes
	•	Intra-op: Structured form (IOL, Complications, Anesthesia)
	•	Timeline View: Pre-op → Surgery → Follow-up

Design Prompt

Surgical precision in design — structured, no clutter. Use color-coded stages: blue (Pre), teal (Intra), green (Post). Icons for each stage in header timeline. Minimal shadows. Strict grid alignment.

⸻

📊 10. Analytics Dashboard

Layout
	•	Header: Filter (Date Range, Provider, Department)
	•	Grid: 2x3 layout of KPI cards (Revenue, No-Shows, Surgeries)
	•	Charts: Bar, line, and donut charts
	•	Export Buttons: CSV / PDF (shadcn dropdown)

Design Prompt

Crisp and business-grade. Each chart card with light background tint (#F3F4F6). Animate data transitions. KPI cards should be responsive with hover emphasis. Avoid color overload — 2–3 tones max.

⸻

⚙️ 11. Settings (Admin)

Tabs
	•	Users & Roles
	•	Permissions Matrix
	•	Clinic Profile
	•	Integrations
	•	Audit Logs

Design Prompt

Similar to Vercel dashboard: monochrome interface with blue accent highlights. Permission matrix uses toggle chips. Audit log presented in timeline view with icons (login, update, delete).

⸻

🌐 12. Patient Portal

Layout
	•	Hero Section: Welcome back, [Name]
	•	Cards: Upcoming Appointments, Prescriptions, Payments
	•	Side Menu: Profile, Medical Records, Chat
	•	Colors: Softer pastel palette (comfort & empathy)

Design Prompt

Clean, patient-friendly, and emotionally calm. Rounded shapes, soft shadows, warm whites (#FDFDFE). Accessibility AA contrast. All medical info formatted in readable sections with gentle dividers.

⸻

📱 13. Mobile Adaptation
	•	Sidebar collapses to bottom nav
	•	Charts replaced with sparkline cards
	•	Swipe gestures for navigation
	•	Larger tap targets (≥44px)

⸻

🧩 14. Microinteraction Prompts

Action	Animation
Appointment drag-drop	Slot glow + smooth transition
Form Save	Button morph → checkmark pulse
New Patient Created	Slide-in toast with subtle sound
Payment Success	Confetti burst with fade
Alert Modal	Shake animation on invalid input
