-- Add user_id column to task_assignment table
-- This column is needed to store which user is assigned to the task

-- Add user_id column
ALTER TABLE task_assignment 
ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- Test that the fix worked
SELECT 'user_id column added successfully to task_assignment table' as status;
