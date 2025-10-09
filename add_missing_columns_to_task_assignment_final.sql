-- Add all missing columns to task_assignment table
-- Missing: status, assigned_at columns

-- 1. Check current structure of task_assignment table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 2. Add status column
ALTER TABLE task_assignment 
ADD COLUMN status text DEFAULT 'assigned';

-- 3. Add assigned_at column
ALTER TABLE task_assignment 
ADD COLUMN assigned_at timestamptz DEFAULT now();

-- 4. Verify all columns were added
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 5. Test that the table is now complete
SELECT 'task_assignment table fixed - status and assigned_at columns added' as status;
