# 🔧 Detailed Setup Guide

This guide provides step-by-step instructions for setting up the Eye Care Hospital CRM system.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (comes with Node.js)
- **Git** for version control
- A **Supabase account** (sign up at https://supabase.com)
- A code editor (VS Code recommended)

## Step 1: Clone and Install

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/eyecare-crm.git
cd eyecare-crm

# Install dependencies
npm install
\`\`\`

## Step 2: Supabase Project Setup

### 2.1 Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Name**: EyeCare CRM
   - **Database Password**: (choose a strong password)
   - **Region**: Select closest to your location
4. Click "Create new project"
5. Wait for project initialization (~2 minutes)

### 2.2 Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (\`NEXT_PUBLIC_SUPABASE_URL\`)
   - **anon public** key (\`NEXT_PUBLIC_SUPABASE_ANON_KEY\`)
   - **service_role** key (\`SUPABASE_SERVICE_ROLE_KEY\`)

### 2.3 Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste contents from \`supabase/migrations/001_initial_schema.sql\`
4. Click **Run**
5. Repeat for \`supabase/migrations/002_rls_policies.sql\`
6. (Optional) Run \`supabase/seed.sql\` for demo data

## Step 3: Environment Configuration

Create a \`.env.local\` file in the project root:

\`\`\`bash
# Copy from example
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` with your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## Step 4: Run Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at **http://localhost:3000**

## Step 5: Create Your First User

### Option A: Using Supabase Dashboard

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add user** → **Create new user**
3. Enter email and password
4. Click **Create user**
5. Go to **SQL Editor** and run:

\`\`\`sql
INSERT INTO users (id, email, full_name, role)
VALUES (
  'user-id-from-auth-users-table',
  'admin@eyecare.com',
  'Administrator',
  'super_admin'
);
\`\`\`

### Option B: Using Sign-up Flow (when implemented)

Visit **http://localhost:3000/auth/signup** and create an account.

## Step 6: Verify Installation

1. Login with your credentials
2. You should see the dashboard with:
   - KPI cards
   - Activity feed
   - Upcoming appointments
3. Navigate to different modules to ensure they load correctly

## Optional Integrations

### Payment Gateway (Stripe)

1. Create a Stripe account at https://stripe.com
2. Get your API keys from **Developers** → **API keys**
3. Add to \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
\`\`\`

### Payment Gateway (Razorpay) - for India

1. Create a Razorpay account at https://razorpay.com
2. Get your API keys from **Settings** → **API Keys**
3. Add to \`.env.local\`:

\`\`\`env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
\`\`\`

### SMS Notifications (Twilio)

1. Create Twilio account at https://twilio.com
2. Get credentials from console
3. Add to \`.env.local\`:

\`\`\`env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
\`\`\`

### Email (SendGrid)

1. Create SendGrid account at https://sendgrid.com
2. Create an API key
3. Add to \`.env.local\`:

\`\`\`env
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@eyecare.com
\`\`\`

## Troubleshooting

### Port 3000 already in use

\`\`\`bash
# Use a different port
npm run dev -- -p 3001
\`\`\`

### Supabase connection errors

- Verify your \`.env.local\` credentials
- Check if Supabase project is active
- Ensure you're using the correct project URL

### Database migration errors

- Ensure you ran migrations in order (001 before 002)
- Check for syntax errors in SQL
- Verify your database password is correct

### Build errors

\`\`\`bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
\`\`\`

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click **Import Project**
4. Select your repository
5. Configure:
   - **Framework**: Next.js
   - **Build Command**: \`npm run build\`
   - **Output Directory**: \`.next\`
6. Add environment variables (same as \`.env.local\`)
7. Click **Deploy**

### Environment Variables for Production

Make sure to set these in your deployment platform:

- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`NEXT_PUBLIC_APP_URL\` (your production URL)
- Any optional integration keys

## Next Steps

1. **Customize branding**: Update logo, colors in \`tailwind.config.ts\`
2. **Configure roles**: Adjust RLS policies in Supabase
3. **Add users**: Invite staff members via Settings
4. **Import data**: Use CSV import for existing patient records
5. **Setup backups**: Configure Supabase backup schedule
6. **Enable MFA**: Configure multi-factor authentication
7. **Review audit logs**: Set up monitoring and alerting

## Support

If you encounter issues:

1. Check the [README.md](README.md) for common solutions
2. Review Supabase logs in the dashboard
3. Check browser console for errors
4. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, browser)

---

**Setup complete! 🎉 Your Eye Care CRM is ready to use.**

