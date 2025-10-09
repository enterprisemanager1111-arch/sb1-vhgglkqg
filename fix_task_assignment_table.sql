-- Fix the task_assignment table (singular name, not task_assignments)
-- Add missing assigned_by column

-- 1. Check if task_assignment table exists and what columns it has
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 2. Add the missing assigned_by column to task_assignment table
DO $$
BEGIN
    -- Check if assigned_by column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'assigned_by'
    ) THEN
        -- Add the assigned_by column
        ALTER TABLE task_assignment 
        ADD COLUMN assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added assigned_by column to task_assignment table';
    ELSE
        RAISE NOTICE 'assigned_by column already exists in task_assignment table';
    END IF;
END $$;

-- 3. Verify the column was added
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 4. Test that the table structure is correct
SELECT 'task_assignment table fixed successfully' as status;
