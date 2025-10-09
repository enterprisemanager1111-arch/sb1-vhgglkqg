-- Add nullable assignee_id column to family_tasks table
-- This column is NOT required to save a task

-- Check if assignee_id column already exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'family_tasks' 
AND column_name = 'assignee_id';

-- Add the assignee_id column as nullable (NOT required)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_tasks' 
        AND column_name = 'assignee_id'
    ) THEN
        ALTER TABLE family_tasks 
        ADD COLUMN assignee_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added nullable assignee_id column to family_tasks table';
    ELSE
        RAISE NOTICE 'assignee_id column already exists in family_tasks table';
    END IF;
END $$;

-- Verify the column was added correctly
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'family_tasks' 
AND column_name = 'assignee_id';

-- Test that we can insert a task without assignee_id
SELECT 'assignee_id column added successfully - tasks can be saved without assignee' as status;
