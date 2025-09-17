/*
  # Fix family members profiles relationship

  1. Database Relationship Fix
    - Add foreign key constraint between family_members.user_id and profiles.id
    - This enables Supabase to join family_members with profiles directly
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper foreign key constraints
*/

-- Add foreign key relationship between family_members and profiles
-- Since profiles.id = users.id (via existing FK), we can create this direct relationship
DO $$
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_members_user_id_profiles_fkey'
    AND table_name = 'family_members'
  ) THEN
    ALTER TABLE family_members 
    ADD CONSTRAINT family_members_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;