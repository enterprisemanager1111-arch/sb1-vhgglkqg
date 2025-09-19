# IMMEDIATE FIX: Supabase Connection Issue

## Problem Identified
Your Supabase project is **PAUSED/INACTIVE**, which is why signup/signin cannot connect to the service.

## IMMEDIATE SOLUTIONS

### Solution 1: Resume Your Existing Project (Recommended)

**Step 1: Go to Supabase Dashboard**
1. Open: https://supabase.com/dashboard
2. Sign in with your account
3. Find your project (eqaxmxbqqiuiwkhjwvvz)

**Step 2: Resume the Project**
1. Look for "Paused" or "Inactive" status
2. Click "Resume" or "Activate" button
3. Wait 2-3 minutes for activation

**Step 3: Verify Fix**
```bash
node check-supabase-status.js
```

### Solution 2: Create New Supabase Project (If Resume Fails)

**Step 1: Create New Project**
1. Go to: https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization
4. Enter project name: "famora-app"
5. Enter database password
6. Choose region closest to you
7. Click "Create new project"

**Step 2: Get New Credentials**
1. Go to Settings → API
2. Copy Project URL
3. Copy anon public key

**Step 3: Update Environment Variables**
Update your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-new-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```

**Step 4: Apply Database Schema**
Run these SQL commands in SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  role text,
  interests text[] DEFAULT '{}',
  birth_date DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create automatic profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Family Member'),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Solution 3: Use Local Development (Temporary)

If you need to test immediately, you can use a local Supabase instance:

**Step 1: Install Supabase CLI**
```bash
npm install -g supabase
```

**Step 2: Start Local Supabase**
```bash
supabase start
```

**Step 3: Update .env with Local URLs**
```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

## Quick Test Commands

### Test Current Status
```bash
node check-supabase-status.js
```

### Test After Fix
```bash
# Restart development server
npx expo start --clear

# Test signup/signin in the app
```

## Expected Results

### After Successful Fix
You should see:
```
✅ SUCCESS! Your Supabase project is ACTIVE and working!
🎉 You can now try signing up/signing in again.
```

### In Your App Console
```
🚀 SignUp called with: { email: "test@example.com", fullName: "DDD", ... }
🌐 Attempting to connect to Supabase...
📡 Supabase URL: https://your-project.supabase.co
✅ Connection test passed, proceeding with signup...
User created successfully: [user-id]
✅ Signup successful!
```

## Troubleshooting

### If Resume Doesn't Work
- Check if you have the correct account
- Verify project ownership
- Try creating a new project

### If New Project Creation Fails
- Check your Supabase account limits
- Verify payment method (if required)
- Contact Supabase support

### If Local Development
- Ensure Docker is running
- Check port availability
- Verify Supabase CLI installation

## Priority Actions
1. **FIRST**: Try to resume existing project
2. **SECOND**: Create new project if resume fails
3. **THIRD**: Use local development for immediate testing

The fastest solution is usually resuming your existing project in the Supabase dashboard.
