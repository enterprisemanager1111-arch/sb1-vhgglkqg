# Timeout Fix Guide

## Problem Identified
From the console logs, we can see:
- ✅ Connection test passed - Supabase is reachable
- ❌ `TimeoutError: signal timed out` - The signup request is timing out

## Root Causes

### 1. Database Schema Issues
The most likely cause is that the database schema is missing required columns or triggers, causing the signup process to hang.

### 2. Supabase Project Status
The project might be paused or have configuration issues.

### 3. Network Configuration
The timeout configuration might be too aggressive.

## Solutions Applied

### 1. Removed Aggressive Timeout Configuration
- Removed the global `AbortSignal.timeout()` that was interfering with Supabase's internal timeout handling
- Increased the signup timeout from 30 to 60 seconds
- Let Supabase handle its own network timeouts

### 2. Enhanced Error Handling
- Added detailed logging to identify exactly where the timeout occurs
- Improved error messages for different failure scenarios

## Next Steps to Fix the Issue

### Step 1: Check Supabase Project Status
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Check if your project is **active** (not paused)
3. If paused, click "Resume" to reactivate it

### Step 2: Apply Database Migrations
The timeout is likely caused by missing database schema. Run these SQL commands in your Supabase SQL Editor:

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

### Step 3: Check Auth Settings
In your Supabase Dashboard:
1. Go to **Authentication → Settings**
2. Ensure **Enable email confirmations** is set appropriately
3. Check **Site URL** is configured correctly
4. Verify **Redirect URLs** are set up

### Step 4: Test the Fix
1. Restart your development server: `npx expo start --clear`
2. Try signing up again
3. Check the console for the new detailed logs

## Expected Behavior After Fix

### Successful Signup
You should see these console messages:
```
🚀 SignUp called with: { email: "test@example.com", fullName: "DDD", ... }
🌐 Attempting to connect to Supabase...
📡 Supabase URL: https://eqaxmxbqqiuiwkhjwvvz.supabase.co
✅ Connection test passed, proceeding with signup...
User created successfully: [user-id]
Profile found for user: [user-id]
✅ Signup successful!
```

### If Still Timing Out
If you still see timeout errors, the issue is likely:
1. **Database trigger hanging** - The automatic profile creation trigger might be failing
2. **Missing database permissions** - RLS policies might be blocking the operation
3. **Network issues** - Corporate firewall or slow connection

## Troubleshooting Steps

### If Database Migrations Fail
1. Check if you have the correct permissions in Supabase
2. Verify the profiles table exists
3. Check for any existing triggers that might conflict

### If Auth Settings Are Wrong
1. Ensure email confirmations are disabled for testing (or properly configured)
2. Check that the site URL matches your development environment
3. Verify redirect URLs are set up correctly

### If Network Issues Persist
1. Try on a different network (mobile hotspot)
2. Check if corporate firewall is blocking Supabase
3. Test with a different Supabase project

## Alternative Approach
If the automatic trigger approach doesn't work, we can modify the signup process to:
1. Create the user first
2. Manually create the profile without relying on triggers
3. Handle any database errors gracefully

The key is to identify exactly where the timeout occurs and fix that specific issue.
