-- Add missing status column to task_assignment table
-- Error: column task_assignment.status does not exist

-- Add the status column
ALTER TABLE task_assignment 
ADD COLUMN status text DEFAULT 'assigned';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'task_assignment' 
AND column_name = 'status';

-- Test that the fix worked
SELECT 'status column added successfully to task_assignment table' as status;
