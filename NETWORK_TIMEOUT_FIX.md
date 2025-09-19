# Network Timeout Fix Guide

## Problem Identified
The error shows:
```
POST https://eqaxmxbqqiuiwkhjwvvz.supabase.co/auth/v1/signup net::ERR_TIMED_OUT
TypeError: Failed to fetch
```

This is a **network-level timeout** - the request reaches Supabase but times out, indicating a project-level issue.

## Most Likely Causes

### 1. Supabase Project is Paused/Inactive ⭐ (Most Common)
- Free tier projects pause after inactivity
- Paused projects return timeout errors
- This is the #1 cause of this specific error

### 2. Database Schema Issues
- Missing columns causing database operations to hang
- Triggers failing and causing timeouts

### 3. Network/Firewall Issues
- Corporate firewall blocking Supabase
- DNS resolution problems

## Immediate Solutions

### Step 1: Check Supabase Project Status (CRITICAL)
1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Check your project status**:
   - If you see "Paused" or "Inactive" → Click "Resume" or "Activate"
   - If you see "Active" → Project is running
3. **Wait 2-3 minutes** after resuming for the project to fully activate

### Step 2: Verify Project Configuration
In your Supabase Dashboard:
1. **Go to Settings → General**
2. **Check Project URL**: Should match your `.env` file
3. **Go to Settings → API**
4. **Verify API Keys**: Should match your `.env` file

### Step 3: Apply Database Migrations
Run these SQL commands in **SQL Editor**:

```sql
-- 1. Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_interests_idx ON profiles USING GIN (interests) WHERE interests IS NOT NULL AND array_length(interests, 1) > 0;

-- 3. Create automatic profile creation trigger
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

-- 4. Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Step 4: Check Auth Settings
In **Authentication → Settings**:
1. **Enable email confirmations**: Set to `false` for testing
2. **Site URL**: Set to your development URL
3. **Redirect URLs**: Add your app's redirect URLs

### Step 5: Test the Fix
1. **Restart your development server**: `npx expo start --clear`
2. **Wait 2-3 minutes** for Supabase to fully activate
3. **Try signing up again**

## Alternative Solutions

### If Project is Active but Still Timing Out

#### Option 1: Check Network Configuration
```bash
# Test basic connectivity
ping supabase.co

# Test your specific project
curl -I https://eqaxmxbqqiuiwkhjwvvz.supabase.co
```

#### Option 2: Try Different Network
- Switch to mobile hotspot
- Try different WiFi network
- Check if corporate firewall is blocking

#### Option 3: Create New Supabase Project
If the current project is corrupted:
1. Create a new Supabase project
2. Update your `.env` file with new credentials
3. Apply the database migrations to the new project

### If Database Migrations Fail
1. **Check permissions**: Ensure you have admin access
2. **Check table existence**: Verify `profiles` table exists
3. **Check for conflicts**: Look for existing triggers

## Expected Results

### After Fixing Project Status
You should see:
```
🚀 SignUp called with: { email: "test@example.com", fullName: "DDD", ... }
🌐 Attempting to connect to Supabase...
📡 Supabase URL: https://eqaxmxbqqiuiwkhjwvvz.supabase.co
✅ Connection test passed, proceeding with signup...
User created successfully: [user-id]
Profile found for user: [user-id]
✅ Signup successful!
```

### If Still Failing
Check the console for specific error messages:
- **"Project not found"** → Wrong URL or project deleted
- **"Invalid API key"** → Wrong API key
- **"Database error"** → Schema issues
- **"Network error"** → Connectivity problems

## Quick Diagnostic Commands

### Test Project Status
```bash
# Check if project responds
curl -I https://eqaxmxbqqiuiwkhjwvvz.supabase.co

# Test auth endpoint
curl -H "apikey: YOUR_ANON_KEY" https://eqaxmxbqqiuiwkhjwvvz.supabase.co/auth/v1/settings
```

### Check Environment Variables
```bash
# Verify .env file
Get-Content .env

# Check if variables are loaded
echo $env:EXPO_PUBLIC_SUPABASE_URL
```

## Most Common Solution
**90% of the time, this error is caused by a paused Supabase project.** Simply resuming the project in the dashboard resolves the issue immediately.

If the project is already active, the issue is likely database schema related and can be fixed by applying the migrations above.
