# 🎯 START HERE - EYECARE CRM Backend Setup

## 👋 Welcome!

You're about to set up the backend for your Eye Care Hospital Management System. This will take **5-10 minutes**.

---

## 📋 What You Need

- ✅ Computer with internet
- ✅ Web browser
- ✅ This project open in VS Code
- ✅ 10 minutes of time

---

## 🚀 3-Step Setup

### Step 1️⃣: Create Supabase Account (2 min)

1. Open: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"Sign up"** (use GitHub for fastest signup)
3. Click **"New Project"**
4. Fill in:
   ```
   Name: eyecare-crm
   Password: [Click generate - COPY THIS PASSWORD!]
   Region: [Choose closest to you]
   ```
5. Click **"Create new project"**
6. ⏳ Wait 2 minutes while it sets up

---

### Step 2️⃣: Copy API Keys (1 min)

1. Once project is ready, click **Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. You'll see 3 important values - **COPY ALL THREE**:

```
📍 Project URL
https://xxxxxxxxxxxxx.supabase.co

🔑 anon public key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔐 service_role key (SECRET!)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 3️⃣: Configure Your Project (2 min)

1. **Create `.env.local` file** in your project root:
   ```bash
   # In VS Code, create new file: .env.local
   ```

2. **Paste this** (replace with YOUR values from Step 2):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Save the file** (Cmd/Ctrl + S)

---

## 🗄️ Setup Database (3 min)

### Run 4 SQL Scripts

1. In Supabase Dashboard → Click **SQL Editor** (in sidebar)
2. Click **"New Query"**
3. Copy & paste each file below, then click **"Run"**:

#### Script 1: Core Tables
```bash
📁 Open: supabase/migrations/001_initial_schema.sql
📋 Copy all content
✅ Paste in SQL Editor → Click "Run"
```

#### Script 2: Security
```bash
📁 Open: supabase/migrations/002_rls_policies.sql
📋 Copy all content
✅ Paste in SQL Editor → Click "Run"
```

#### Script 3: Extended Tables
```bash
📁 Open: supabase/migrations/003_pharmacy_attendance_revenue.sql
📋 Copy all content
✅ Paste in SQL Editor → Click "Run"
```

#### Script 4: Bed Management
```bash
📁 Open: supabase/migrations/004_bed_management.sql
📋 Copy all content
✅ Paste in SQL Editor → Click "Run"
```

#### Script 5: Demo Data (Optional)
```bash
📁 Open: supabase/seed.sql
📋 Copy all content
✅ Paste in SQL Editor → Click "Run"
```

✅ All scripts should show: **"Success. No rows returned"**

---

## 👤 Create Admin User (2 min)

### Part A: Create Auth User

1. In Supabase → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   ```
   Email: admin@eyecare.com
   Password: Admin@123456
   ✅ Check "Auto Confirm User"
   ```
4. Click **"Create user"**

### Part B: Assign Admin Role

1. Go to **SQL Editor** → **"New Query"**
2. Paste this:
   ```sql
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'admin@eyecare.com'),
     'admin@eyecare.com',
     'System Administrator',
     'super_admin',
     true
   );
   ```
3. Click **"Run"** ✅

---

## 🧪 Test It! (1 min)

### Start Your App

```bash
# In VS Code Terminal (Ctrl + `)
npm run dev
```

### Login

1. Open browser: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Login with:
   ```
   Email: admin@eyecare.com
   Password: Admin@123456
   ```
3. You should see the Cases page! 🎉

---

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] API keys copied
- [ ] `.env.local` file created
- [ ] All 4 SQL scripts run successfully
- [ ] Admin user created
- [ ] Admin role assigned
- [ ] App starts without errors
- [ ] Login works
- [ ] Dashboard loads

---

## 🚨 Having Issues?

### "Invalid API key"
- Check `.env.local` has correct keys
- Restart dev server: Stop (Ctrl+C) then `npm run dev`

### "relation does not exist"
- Run all 4 SQL scripts in order
- Check for errors in SQL Editor

### "Login failed"
- Verify admin user was created in Authentication → Users
- Check password is correct
- Make sure you ran the INSERT users query

### Still stuck?
- Check: `BACKEND_SETUP_GUIDE.md` for detailed troubleshooting
- Or: `QUICK_START_BACKEND.md` for step-by-step guide

---

## 🎉 You're Done!

Your backend is now running! You can:

✅ Login to the system  
✅ Access all dashboard pages  
✅ Create patients, cases, appointments  
✅ Manage billing and operations  
✅ Track inventory and pharmacy  

---

## 📚 What's Next?

1. **Explore the app** - Click through all pages
2. **Add real data** - Start with a few test patients
3. **Customize** - Modify forms and fields as needed
4. **Deploy** - When ready, deploy to Vercel

---

## 📖 Documentation

- **Quick Start**: `QUICK_START_BACKEND.md`
- **Full Guide**: `BACKEND_SETUP_GUIDE.md`
- **Status**: `BACKEND_STATUS.md`
- **UI Guide**: `UI_DESIGN_SYSTEM.md`

---

## 💡 Pro Tips

1. **Bookmark** your Supabase dashboard
2. **Save** your admin password securely
3. **Backup** your `.env.local` file
4. **Read** the documentation for advanced features
5. **Test** everything before going live

---

**Total Time**: ~10 minutes ⏱️  
**Difficulty**: Easy 🟢  
**Status**: Ready to use! 🚀

---

*Need help? Check the troubleshooting section above or refer to the detailed guides.*

**Happy coding! 👨‍💻👩‍💻**
