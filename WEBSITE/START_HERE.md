# Quick Start Guide - Fix Port Configuration

## The Problem

You're getting a 404 error because the WEBSITE is trying to connect to port 3004, but the main EYECARE app is running on port 3000 (default Next.js port).

## Quick Fix

### Option 1: Use Default Port 3000 (Recommended)

The code has been updated to default to port 3000. Just make sure:

1. **Main EYECARE app is running:**
   ```bash
   cd /Users/shreeshanthr/Downloads/EYECARE
   npm run dev
   ```
   Should show: `✓ Ready on http://localhost:3000`

2. **WEBSITE is running on a different port:**
   ```bash
   cd /Users/shreeshanthr/Downloads/EYECARE/WEBSITE
   npm run dev
   ```
   Should show: `✓ Ready on http://localhost:3001` (or another port)

3. **Test the booking form** - it should now connect to port 3000

### Option 2: Configure Custom Port

If your main app is running on a different port:

1. **Create `.env.local` in WEBSITE directory:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT
   ```
   Replace `YOUR_PORT` with the actual port (e.g., `3000`, `3004`, etc.)

2. **Restart the WEBSITE dev server** after creating/updating `.env.local`

## Verify It's Working

1. **Check main app is running:**
   - Open browser: `http://localhost:3000/api/public/appointments`
   - Should see a 405 error (method not allowed) - this is GOOD, means the route exists

2. **Check WEBSITE console:**
   - Open browser DevTools (F12)
   - Look for: `[Booking API] API URL: http://localhost:3000`
   - Submit the form and check for success

3. **Check bookings page:**
   - Navigate to: `http://localhost:3000/bookings` (in main app)
   - New bookings should appear with status "pending"

## Common Port Configurations

| Setup | Main App | WEBSITE | API URL in WEBSITE |
|-------|----------|---------|-------------------|
| Default | Port 3000 | Port 3001 | `http://localhost:3000` |
| Custom | Port 3004 | Port 3005 | `http://localhost:3004` (via `.env.local`) |

## Troubleshooting

**Still getting 404?**
1. Make sure main app is actually running
2. Check terminal output for the exact port
3. Verify the API route exists: `http://localhost:PORT/api/public/appointments`
4. Check browser console for the actual URL being called

**CORS errors?**
- Main app allows `localhost` origins
- Make sure you're accessing via `localhost` not `127.0.0.1` or IP address





























