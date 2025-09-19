# Fix Signup Database Issue

## Problem
The signup process is failing because the `profiles` table is missing the `role` and `interests` columns that the application code expects.

## Solution

### Option 1: Apply the Migration (Recommended)
If you have access to your Supabase database, run the migration I created:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this SQL command:

```sql
-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;

-- Add interests column to profiles table (array of text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_interests_idx ON profiles USING GIN (interests) WHERE interests IS NOT NULL AND array_length(interests, 1) > 0;
```

### Option 2: Use Supabase CLI (If you have it set up)
```bash
supabase db push
```

### Option 3: Manual Database Update
If you can't run migrations, you can manually add the columns through the Supabase Dashboard:

1. Go to **Table Editor** → **profiles**
2. Add these columns:
   - `role` (text, nullable)
   - `interests` (text array, default: `{}`)

## What This Fixes
- Adds missing `role` column for user roles (parent, child, teenager, etc.)
- Adds missing `interests` column for user interests array
- Adds performance indexes for these new columns
- Maintains backward compatibility with existing data

## After Applying the Fix
1. Restart your development server: `npx expo start --clear`
2. Try signing up again
3. The signup process should now work correctly

## Error Messages You Should See
With the improved error handling, you'll now see specific messages like:
- "Database schema is outdated. Please contact support or try again later." (if columns are missing)
- "Account already exists. Please try signing in instead." (if user already exists)
- More detailed error messages for debugging

The signup process should now work properly once the database schema is updated!
