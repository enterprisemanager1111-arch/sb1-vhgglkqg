-- Fix: Add missing assignee_id column to task_assignment table
-- Error: column task_assignment.assignee_id does not exist

-- Add the assignee_id column to task_assignment table
ALTER TABLE task_assignment 
ADD COLUMN assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment' 
AND column_name = 'assignee_id';

-- Test that the fix worked
SELECT 'assignee_id column added successfully' as status;
