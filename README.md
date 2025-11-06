# 🏥 Eye Care Hospital CRM

A comprehensive, production-ready Hospital Management System specifically designed for eye care clinics and ophthalmic practices.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Modules

- **📊 Dashboard**: Real-time KPIs, activity feed, and performance metrics
- **👤 Patient Management**: Comprehensive patient records with medical history
- **📅 Appointment Scheduling**: Multi-provider calendar with drag-and-drop
- **📋 Clinical Charting**: Ophthalmic examination templates (VA, IOP, refraction)
- **💳 Billing & Payments**: Invoice generation with payment gateway integration
- **👓 Optical Shop**: Inventory management and POS system
- **🏥 Surgery Management**: Pre-op, intra-op, and post-op workflow
- **📈 Analytics**: Reports and data visualization
- **⚙️ Settings**: User management and RBAC configuration
- **🌐 Patient Portal**: Self-service appointment booking and records access

### Technical Highlights

- **Modern Stack**: Next.js 14 (App Router), React 18, TypeScript
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Authentication**: Multi-role support (8 user roles)
- **State Management**: Zustand for global state
- **Form Validation**: React Hook Form + Zod schemas
- **UI Components**: shadcn/ui (customized for medical UX)
- **Real-time Updates**: Supabase Realtime subscriptions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### Installation

1. **Clone the repository**

\`\`\`bash
git clone https://github.com/yourusername/eyecare-crm.git
cd eyecare-crm
\`\`\`

2. **Install dependencies**

\`\`\`bash
npm install
\`\`\`

3. **Configure environment variables**

Create a \`.env.local\` file in the root directory:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional: Communication Services
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

4. **Setup Supabase Database**

Run the migrations in your Supabase SQL editor:

\`\`\`bash
# Navigate to Supabase SQL Editor and run:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
# 3. supabase/seed.sql (optional - for demo data)
\`\`\`

5. **Run development server**

\`\`\`bash
npm run dev
\`\`\`

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
eyecare-crm/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication layouts
│   ├── (dashboard)/              # Main application
│   │   └── dashboard/
│   │       ├── patients/         # Patient management
│   │       ├── appointments/     # Scheduling
│   │       ├── clinical/         # Clinical charting
│   │       ├── billing/          # Billing & payments
│   │       ├── optical/          # Optical shop
│   │       ├── surgery/          # Surgery management
│   │       ├── analytics/        # Reports & analytics
│   │       └── settings/         # Settings & admin
│   ├── portal/                   # Patient portal
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   └── shared/                   # Shared components
├── lib/
│   ├── supabase/                 # Supabase client & types
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── database.types.ts
│   ├── utils.ts                  # Utility functions
│   └── constants/                # Application constants
├── supabase/
│   ├── migrations/               # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   └── seed.sql                  # Demo data
├── public/                       # Static assets
├── docs/                         # Documentation
├── Design.md                     # Design specifications
├── Product.md                    # Product requirements
├── README.md                     # This file
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
\`\`\`

## 🎨 Design System

### Color Palette (Eye-Centric Theme)

| Role        | Color         | Hex       |
|-------------|---------------|-----------|
| Primary     | Deep Sapphire | #043A6B   |
| Accent      | Aqua Blue     | #009FE3   |
| Background  | Snow White    | #F9FAFB   |
| Success     | Emerald       | #10B981   |
| Warning     | Amber         | #F59E0B   |
| Error       | Crimson       | #EF4444   |
| Info        | Sky Blue      | #3B82F6   |

### Typography

- **Headings**: Inter (600–700, 20–32px)
- **Body**: Inter (400–500, 14–16px)
- **Labels**: Inter (500, 12–13px)
- **Data/Numbers**: IBM Plex Mono (500, 13px)

## 👥 User Roles & Permissions

1. **Super Admin**: Full system access
2. **Hospital Admin**: Clinic management and configuration
3. **Receptionist**: Patient registration, appointment booking
4. **Optometrist**: Patient examination and refraction
5. **Ophthalmologist**: Full clinical access including surgery
6. **Technician**: Device data entry and basic charting
7. **Billing Staff**: Invoice and payment management
8. **Patient**: Portal access for self-service

## 🔐 Security Features

- Row-Level Security (RLS) policies in PostgreSQL
- Field-level encryption for PHI (Personal Health Information)
- Audit logging for all critical operations
- Multi-factor authentication (MFA) support
- TLS encryption for data in transit
- AES-256 encryption for data at rest

## 📊 Database Schema

### Core Tables

- `users` - User accounts and roles
- `patients` - Patient master records
- `appointments` - Appointment scheduling
- `encounters` - Clinical examination records
- `invoices` & `invoice_items` - Billing
- `inventory` - Optical shop products
- `optical_orders` - Optical prescriptions and orders
- `surgeries` - Surgical procedures
- `audit_logs` - System audit trail

See `supabase/migrations/001_initial_schema.sql` for complete schema.

## 🧪 Testing

\`\`\`bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
\`\`\`

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

\`\`\`bash
# Using Vercel CLI
vercel --prod
\`\`\`

### Docker

\`\`\`bash
# Build image
docker build -t eyecare-crm .

# Run container
docker run -p 3000:3000 eyecare-crm
\`\`\`

## 📚 API Documentation

API routes are located in \`app/api/\`:

- \`/api/patients\` - Patient CRUD operations
- \`/api/appointments\` - Appointment management
- \`/api/encounters\` - Clinical records
- \`/api/billing\` - Invoice generation
- \`/api/inventory\` - Optical shop inventory

## 🛠️ Development Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide Icons](https://lucide.dev/) - Icon library

## 📞 Support

For support, email support@eyecare.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Telemedicine integration
- [ ] AI-powered diagnosis suggestions
- [ ] Multi-language support
- [ ] WhatsApp integration for reminders
- [ ] DICOM viewer integration
- [ ] Lab integration
- [ ] Insurance claims automation

---

**Built with ❤️ for the eye care community**

