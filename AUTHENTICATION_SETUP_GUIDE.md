# Authentication Setup Guide

## Problem
Both sign up and sign in are not working because the Supabase environment variables are not configured.

## Root Cause
The app is trying to connect to Supabase but can't find the required environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Solution

### Step 1: Create Environment File
Create a `.env` file in your project root (same level as `package.json`) with the following content:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
```

### Step 2: Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one if you don't have one)
3. **Navigate to Settings → API**
4. **Copy the following values**:
   - **Project URL** → Use as `EXPO_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon public** → Use as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Example .env File
Replace the placeholder values with your actual Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MjQwMCwiZXhwIjoyMDE0MzM4NDAwfQ.example_key_here
```

### Step 4: Apply Database Migrations
After setting up the environment variables, you need to apply the database migrations to fix the schema issues:

1. **Go to your Supabase Dashboard → SQL Editor**
2. **Run the first migration** (add missing columns):
```sql
-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;

-- Add interests column to profiles table (array of text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_interests_idx ON profiles USING GIN (interests) WHERE interests IS NOT NULL AND array_length(interests, 1) > 0;
```

3. **Run the second migration** (add automatic profile creation):
```sql
-- Create function to handle new user profile creation
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

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Step 5: Restart Your Development Server
```bash
npx expo start --clear
```

### Step 6: Test Authentication
1. **Try signing up** with a new account
2. **Try signing in** with existing credentials
3. Both should now work properly

## What This Fixes
✅ **Environment Variables**: Configures Supabase connection  
✅ **Database Schema**: Adds missing `role` and `interests` columns  
✅ **Profile Creation**: Adds automatic profile creation trigger  
✅ **Authentication**: Enables both sign up and sign in functionality  

## Troubleshooting

### If you still get errors:

1. **Check your .env file**:
   - Make sure it's in the project root
   - Make sure there are no spaces around the `=` sign
   - Make sure the values are correct

2. **Check your Supabase project**:
   - Make sure the project is active
   - Make sure the API keys are correct
   - Make sure the database is accessible

3. **Check the console**:
   - Look for any error messages in the development console
   - Check if the environment variables are being loaded

### Common Error Messages:
- **"Missing Supabase environment variables"** → Environment variables not set
- **"Database schema is outdated"** → Run the database migrations
- **"Network error"** → Check your internet connection and Supabase project status
- **"Invalid credentials"** → Check your email/password or create a new account

## Security Notes
- **Never commit your .env file** to version control
- **Keep your API keys secure**
- **Use environment variables for all sensitive data**

Once you complete these steps, both sign up and sign in should work perfectly!
