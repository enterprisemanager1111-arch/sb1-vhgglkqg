-- Add user_id column to task_assignment table
-- This is needed to save all selected family members

-- Add user_id column
ALTER TABLE task_assignment 
ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- Test that the column is ready
SELECT 'user_id column added to task_assignment table' as status;
