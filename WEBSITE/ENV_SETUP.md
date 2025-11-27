# Environment Variables Setup

This document describes the required environment variables for the WEBSITE application.

## Required Environment Variables

Create a `.env.local` file in the root of the WEBSITE directory with the following variables:

### Supabase Configuration (REQUIRED)

The WEBSITE connects directly to Supabase - no CRM server needed!

```env
# Supabase Project URL (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

# Supabase Anonymous Key (Required)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to Get These Values

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Example `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Setup Instructions

1. **Get your Supabase credentials** from your Supabase project dashboard
2. **Create `.env.local`** in the WEBSITE root directory
3. **Add the Supabase URL and anon key** (see example above)
4. **Restart your development server** after creating/updating `.env.local`

## How It Works

The WEBSITE now writes directly to Supabase:
- Booking form → Direct insert to `appointment_requests` table
- Status: Always `'pending'` when created
- CRM can access these requests later via `/bookings` page

## Setup Instructions

1. **Copy the example file** (if available):
   ```bash
   cp .env.example .env.local
   ```

2. **Set the API URL**:
   - For local development: `NEXT_PUBLIC_API_URL=http://localhost:3000`
   - For production: `NEXT_PUBLIC_API_URL=https://your-eyecare-app.com`

3. **Verify the main EYECARE app is running**:
   - The booking API endpoints must be accessible at `${NEXT_PUBLIC_API_URL}/api/public/appointments`
   - The appointment requests endpoint must be accessible at `${NEXT_PUBLIC_API_URL}/api/appointment-requests`

## Database Access

The WEBSITE writes directly to the Supabase `appointment_requests` table:
- **No CRM server required** - works independently
- **RLS Policies** - Row Level Security allows public inserts (already configured)
- **Status**: Always `'pending'` when created from public form

### Database Table Structure

Bookings are stored in `appointment_requests` with:
- Patient information (name, email, mobile, gender)
- Appointment details (date, time, type)
- Status: `'pending'` (changed to `'accepted'` or `'rejected'` in CRM)

## Troubleshooting

### Missing Environment Variables Error

If you see: "Missing Supabase environment variables"

1. **Check `.env.local` exists** in the WEBSITE root directory
2. **Verify both variables are set**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Restart the dev server** after creating/updating `.env.local`

### Permission Denied / RLS Errors

If you see RLS (Row Level Security) errors:

1. **Verify RLS policies exist** - Check that migrations `042` and `043` are applied
2. **Check Supabase dashboard** → Authentication → Policies → `appointment_requests`
3. **Verify anon key permissions** - Should allow public INSERT and SELECT

### Booking Not Appearing in CRM

1. **Check Supabase dashboard** → Table Editor → `appointment_requests`
   - Should see your booking with status `'pending'`
2. **Verify CRM is running** and can access Supabase
3. **Check CRM `/bookings` page** - Should query `appointment_requests` table

## Development vs Production

### Local Development

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

No need to specify ports or API URLs - direct database access!

### Production

Use the same Supabase credentials. The anon key is safe to expose in client-side code (RLS protects your data).

