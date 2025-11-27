# Troubleshooting Guide

## Issue: Submit button keeps loading indefinitely

If the booking form submit button stays in a loading state and never completes, follow these steps:

### Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for error messages. Look for:
- Network errors
- CORS errors
- API URL logs starting with `[Booking API]`

### Step 2: Verify Main EYECARE App is Running

The WEBSITE needs the main EYECARE app to be running to process bookings.

1. **Check if main app is running:**
   ```bash
   # In the main EYECARE directory
   cd /Users/shreeshanthr/Downloads/EYECARE
   npm run dev
   ```
   The main app should be accessible at `http://localhost:3000`

2. **Test the API endpoint directly:**
   Open in browser: `http://localhost:3000/api/public/appointments`
   - You should get a method not allowed error (405) for GET requests, which confirms the endpoint exists

### Step 3: Check Port Conflicts

Both the main EYECARE app and WEBSITE default to port 3000. You need to run them on different ports:

**Option A: Run WEBSITE on a different port**

1. Update `package.json` in WEBSITE:
   ```json
   "scripts": {
     "dev": "next dev -p 3001"
   }
   ```

2. Set the API URL in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. Run both apps:
   ```bash
   # Terminal 1 - Main EYECARE app
   cd /Users/shreeshanthr/Downloads/EYECARE
   npm run dev
   # Runs on http://localhost:3000

   # Terminal 2 - WEBSITE
   cd /Users/shreeshanthr/Downloads/EYECARE/WEBSITE
   npm run dev
   # Runs on http://localhost:3001
   ```

**Option B: Keep WEBSITE on port 3000, run main app on different port**

1. Update main EYECARE app's `package.json`:
   ```json
   "scripts": {
     "dev": "next dev -p 3001"
   }
   ```

2. Update WEBSITE's `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Step 4: Check Environment Variables

Create a `.env.local` file in the WEBSITE root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important:** 
- Environment variables starting with `NEXT_PUBLIC_` are required for browser access
- Restart the development server after changing environment variables
- The variable must match the port where your main EYECARE app is running

### Step 5: Check CORS Configuration

If you see CORS errors in the console:

1. The main EYECARE app allows requests from `localhost` and `127.0.0.1`
2. Make sure you're accessing the WEBSITE via `http://localhost:PORT` (not `127.0.0.1` or `0.0.0.0`)

### Step 6: Check Network Tab

1. Open Developer Tools → Network tab
2. Submit the form
3. Look for the request to `/api/public/appointments`
4. Check:
   - Request status (200, 400, 500, etc.)
   - Response body
   - Request headers

### Common Error Messages and Solutions

#### "Network error: Unable to reach the API"
- **Solution:** Main EYECARE app is not running or wrong API URL
- Check that the main app is running on the configured port
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

#### "Request timeout"
- **Solution:** The API is taking too long (>30 seconds)
- Check if the main app is processing requests
- Check database connection in main app

#### "CORS" or "Failed to fetch"
- **Solution:** CORS configuration issue
- Ensure you're accessing via `localhost` (not IP address)
- Check that main app CORS allows your WEBSITE origin

#### "Missing required fields"
- **Solution:** Form validation issue
- Check browser console for the request body
- Verify all required fields are being sent (full_name, mobile, gender, appointment_date)

### Step 7: Enable Detailed Logging

The code now includes console logging. Check the browser console for:
- `[Booking API] API URL: ...`
- `[Booking API] Request URL: ...`
- `[Booking API] Request body: ...`
- `Submitting appointment request...`
- `Appointment request successful: ...` or error messages

### Quick Diagnostic Checklist

- [ ] Main EYECARE app is running and accessible
- [ ] WEBSITE is running on a different port than main app
- [ ] `.env.local` file exists with correct `NEXT_PUBLIC_API_URL`
- [ ] Development server was restarted after changing `.env.local`
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows the API request is being sent
- [ ] Both apps are accessed via `localhost` (not IP addresses)

### Still Having Issues?

1. Share the browser console errors
2. Share the Network tab response for the failed request
3. Verify both apps are in the correct directories
4. Check that all dependencies are installed (`npm install` in both directories)







