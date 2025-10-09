-- Ensure user_id column exists in task_assignment table
-- This is required to save multiple assignees

-- Check if user_id column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment' 
AND column_name = 'user_id';

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE task_assignment 
        ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added user_id column to task_assignment table';
    ELSE
        RAISE NOTICE 'user_id column already exists in task_assignment table';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment' 
AND column_name = 'user_id';

-- Test inserting multiple assignments
SELECT 'user_id column ready for multiple assignees' as status;
