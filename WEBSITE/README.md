<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19342-XCfWZ_qTjTg4VI5Fu-u2U2YnQMm

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Get these values from your Supabase project dashboard (Settings → API)
   - See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration

3. Run the app:
   ```bash
   npm run dev
   ```

## Appointment Booking Integration

This website connects directly to Supabase for appointment bookings:

- **Booking Form**: Located at `/book-appointment` - allows patients to submit appointment requests
- **Success Page**: Shows confirmation after booking at `/book-appointment/success`
- **Direct Database Access**: Writes directly to Supabase `appointment_requests` table
- **No CRM Required**: Works independently - bookings appear in CRM when staff access `/bookings` page

### How It Works

1. Patient fills out booking form on WEBSITE
2. Data is saved directly to Supabase `appointment_requests` table (status: 'pending')
3. CRM staff can view and accept/reject bookings from the `/bookings` page
4. When accepted, CRM creates patient record and appointment

For more details, see [DIRECT_SUPABASE_SETUP.md](./DIRECT_SUPABASE_SETUP.md) and [BOOKING_FLOW.md](./BOOKING_FLOW.md).
