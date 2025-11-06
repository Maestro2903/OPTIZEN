# 🚀 DEPLOY TO VERCEL NOW - Quick Guide

Your code is on GitHub: https://github.com/Maestro2903/eyecare

## Step-by-Step Deployment (5 minutes)

### 1. Go to Vercel
**Open this link:** https://vercel.com/new

### 2. Sign In/Sign Up
- Click **"Continue with GitHub"**
- Authorize Vercel (if first time)

### 3. Import Your Project
- You'll see your repositories
- Find: **Maestro2903/eyecare**
- Click **"Import"**

### 4. Configure Project
Vercel auto-detects Next.js ✅

**Project Settings:**
- Project Name: `eyecare` (or customize)
- Framework Preset: Next.js ✅ (auto-detected)
- Root Directory: `./` (leave as is)
- Build Command: `npm run build` ✅ (auto)
- Output Directory: `.next` ✅ (auto)

### 5. ADD ENVIRONMENT VARIABLES (CRITICAL!)

Click **"Environment Variables"** and add these:

#### Required Variables:

```env
NEXT_PUBLIC_SUPABASE_URL
Your Supabase project URL (e.g., https://xxxxx.supabase.co)

NEXT_PUBLIC_SUPABASE_ANON_KEY
Your Supabase anon/public key

SUPABASE_SERVICE_ROLE_KEY
Your Supabase service role key (keep secret!)

NEXT_PUBLIC_APP_URL
https://eyecare.vercel.app (will update after deployment)
```

**Where to get Supabase credentials:**
1. Go to: https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy the values

**For each variable:**
- Paste the name in "Key"
- Paste the value in "Value"
- Make sure to select all environments (Production, Preview, Development)
- Click "Add"

### 6. Deploy!
- Click **"Deploy"**
- Wait 2-3 minutes ⏱️
- You'll see the build logs in real-time

### 7. SUCCESS! 🎉
You'll get a URL like:
- `https://eyecare.vercel.app`
- or `https://eyecare-xxxxx.vercel.app`

---

## Post-Deployment Setup

### Update Supabase Configuration

After deployment, update Supabase to allow your new domain:

1. **Go to:** https://app.supabase.com
2. **Select your project**
3. **Authentication** → **URL Configuration**
4. **Site URL:** Add your Vercel URL (e.g., `https://eyecare.vercel.app`)
5. **Redirect URLs:** Add:
   - `https://eyecare.vercel.app/**`
   - `https://eyecare.vercel.app/auth/callback`
6. **Save**

### Update Vercel Environment Variable

1. In Vercel, go to your project
2. **Settings** → **Environment Variables**
3. Edit `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
4. **Save**
5. Go to **Deployments** → Click latest → **"Redeploy"**

---

## Automatic Deployments

Now whenever you push to GitHub, Vercel will automatically deploy:

```bash
cd /Users/shreeshanthr/EYECARE
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys! 🚀
```

---

## Custom Domain (Optional)

Want a custom domain like `eyecare.com`?

1. In Vercel: **Settings** → **Domains**
2. Add your domain
3. Update DNS records as shown
4. Update Supabase URLs with your custom domain

---

## Troubleshooting

### Build Fails
- Check environment variables are set
- Check build logs for specific errors
- Verify Supabase credentials

### Can't Login After Deployment
- Verify Supabase URL configuration includes Vercel domain
- Check redirect URLs are correct
- Clear browser cache

### Database Connection Issues
- Ensure all environment variables are in Production environment
- Check Supabase project is active
- Verify service role key is correct

---

## Quick Reference

**Your GitHub Repo:** https://github.com/Maestro2903/eyecare
**Vercel Dashboard:** https://vercel.com/dashboard
**Supabase Dashboard:** https://app.supabase.com

---

**Ready to deploy?** Follow the steps above and your app will be live in 5 minutes! 🚀

