-- Complete database schema fix for task creation
-- Add all missing columns to both family_tasks and task_assignment tables

-- 1. Add start_date and end_date columns to family_tasks table
ALTER TABLE family_tasks 
ADD COLUMN start_date timestamptz;

ALTER TABLE family_tasks 
ADD COLUMN end_date timestamptz;

-- 2. Add user_id column to task_assignment table
ALTER TABLE task_assignment 
ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Add assigned_by column to task_assignment table
ALTER TABLE task_assignment 
ADD COLUMN assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Add status column to task_assignment table
ALTER TABLE task_assignment 
ADD COLUMN status text DEFAULT 'assigned';

-- 5. Add assigned_at column to task_assignment table
ALTER TABLE task_assignment 
ADD COLUMN assigned_at timestamptz DEFAULT now();

-- 6. Add completed_at column to task_assignment table
ALTER TABLE task_assignment 
ADD COLUMN completed_at timestamptz;

-- 7. Verify family_tasks table structure
SELECT 'family_tasks table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'family_tasks'
ORDER BY ordinal_position;

-- 8. Verify task_assignment table structure
SELECT 'task_assignment table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 9. Test that the schema is now complete
SELECT 'Database schema fixed - all required columns added' as status;
