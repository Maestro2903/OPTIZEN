# 🏥 EYECARE (OPTIZEN) - Eye Care Management System

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

A comprehensive **Eye Care Management System (CRM)** built with Next.js 14+, React 18, TypeScript, and Supabase. Designed specifically for eye care clinics and hospitals to manage patients, appointments, cases, billing, pharmacy, and more.

> 📚 **[View Full Documentation](https://maestro2903.github.io/OPTIZEN/)** | 🔗 **[GitHub Repository](https://github.com/Maestro2903/OPTIZEN)**

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Modules](#-key-modules)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## ✨ Features

### 🏥 Core Functionality

- **👥 Patient Management**
  - Complete patient records with medical history
  - Patient search and filtering
  - Duplicate patient detection
  - Patient case history tracking
  - Medical certificate generation

- **📅 Appointment Scheduling**
  - Doctor appointment management
  - Appointment scheduling and rescheduling
  - Doctor schedule management
  - Appointment reassignment
  - Calendar view integration

- **🔬 Case Management**
  - Patient case tracking and management
  - Diagnosis records
  - Treatment plans
  - Case history with timeline
  - Eye examination tools

- **💳 Billing & Finance**
  - Invoice generation and management
  - Payment tracking
  - Revenue analytics and reports
  - Expense management
  - Financial dashboard

- **🛏️ Bed Management**
  - Bed assignment and tracking
  - Ward management
  - Bed availability status
  - Patient-bed assignment history

- **💊 Pharmacy Management**
  - Medication inventory
  - Prescription management
  - Pharmacy item tracking
  - Stock management

- **👨‍⚕️ Employee Management**
  - Staff and doctor profiles
  - Role-based access control (RBAC)
  - Employee attendance tracking
  - Department management

- **📊 Reports & Analytics**
  - Revenue reports and charts
  - Attendance reports
  - Operational analytics
  - Custom report generation
  - Data export capabilities

- **🎫 Certificates & Discharges**
  - Medical certificate generation
  - Discharge summary creation
  - Print-friendly formats

### 🔐 Security Features

- Role-based access control (RBAC)
- Secure authentication with Supabase Auth
- API rate limiting
- Audit logging
- Session management
- Data encryption

### 🎨 User Experience

- Modern, responsive UI with Tailwind CSS
- Dark mode support (ready)
- Print-optimized layouts
- Mobile-friendly design
- Real-time updates
- Search functionality across modules

---

## 🛠 Technology Stack

### Frontend

- **[Next.js 14+](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://reactjs.org/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React components
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Zod](https://zod.dev/)** - Schema validation
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend

- **[Supabase](https://supabase.com/)** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage
  - Edge Functions

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[TypeScript](https://www.typescriptlang.org/)** - Type checking
- **[Docsify](https://docsify.js.org/)** - Documentation generator

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.17 or higher ([Download](https://nodejs.org/))
- **npm** 9+ or **yarn** 1.22+ or **pnpm** 8+
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** ([Sign up](https://supabase.com/dashboard))

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Maestro2903/OPTIZEN.git
cd OPTIZEN
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

Using pnpm:
```bash
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [Supabase Dashboard](https://supabase.com/dashboard)
2. Get your project URL and API keys from Project Settings > API
3. Run database migrations (see [Database Setup](#database-setup))

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Custom Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Database Setup

Run the Supabase migrations to set up your database schema:

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

Or apply migrations manually through the Supabase Dashboard > SQL Editor.

All migration files are located in `supabase/migrations/`.

### 6. Run the Development Server

```bash
npm run dev
```

Or using yarn:
```bash
yarn dev
```

Or using pnpm:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## ⚙️ Configuration

### Model Context Protocol (MCP) Configuration

This project includes MCP configuration for AI assistant integrations:

- **Figma Integration**: Connect to Figma for design operations
- **Supabase Integration**: Connect to Supabase for database operations

See [MCP Configuration Documentation](./docs/configuration/mcp-config.md) for detailed setup instructions.

Configuration files:
- `mcp_config.example.json` - Template file (committed)
- `mcp_config.json` - Your configuration (not committed, add to `.gitignore`)

### Application Configuration

- **RBAC**: Configure roles and permissions in `lib/constants/roles.ts`
- **API Routes**: Located in `app/api/`
- **Middleware**: Authentication and RBAC middleware in `middleware.ts`

---

## 🎯 Getting Started

### First Time Setup

1. **Create a Super Admin Account**

   Use the provided script to create a super admin:
   ```bash
   npm run reset-superadmin-password
   ```
   Or use the TypeScript version:
   ```bash
   npx ts-node scripts/reset-superadmin-password.ts
   ```

2. **Login**

   Navigate to `/auth/login` and login with your super admin credentials.

3. **Configure Your Clinic**

   - Set up master data (wards, beds, departments)
   - Add employees and doctors
   - Configure roles and permissions

4. **Start Using**

   - Add patients
   - Schedule appointments
   - Create cases
   - Generate invoices

---

## 📁 Project Structure

```
OPTIZEN/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard routes (protected)
│   │   ├── appointments/        # Appointment management
│   │   ├── patients/            # Patient management
│   │   ├── cases/               # Case management
│   │   ├── billing/             # Billing & invoices
│   │   ├── beds/                # Bed management
│   │   ├── pharmacy/            # Pharmacy management
│   │   ├── employees/           # Employee management
│   │   └── ...                  # Other modules
│   ├── api/                     # API routes
│   │   ├── patients/            # Patient API
│   │   ├── appointments/        # Appointment API
│   │   └── ...                  # Other API endpoints
│   ├── auth/                    # Authentication routes
│   └── layout.tsx               # Root layout
│
├── components/                   # React components
│   ├── dialogs/                 # Modal/dialog components
│   ├── forms/                   # Form components
│   ├── features/                # Feature-specific components
│   ├── print/                   # Print layout components
│   ├── shared/                  # Shared components
│   └── ui/                      # UI primitives (shadcn/ui)
│
├── lib/                          # Utility libraries
│   ├── services/                # API service layer
│   ├── supabase/                # Supabase client setup
│   ├── middleware/              # Middleware utilities
│   ├── utils/                   # Utility functions
│   └── constants/               # Constants and configurations
│
├── hooks/                        # Custom React hooks
├── contexts/                     # React contexts
├── styles/                       # Global styles
├── public/                       # Static assets
├── supabase/                     # Supabase configuration
│   ├── migrations/              # Database migrations
│   └── seed.sql                 # Seed data
│
├── docs/                         # Documentation (Docsify)
│   ├── index.html               # Docsify entry point
│   ├── README.md                # Documentation home
│   ├── configuration/           # Configuration guides
│   ├── deployment/              # Deployment guides
│   └── development/             # Development guides
│
├── scripts/                      # Utility scripts
├── middleware.ts                 # Next.js middleware
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

---

## 🔑 Key Modules

### Patient Management
- **Location**: `app/(dashboard)/patients/`
- **API**: `app/api/patients/`
- **Features**: Create, read, update, search patients, view case history

### Appointment Management
- **Location**: `app/(dashboard)/appointments/`
- **API**: `app/api/appointments/`
- **Features**: Schedule, reschedule, cancel appointments, doctor schedules

### Case Management
- **Location**: `app/(dashboard)/cases/`
- **API**: `app/api/cases/`
- **Features**: Create cases, track diagnoses, treatment plans

### Billing & Finance
- **Location**: `app/(dashboard)/billing/`
- **API**: `app/api/invoices/`
- **Features**: Invoice generation, payment tracking, financial reports

### Bed Management
- **Location**: `app/(dashboard)/beds/`
- **API**: `app/api/beds/`, `app/api/bed-assignments/`
- **Features**: Bed assignment, ward management, availability tracking

### Pharmacy Management
- **Location**: `app/(dashboard)/pharmacy/`
- **API**: `app/api/pharmacy/`
- **Features**: Medication inventory, prescription management

---

## 📚 API Documentation

All API routes are located in `app/api/` and follow RESTful conventions.

### Authentication

Most API routes require authentication. Include the session token in requests.

### Common Endpoints

- **GET** `/api/patients` - List patients
- **POST** `/api/patients` - Create patient
- **GET** `/api/appointments` - List appointments
- **POST** `/api/appointments` - Create appointment
- **GET** `/api/invoices` - List invoices
- **POST** `/api/invoices` - Create invoice

See individual API route files for detailed documentation.

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy!

**Detailed Guide**: [Vercel Deployment Documentation](./docs/deployment/vercel.md)

### Other Platforms

- **Netlify**: Similar to Vercel deployment
- **Docker**: Use Dockerfile (if provided)
- **Self-hosted**: Follow Next.js deployment guide

**General Guide**: [Deployment Steps](./docs/deployment/steps.md)

### Environment Variables for Production

Ensure all environment variables from `.env.local` are set in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Documentation
npm run docs         # Serve documentation locally (port 3001)
npm run docs:dev     # Serve docs and auto-open browser
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Configured for consistent formatting
- **Import Conventions**: See [Import Conventions Guide](./docs/development/import-conventions.md)

### Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with clear messages (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Organization

- **Components**: Organized by feature in `components/`
- **API Routes**: RESTful routes in `app/api/`
- **Utilities**: Reusable functions in `lib/utils/`
- **Types**: TypeScript types in respective files or `lib/supabase/database.types.ts`

---

## 📖 Documentation

### Full Documentation Site

Visit our comprehensive documentation site (powered by Docsify):
**👉 [https://maestro2903.github.io/OPTIZEN/](https://maestro2903.github.io/OPTIZEN/)**

### Documentation Sections

- **[Configuration Guides](./docs/configuration/)** - Setup and configuration
- **[Deployment Guides](./docs/deployment/)** - Deployment instructions
- **[Development Guides](./docs/development/)** - Development resources

### Local Documentation

Serve documentation locally:

```bash
npm run docs
```

Then visit `http://localhost:3001` in your browser.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) (if available) or follow these steps:

1. **Fork the repository**
2. **Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes** following our code style
4. **Test your changes** thoroughly
5. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
6. **Push to the branch** (`git push origin feature/AmazingFeature`)
7. **Open a Pull Request**

### Reporting Issues

If you find a bug or have a feature request, please open an issue on [GitHub Issues](https://github.com/Maestro2903/OPTIZEN/issues).

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🆘 Support

### Getting Help

- **Documentation**: [Full Documentation Site](https://maestro2903.github.io/OPTIZEN/)
- **Issues**: [GitHub Issues](https://github.com/Maestro2903/OPTIZEN/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Maestro2903/OPTIZEN/discussions)

### Common Issues

See [Error Report](./docs/development/errors.md) for common issues and solutions.

### Contact

For questions or support:
- Open an issue on GitHub
- Check existing documentation
- Review development guides

---

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Supabase** for the backend infrastructure
- **shadcn/ui** for the component library
- **Radix UI** for accessible primitives
- All contributors and users of this project

---

## 📊 Project Status

✅ **Active Development** - Regular updates and improvements

Current Version: `1.0.0`

### Roadmap

- [ ] Mobile app version
- [ ] Advanced analytics and reporting
- [ ] Integration with medical devices
- [ ] Multi-language support
- [ ] Enhanced security features

---

<div align="center">

**Built with ❤️ for Eye Care Professionals**

⭐ **Star this repo if you find it helpful!**

[🔝 Back to Top](#-eyecare-optizen---eye-care-management-system)

</div>