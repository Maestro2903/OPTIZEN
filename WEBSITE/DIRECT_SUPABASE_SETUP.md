# Direct Supabase Access Setup

The WEBSITE now connects directly to Supabase instead of going through the CRM API. This means the booking form works independently - no need for the CRM to be running!

## What Changed

- ✅ **Direct Database Access**: Booking form writes directly to `appointment_requests` table
- ✅ **No CRM Required**: Website works independently
- ✅ **RLS Enabled**: Row Level Security allows public inserts (already configured)

## Environment Variables Required

Create a `.env.local` file in the WEBSITE root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to Get These Values

1. **Go to your Supabase project dashboard**
2. **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## How It Works

### Flow:

```
Public Booking Form (WEBSITE)
    ↓
Direct Supabase Insert (anon key)
    ↓
appointment_requests table (status: 'pending')
    ↓
CRM Bookings Page (when staff access)
    ↓
Staff can Accept/Reject
```

### Database Table: `appointment_requests`

The form creates records with:
- `status`: Always `'pending'` when created
- All form data (name, email, mobile, date, time, type, etc.)
- `created_at`: Auto-generated timestamp

### RLS Policies (Already Configured)

The database has these policies (from migrations):
- ✅ **Public can INSERT** - Anyone can create appointment requests
- ✅ **Public can SELECT** - Anyone can view appointment requests (for success page)
- ✅ **Authenticated users can manage** - Staff can accept/reject in CRM

## Testing

1. **Set up environment variables** in `.env.local`
2. **Restart the WEBSITE dev server**
3. **Submit a booking form**
4. **Check Supabase dashboard** → `appointment_requests` table
5. **Check CRM bookings page** (when CRM is running) → should see the new booking

## Troubleshooting

### Error: "Missing Supabase environment variables"

- Check that `.env.local` exists in WEBSITE root
- Verify both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the dev server after adding/updating `.env.local`

### Error: "Permission denied" or RLS errors

- Verify RLS policies are set up (migration 043)
- Check that the anon key has proper permissions
- Verify the `appointment_requests` table exists

### Booking not appearing in CRM

- Check that the record was created in Supabase dashboard
- Verify the CRM is querying `appointment_requests` table correctly
- Check that status is `'pending'`

## Benefits

✅ **Works offline** - No dependency on CRM running
✅ **Faster** - Direct database access
✅ **Simpler** - No API server needed
✅ **Scalable** - Can handle many concurrent bookings
✅ **Secure** - RLS policies ensure data integrity

## Next Steps

1. Copy Supabase credentials from your project
2. Add them to `.env.local`
3. Restart the WEBSITE server
4. Test the booking form!
















