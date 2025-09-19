# Fix Signup Timeout Issue

## Problem
When trying to sign up, you get the error: "Login is taking too long. Please check your internet connection."

## Root Cause
The signup process was taking too long due to:
1. Missing database columns (`role` and `interests`)
2. Inefficient profile creation with multiple retries
3. No timeout handling for the signup process specifically

## Solution Applied

### 1. Added Missing Database Columns
The `profiles` table was missing the `role` and `interests` columns that the signup process tries to use.

**Apply this migration to your Supabase database:**

```sql
-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;

-- Add interests column to profiles table (array of text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_interests_idx ON profiles USING GIN (interests) WHERE interests IS NOT NULL AND array_length(interests, 1) > 0;
```

### 2. Added Automatic Profile Creation Trigger
This eliminates the need for retry logic and speeds up the signup process.

**Apply this migration to your Supabase database:**

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

### 3. Improved Signup Process
- Added proper timeout handling (30 seconds for signup vs 15 seconds for login)
- Reduced retry logic and wait times
- Better error messages for different failure scenarios
- Enhanced validation and error handling

## How to Apply the Fix

### Step 1: Update Database Schema
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the first migration (add columns):
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
   CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role) WHERE role IS NOT NULL;
   CREATE INDEX IF NOT EXISTS profiles_interests_idx ON profiles USING GIN (interests) WHERE interests IS NOT NULL AND array_length(interests, 1) > 0;
   ```

4. Run the second migration (add trigger):
   ```sql
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

   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
   ```

### Step 2: Restart Your App
```bash
npx expo start --clear
```

### Step 3: Test Signup
Try signing up again. You should now see:
- Faster signup process (no more timeout errors)
- Better error messages if something goes wrong
- Successful account creation with profile setup

## What's Fixed
✅ **Timeout Error**: Signup now has proper timeout handling (30 seconds)  
✅ **Missing Columns**: Added `role` and `interests` columns to profiles table  
✅ **Slow Profile Creation**: Added automatic trigger for instant profile creation  
✅ **Better Error Messages**: More specific error messages for debugging  
✅ **Performance**: Reduced retry logic and wait times  

## Error Messages You'll See Now
- **Success**: "Account created successfully!"
- **Database Issues**: "Database schema is outdated. Please contact support or try again later."
- **Network Issues**: "Network error: Unable to connect to the server. Please check your internet connection and try again."
- **Timeout**: "Signup is taking too long. Please check your internet connection and try again."
- **Duplicate Account**: "This email is already registered. Try signing in instead."

The signup process should now work smoothly without timeout errors!
