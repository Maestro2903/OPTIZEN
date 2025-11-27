# Quick Fix for "Unexpected response format" Error

## The Problem

The API is returning HTML (a 404 page) instead of JSON, which means the endpoint cannot be found.

## Most Common Causes

1. **Main EYECARE app is not running** on port 3004
2. **Wrong port number** - the main app might be on a different port
3. **Main app not accessible** at the configured URL

## Quick Fix Steps

### Step 1: Verify Main App is Running

Check if the main EYECARE app is running:

```bash
# Navigate to main EYECARE directory
cd /Users/shreeshanthr/Downloads/EYECARE

# Check what port it's running on (look for "Ready on http://localhost:XXXX")
npm run dev
```

**Note the port number** - it might not be 3004!

### Step 2: Update API URL

Update the `.env.local` file in the WEBSITE directory to match the actual port:

```env
NEXT_PUBLIC_API_URL=http://localhost:PORT_NUMBER
```

Replace `PORT_NUMBER` with the actual port where the main app is running.

### Step 3: Test the API Endpoint Directly

Open your browser and go to:
```
http://localhost:PORT_NUMBER/api/public/appointments
```

You should see either:
- ✅ An error message (this is good - it means the endpoint exists)
- ❌ A 404 page (means the route doesn't exist or wrong port)

### Step 4: Restart WEBSITE Dev Server

After changing `.env.local`:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Alternative: Run Main App on Port 3004

If you want to use port 3004 for the main app:

1. Update main EYECARE app's `package.json`:
   ```json
   "scripts": {
     "dev": "next dev -p 3004"
   }
   ```

2. Restart the main app

3. Make sure WEBSITE's `.env.local` has:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3004
   ```

## Verify It's Working

After fixing, check the browser console:
- You should see `[Booking API] Response status: 200` or `201`
- You should see `[Booking API] Request body:` with your form data
- No more "Unexpected response format" error

## Still Not Working?

1. **Check both apps are running:**
   ```bash
   # Terminal 1 - Main app
   cd /Users/shreeshanthr/Downloads/EYECARE
   npm run dev
   
   # Terminal 2 - WEBSITE
   cd /Users/shreeshanthr/Downloads/EYECARE/WEBSITE
   npm run dev
   ```

2. **Test API directly:**
   ```bash
   curl -X POST http://localhost:PORT_NUMBER/api/public/appointments \
     -H "Content-Type: application/json" \
     -d '{"full_name":"Test","mobile":"+911234567890","gender":"male","appointment_date":"2024-12-25","start_time":"10:00","end_time":"11:00","type":"consult"}'
   ```

3. **Check console logs** for the actual URL being called







