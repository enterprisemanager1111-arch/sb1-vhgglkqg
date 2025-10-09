-- Add all missing columns to task_assignment table
-- Missing: status, assigned_at, completed_at columns

-- Add status column
ALTER TABLE task_assignment 
ADD COLUMN status text DEFAULT 'assigned';

-- Add assigned_at column
ALTER TABLE task_assignment 
ADD COLUMN assigned_at timestamptz DEFAULT now();

-- Add completed_at column
ALTER TABLE task_assignment 
ADD COLUMN completed_at timestamptz;

-- Verify all columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- Test that the table is now complete
SELECT 'All missing columns added to task_assignment table' as status;
