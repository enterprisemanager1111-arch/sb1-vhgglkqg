/*
  # Add role and interests fields to profiles table

  1. Changes
    - Add `role` column to `profiles` table (text, optional)
    - Add `interests` column to `profiles` table (text[], array of strings)
    - Both columns are optional for backward compatibility

  2. Security
    - Maintains existing RLS policies
    - Role and interests are private and only accessible by the profile owner
    - No additional permissions needed

  This migration adds the missing fields that the signup process requires.
*/

-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;

-- Add interests column to profiles table (array of text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Add index for role queries (for performance when filtering by role)
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role) WHERE role IS NOT NULL;

-- Add index for interests queries (for performance when searching by interests)
CREATE INDEX IF NOT EXISTS profiles_interests_idx ON profiles USING GIN (interests) WHERE interests IS NOT NULL AND array_length(interests, 1) > 0;

-- Update existing policies to include new fields (policies already cover all columns)
-- No additional policy changes needed as existing policies use SELECT/UPDATE/INSERT with * or general permissions
