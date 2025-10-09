-- Fix notifications table name issue
-- The error suggests the table might be named 'nitifications' instead of 'notifications'

-- First, let's check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%';

-- If the table is named 'nitifications' (with 'i'), rename it to 'notifications'
DO $$
BEGIN
    -- Check if 'nitifications' table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nitifications' AND table_schema = 'public') THEN
        -- Rename the table
        ALTER TABLE nitifications RENAME TO notifications;
        RAISE NOTICE 'Table nitifications renamed to notifications';
    ELSE
        RAISE NOTICE 'Table nitifications does not exist';
    END IF;
    
    -- Check if 'notifications' table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        RAISE NOTICE 'Table notifications exists';
    ELSE
        RAISE NOTICE 'Table notifications does not exist';
    END IF;
END $$;

-- If neither table exists, create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications for family members" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_family_id_idx ON notifications(family_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Verify the table exists and is accessible
SELECT 'notifications table is ready' as status;
