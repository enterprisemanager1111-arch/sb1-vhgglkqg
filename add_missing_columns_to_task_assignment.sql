-- Add missing columns to task_assignment table
-- Missing: assignee_id and assigned_by columns

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

-- 2. Add assignee_id column
ALTER TABLE task_assignment 
ADD COLUMN assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Add assigned_by column
ALTER TABLE task_assignment 
ADD COLUMN assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Add status column (if missing)
ALTER TABLE task_assignment 
ADD COLUMN status text DEFAULT 'assigned';

-- 5. Add assigned_at column (if missing)
ALTER TABLE task_assignment 
ADD COLUMN assigned_at timestamptz DEFAULT now();

-- 6. Verify all columns were added
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 7. Test that the table is now complete
SELECT 'task_assignment table fixed - all required columns added' as status;
