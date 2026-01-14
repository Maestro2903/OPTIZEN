# 🚀 Quick Vercel Deployment Guide

This guide will help you deploy your EYECARE application to Vercel in minutes.

## Prerequisites

- ✅ A Vercel account ([Sign up here](https://vercel.com/signup))
- ✅ A Supabase project with database migrations applied
- ✅ Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Push Your Code to Git

If you haven't already, push your code to a Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"** or **"Import Project"**
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Import your repository
5. Vercel will auto-detect Next.js - click **"Deploy"**

## Step 3: Configure Environment Variables

**⚠️ IMPORTANT**: Before the first deployment completes, add these environment variables:

### Required Environment Variables

Go to **Settings** → **Environment Variables** in your Vercel project and add:

#### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Example**: `https://your-project-id.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Environment**: Select all (Production, Preview, Development)

#### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anonymous/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Environment**: Select all (Production, Preview, Development)

#### 3. `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your Supabase service role key (⚠️ Keep this secret!)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **Environment**: Select all (Production, Preview, Development)
- **⚠️ Security Note**: This key has admin privileges. Never expose it to the client-side.

### Optional Environment Variables

- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-app.vercel.app`)

## Step 4: Configure Supabase Redirect URLs

After your first deployment, configure Supabase to allow your Vercel domain:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add to **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/**` (wildcard for all routes)

## Step 5: Redeploy

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for the build to complete

## Step 6: Verify Deployment

1. Visit your deployment URL: `https://your-app.vercel.app`
2. Test the application:
   - ✅ Try logging in
   - ✅ Verify database connections work
   - ✅ Check that pages load correctly
   - ✅ Test API routes

## Using the Deploy Script

Alternatively, you can use the provided deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Build Fails

- **TypeScript Errors**: Fix all TypeScript errors locally first
- **Missing Dependencies**: Ensure all dependencies are in `package.json`
- **Environment Variables**: Verify all required variables are set

### Runtime Errors

- **Supabase Connection**: 
  - Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
  - Check Supabase project is active
  - Ensure migrations are applied

- **Authentication Issues**:
  - Verify redirect URLs are configured in Supabase
  - Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
  - Ensure your Vercel domain is added to Supabase Auth settings

### Check Build Logs

1. Go to **Deployments** → Click on a deployment
2. Check **Build Logs** for errors
3. Check **Function Logs** for runtime errors

## Production Checklist

- [ ] All environment variables are set in Vercel
- [ ] Supabase redirect URLs include your Vercel domain
- [ ] Database migrations are applied to production Supabase
- [ ] Application is tested in production environment
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is active (automatic with Vercel)

## Next Steps

- **Custom Domain**: Add your domain in **Settings** → **Domains**
- **Monitoring**: Set up error monitoring (optional)
- **Analytics**: Enable Vercel Analytics (optional)

## Need Help?

- 📖 [Full Vercel Documentation](./docs/deployment/vercel.md)
- 🔗 [Vercel Docs](https://vercel.com/docs)
- 🔗 [Supabase Docs](https://supabase.com/docs)

---

**🎉 Your app should now be live on Vercel!**
