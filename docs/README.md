# EYECARE Documentation

Welcome to the EYECARE (OPTIZEN) Eye Care Management System documentation!

## Overview

EYECARE is a comprehensive Eye Care Management System built with modern web technologies:

- **Frontend**: Next.js 14+ with React 18
- **Backend**: Supabase (PostgreSQL database with real-time capabilities)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui with Tailwind CSS
- **TypeScript**: Full type safety across the application

## Quick Start

### Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables** (create `.env.local`)
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Documentation Sections

### 📚 [Configuration](./configuration/mcp-config.md)
Learn how to configure Model Context Protocol (MCP) servers for Figma and Supabase integration.

### 🚀 [Deployment](./deployment/)
Comprehensive guides for deploying the application:
- [Vercel Deployment Guide](./deployment/vercel.md) - Step-by-step Vercel deployment
- [Deployment Steps](./deployment/steps.md) - General deployment process

### 🛠️ [Development](./development/)
Developer resources and guides:
- [Error Report](./development/errors.md) - Common errors and solutions
- [Import Conventions](./development/import-conventions.md) - Code organization standards
- [Unused Code Report](./development/unused-code.md) - Code cleanup analysis
- [Unused Files Report](./development/unused-files.md) - File cleanup analysis

## Key Features

- **Patient Management**: Complete patient records with medical history
- **Appointment Scheduling**: Manage doctor appointments and schedules
- **Case Management**: Track patient cases and diagnoses
- **Billing & Finance**: Invoice generation and payment tracking
- **Bed Management**: Assign and manage hospital beds
- **Pharmacy**: Manage medications and prescriptions
- **Employee Management**: Staff and doctor management
- **Reports & Analytics**: Revenue, attendance, and operational reports
- **Certificates**: Generate medical certificates

## Project Structure

```
EYECARE/
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── auth/              # Authentication routes
├── components/            # React components
│   ├── dialogs/          # Dialog/modal components
│   ├── forms/            # Form components
│   ├── features/         # Feature-specific components
│   └── ui/               # UI primitives (shadcn/ui)
├── lib/                  # Utility libraries
│   ├── services/         # API services
│   └── utils/            # Utility functions
├── docs/                 # Documentation (this site)
└── supabase/            # Supabase migrations and configs
```

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Framework**: React + Tailwind CSS
- **Components**: shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Hooks + Zustand

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or contributions, please visit our [GitHub repository](https://github.com/Maestro2903/OPTIZEN).

## License

See the [LICENSE](../LICENSE) file for details.

---

**Note**: This documentation is powered by [Docsify](https://docsify.js.org/). Use the sidebar to navigate between sections.
