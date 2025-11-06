# ⚡ Quick Start Guide

Get the Eye Care Hospital CRM running in **5 minutes**!

## Prerequisites Check

\`\`\`bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version
\`\`\`

If you don't have Node.js 18+, download from https://nodejs.org

## Step 1: Install Dependencies (2 minutes)

\`\`\`bash
cd /Users/shreeshanthr/EYECARE
npm install
\`\`\`

This will install all required packages (~200MB).

## Step 2: Setup Environment (1 minute)

Create a \`.env.local\` file:

\`\`\`bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
\`\`\`

**Don't have Supabase yet?** Follow the 2-minute setup:

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Name it "EyeCare" and choose a password
4. Wait 2 minutes for setup
5. Go to Settings → API and copy your keys
6. Paste them in \`.env.local\`

## Step 3: Setup Database (1 minute)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste from \`supabase/migrations/001_initial_schema.sql\`
4. Click **Run**
5. Create another query with \`supabase/migrations/002_rls_policies.sql\`
6. Click **Run**
7. (Optional) Run \`supabase/seed.sql\` for demo data

## Step 4: Start Development Server (10 seconds)

\`\`\`bash
npm run dev
\`\`\`

## Step 5: Open Your Browser

Navigate to: **http://localhost:3000**

You should see the dashboard redirect!

## 🎉 That's it!

You now have a fully functional Eye Care Hospital CRM running locally.

## What You'll See

### Main Application (Dashboard)
- **Dashboard**: http://localhost:3000/dashboard
- **Patients**: http://localhost:3000/dashboard/patients
- **Appointments**: http://localhost:3000/dashboard/appointments
- **Clinical**: http://localhost:3000/dashboard/clinical
- **Billing**: http://localhost:3000/dashboard/billing
- **Optical**: http://localhost:3000/dashboard/optical
- **Surgery**: http://localhost:3000/dashboard/surgery
- **Analytics**: http://localhost:3000/dashboard/analytics
- **Settings**: http://localhost:3000/dashboard/settings

### Patient Portal
- **Portal Home**: http://localhost:3000/portal

## Troubleshooting

### "Port 3000 is already in use"
\`\`\`bash
npm run dev -- -p 3001
\`\`\`
Then visit http://localhost:3001

### "Cannot find module"
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### "Supabase connection error"
- Check your \`.env.local\` file
- Verify the URL and keys are correct
- Make sure there are no extra spaces

### Database errors
- Ensure you ran migrations in order (001, then 002)
- Check Supabase dashboard for error messages
- Verify your database is active

## Next Steps

1. **Create a user**: Add a user in Supabase Auth
2. **Explore modules**: Click through each section
3. **Customize**: Update colors in \`tailwind.config.ts\`
4. **Add data**: Use the seed.sql file
5. **Read docs**: Check README.md and SETUP.md

## Useful Commands

\`\`\`bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Run production build
npm run lint          # Run linter

# Clean rebuild
rm -rf .next
npm run dev
\`\`\`

## Need Help?

- 📖 Read [SETUP.md](SETUP.md) for detailed instructions
- 📋 Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for features
- 🐛 Open an issue on GitHub
- 💬 Check the documentation files

---

**Enjoy building with Eye Care CRM! 🏥👁️**

