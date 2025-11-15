# Vercel Deployment Guide

This guide will help you deploy the EYECARE application to Vercel.

## Prerequisites

1. A Vercel account ([sign up here](https://vercel.com/signup) if you don't have one)
2. A Supabase project with the database schema migrated
3. Git repository (GitHub, GitLab, or Bitbucket) connected to your project

## Step 1: Prepare Your Repository

Ensure your code is pushed to your Git repository. Vercel will automatically deploy from your repository.

## Step 2: Connect Your Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js framework

## Step 3: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

### Required Environment Variables

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Example**: `https://your-project-id.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Visibility**: Public (exposed to client-side)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous/public key for client-side operations
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Visibility**: Public (exposed to client-side)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key for server-side operations (bypasses RLS)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **Visibility**: Private (server-side only - NEVER expose to client)
- **Security Note**: This key has admin privileges. Keep it secure and never commit it to version control.

### How to Add Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

## Step 4: Deploy

1. After adding environment variables, Vercel will automatically trigger a new deployment
2. Or manually trigger a deployment from the **Deployments** tab
3. Wait for the build to complete

## Step 5: Verify Deployment

1. Once deployed, visit your Vercel deployment URL
2. Test the application:
   - Try logging in
   - Verify database connections work
   - Check that API routes are functioning

## Step 6: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS records

## Troubleshooting

### Build Failures

- **TypeScript Errors**: Check that all TypeScript errors are resolved locally before deploying
- **Missing Dependencies**: Ensure all dependencies are listed in `package.json`
- **Environment Variables**: Verify all required environment variables are set in Vercel

### Runtime Errors

- **Supabase Connection Issues**: 
  - Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
  - Check that your Supabase project is active
  - Ensure database migrations have been applied

- **Authentication Issues**:
  - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
  - Check Supabase Auth settings (redirect URLs, etc.)
  - Add your Vercel domain to Supabase Auth redirect URLs

### Adding Redirect URLs in Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel deployment URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: 
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**` (for wildcard matching)

## Production Checklist

- [ ] All environment variables are set in Vercel
- [ ] Supabase redirect URLs are configured
- [ ] Database migrations are applied to production Supabase instance
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active (automatic with Vercel)
- [ ] Application is tested in production environment
- [ ] Error monitoring is set up (optional but recommended)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Supabase Documentation](https://supabase.com/docs)

