-- Add assignee_id column to task_assignment table if it doesn't exist
DO $$
BEGIN
    -- Check if assignee_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'assignee_id'
    ) THEN
        -- Add the assignee_id column
        ALTER TABLE task_assignment 
        ADD COLUMN assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added assignee_id column to task_assignment table';
    ELSE
        RAISE NOTICE 'assignee_id column already exists in task_assignment table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;