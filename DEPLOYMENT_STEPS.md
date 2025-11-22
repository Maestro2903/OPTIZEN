# Vercel Production Deployment Steps

## Current Status
✅ Code committed and pushed to: https://github.com/Maestro2903/OPTIZEN.git
⚠️ Project needs to be linked/created in Vercel dashboard

## Step-by-Step Deployment Instructions

### Step 1: Connect Project to Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"** or **"Import Project"**
3. Select your Git provider (GitHub)
4. Find and select the repository: **Maestro2903/OPTIZEN**
5. Vercel will auto-detect Next.js framework
6. Project settings will be automatically configured from `vercel.json`

### Step 2: Configure Environment Variables

After importing the project, go to **Settings** → **Environment Variables** and add:

#### Required Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL
   - Example: `https://your-project-id.supabase.co`
   - Environments: Production, Preview, Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anonymous/public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Environments: Production, Preview, Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (keep this secret!)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Environments: Production, Preview, Development
   - ⚠️ **Important**: This is a secret key - never expose it publicly

### Step 3: Deploy

1. After adding environment variables, Vercel will automatically trigger a deployment
2. Or manually trigger from the **Deployments** tab
3. Wait for the build to complete
4. Note your deployment URL (e.g., `https://eyecare.vercel.app` or similar)

### Step 4: Configure Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your production project
3. Navigate to **Authentication** → **URL Configuration**
4. Add your Vercel deployment URL:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: 
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**` (wildcard for all routes)

### Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the following:
   - ✅ Application loads correctly
   - ✅ Login functionality works
   - ✅ Database connections are working
   - ✅ API routes are functioning
   - ✅ Authentication redirects work properly

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Verify all environment variables are set correctly
- Ensure TypeScript errors are resolved (check locally with `npm run build`)

### Authentication Issues
- Verify Supabase redirect URLs are configured
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (for server-side operations)

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that database migrations are applied to production Supabase
- Test connection using the `/api/test-connection` endpoint

## Quick Reference

- **Repository**: https://github.com/Maestro2903/OPTIZEN.git
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com

