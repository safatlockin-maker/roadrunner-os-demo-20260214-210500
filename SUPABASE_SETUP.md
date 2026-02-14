# Supabase Setup Guide

## Step 1: Create Supabase Project (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create account (or sign in)
4. Click "New Project"
5. Fill in:
   - Name: `roadrunner-crm`
   - Database Password: (generate strong password - save it!)
   - Region: Choose closest to Michigan (e.g., US East)
   - Plan: **Free** (500MB database, perfect for demo)
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your Credentials

Once project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** tab
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
```

## Step 3: Add to Your .env File

Create `.env` file in `/automotive-hero/` directory:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GEMINI_API_KEY=your_gemini_key_here
```

## Step 4: Run Database Schema

1. In Supabase Dashboard, click **SQL Editor** (in sidebar)
2. Click **New Query**
3. Copy the entire contents from `supabase-schema.sql` file
4. Paste into SQL Editor
5. Click **RUN** (bottom right)
6. You should see: "Success. No rows returned"

## Step 5: Verify Tables Created

1. Click **Table Editor** in sidebar
2. You should see 4 tables:
   - `sales_reps`
   - `inventory`
   - `leads`
   - `communications`

✅ Database is ready!

## Next: Insert Demo Data

After tables are created, you can either:
- Use the demo data seed script (coming next)
- Let the app create demo data automatically on first load
- Add real data through the CRM interface

---

**Free Tier Limits (more than enough for demo):**
- 500MB database storage
- Unlimited API requests
- 1GB file storage
- 50,000 monthly active users
- Real-time subscriptions included

Perfect for demo and early production! 🚀
