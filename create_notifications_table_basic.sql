-- Basic notifications table creation script
-- Run this directly in your Supabase SQL Editor

-- Drop table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table with basic structure
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id uuid NOT NULL,
  assigner_id uuid NOT NULL,
  task_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'task',
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (assignee_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (assignee_id = auth.uid());

CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (assigner_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX notifications_assignee_id_idx ON notifications(assignee_id);
CREATE INDEX notifications_assigner_id_idx ON notifications(assigner_id);
CREATE INDEX notifications_task_id_idx ON notifications(task_id);
CREATE INDEX notifications_status_idx ON notifications(status);
CREATE INDEX notifications_created_at_idx ON notifications(created_at);

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
