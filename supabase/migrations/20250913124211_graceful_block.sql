/*
  # Add birth_date field to profiles table

  1. Changes
    - Add `birth_date` column to `profiles` table
    - Column is optional (nullable) for privacy
    - Uses DATE type for birthday storage
    - Add index for birthday queries

  2. Security
    - Maintains existing RLS policies
    - Birth date is private and only accessible by the profile owner
    - No additional permissions needed

  This migration adds birthday functionality while maintaining privacy and security.
*/

-- Add birth_date column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add index for birthday queries (for performance when checking birthdays)
CREATE INDEX IF NOT EXISTS profiles_birth_date_idx ON profiles (birth_date) WHERE birth_date IS NOT NULL;

-- Update existing policies to include birth_date (policies already cover all columns)
-- No additional policy changes needed as existing policies use SELECT/UPDATE/INSERT with * or general permissions