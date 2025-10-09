-- Complete fix for notifications table
-- This script will handle all possible scenarios

-- Step 1: Check what tables exist with similar names
SELECT 
    table_name,
    table_schema,
    'EXISTING' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%notification%' OR table_name LIKE '%nitification%')
ORDER BY table_name;

-- Step 2: Drop any incorrectly named tables
DROP TABLE IF EXISTS nitifications CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Step 3: Create the correct notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'task',
  title text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'unread',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Step 4: Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications for family members" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Step 6: Create proper RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications for family members"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
    AND user_id IN (
      SELECT user_id FROM family_members 
      WHERE family_id = notifications.family_id
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_family_id_idx ON notifications(family_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Step 8: Test the table with a sample insert
DO $$
DECLARE
    test_family_id uuid;
    test_user_id uuid;
BEGIN
    -- Get a sample family and user ID
    SELECT id INTO test_family_id FROM families LIMIT 1;
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    -- Insert a test notification
    IF test_family_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        INSERT INTO notifications (family_id, user_id, type, title, message, status)
        VALUES (test_family_id, test_user_id, 'test', 'Test Notification', 'This is a test', 'unread');
        
        -- Delete the test notification
        DELETE FROM notifications WHERE type = 'test';
        
        RAISE NOTICE '✅ Notifications table created and tested successfully';
    ELSE
        RAISE NOTICE '⚠️ No families or profiles found for testing';
    END IF;
END $$;

-- Step 9: Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 10: Final verification
SELECT 'notifications table is ready for use' as status;
