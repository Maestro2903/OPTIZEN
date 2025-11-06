# 🚀 Vercel Deployment Guide for EyeCare CRM

## Quick Deployment Steps

### Step 1: Push to GitHub (if not already done)

1. Go to [GitHub](https://github.com) and create a new repository called `eyecare-crm`
2. In your terminal, run:

```bash
cd /Users/shreeshanthr/EYECARE
git remote add origin https://github.com/YOUR_USERNAME/eyecare-crm.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up or log in (you can use your GitHub account)
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repository `eyecare-crm`
5. Vercel will automatically detect it's a Next.js project

### Step 3: Configure Environment Variables

Before deploying, you **MUST** add these environment variables in Vercel:

#### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- `NEXT_PUBLIC_APP_URL` = Your Vercel deployment URL (e.g., `https://eyecare-crm.vercel.app`)

#### To add environment variables in Vercel:
1. In the import screen, expand **"Environment Variables"**
2. Add each variable name and value
3. Make sure to select **Production**, **Preview**, and **Development** environments

#### Optional Variables (for integrations):
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if using Stripe)
- `STRIPE_SECRET_KEY` (if using Stripe)
- `RAZORPAY_KEY_ID` (if using Razorpay)
- `RAZORPAY_KEY_SECRET` (if using Razorpay)
- `TWILIO_ACCOUNT_SID` (if using Twilio)
- `TWILIO_AUTH_TOKEN` (if using Twilio)
- `TWILIO_PHONE_NUMBER` (if using Twilio)
- `SENDGRID_API_KEY` (if using SendGrid)
- `SENDGRID_FROM_EMAIL` (if using SendGrid)

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Once deployed, you'll get a URL like `https://eyecare-crm.vercel.app`

### Step 5: Update Supabase Settings

After deployment, you need to update your Supabase configuration:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
5. Add redirect URLs:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback`
6. Save changes

### Step 6: Update Environment Variable

Go back to Vercel:
1. Go to your project settings
2. Click **"Environment Variables"**
3. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
4. Click **"Save"**
5. Redeploy by going to **Deployments** → Click on latest deployment → **"Redeploy"**

## Alternative: Deploy Without GitHub

If you prefer not to use GitHub:

1. Go to [Vercel](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Instead of importing from Git, use **Vercel CLI** (requires fixing your npm first) or drag & drop your project folder

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify your Supabase credentials are valid
- Check the build logs in Vercel dashboard for specific errors

### Can't Access After Deployment
- Verify Supabase URL configuration includes your Vercel domain
- Check that RLS policies in Supabase allow proper access
- Clear your browser cache

### Database Connection Issues
- Ensure environment variables are in all environments (Production, Preview, Development)
- Check Supabase project is active and running
- Verify network settings in Supabase

## Post-Deployment

### Update Your Vercel URL
After first deployment, update `NEXT_PUBLIC_APP_URL` in environment variables with your actual Vercel URL.

### Set Up Custom Domain (Optional)
1. In Vercel, go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase allowed URLs with your custom domain

### Monitor Your Application
- Check logs: Vercel Dashboard → Your Project → **Functions**
- Set up alerts: Vercel Dashboard → **Settings** → **Integrations**

## Quick Commands Reference

```bash
# If you fix npm and want to use Vercel CLI:
npm install -g vercel
cd /Users/shreeshanthr/EYECARE
vercel login
vercel

# To redeploy after changes:
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys on push
```

## Getting Your Supabase Credentials

If you need to find your Supabase credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY) ⚠️ Keep this secret!

## Support

If you encounter issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- Review build logs in Vercel dashboard
- Check Supabase connection in dashboard

---

**Your EyeCare CRM will be live in minutes! 🎉**

