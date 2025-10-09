-- Create simple notifications table without family_id column
-- Run this directly in your Supabase SQL Editor

-- Drop table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table with assignee, assigner, and task_id
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'task',
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Add explicit foreign key constraints with proper names
ALTER TABLE notifications 
ADD CONSTRAINT notifications_assignee_id_fkey 
FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_assigner_id_fkey 
FOREIGN KEY (assigner_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES family_tasks(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (assignee_id = auth.uid());

CREATE POLICY "Users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (assigner_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (assignee_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (assignee_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS notifications_assignee_id_idx ON notifications(assignee_id);
CREATE INDEX IF NOT EXISTS notifications_assigner_id_idx ON notifications(assigner_id);
CREATE INDEX IF NOT EXISTS notifications_task_id_idx ON notifications(task_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Test the table with a sample insert
DO $$
DECLARE
    test_assignee_id uuid;
    test_assigner_id uuid;
    test_task_id uuid;
BEGIN
    -- Get sample user IDs and task ID
    SELECT id INTO test_assignee_id FROM profiles LIMIT 1;
    SELECT id INTO test_assigner_id FROM profiles OFFSET 1 LIMIT 1;
    SELECT id INTO test_task_id FROM family_tasks LIMIT 1;
    
    -- Insert a test notification
    IF test_assignee_id IS NOT NULL AND test_assigner_id IS NOT NULL AND test_task_id IS NOT NULL THEN
        INSERT INTO notifications (assignee_id, assigner_id, task_id, type, status)
        VALUES (test_assignee_id, test_assigner_id, test_task_id, 'test', 'unread');
        
        -- Delete the test notification
        DELETE FROM notifications WHERE type = 'test';
        
        RAISE NOTICE '✅ Notifications table created and tested successfully';
    ELSE
        RAISE NOTICE '⚠️ Not enough data found for testing (need profiles and tasks)';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Final verification
SELECT 'notifications table is ready for use' as status;
