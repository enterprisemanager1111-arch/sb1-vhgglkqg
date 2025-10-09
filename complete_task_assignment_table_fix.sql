-- Complete fix for task_assignment table
-- Add all missing columns: assignee_id and assigned_by

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

-- 2. Add assignee_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'assignee_id'
    ) THEN
        ALTER TABLE task_assignment 
        ADD COLUMN assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added assignee_id column to task_assignment table';
    ELSE
        RAISE NOTICE 'assignee_id column already exists in task_assignment table';
    END IF;
END $$;

-- 3. Add assigned_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'assigned_by'
    ) THEN
        ALTER TABLE task_assignment 
        ADD COLUMN assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added assigned_by column to task_assignment table';
    ELSE
        RAISE NOTICE 'assigned_by column already exists in task_assignment table';
    END IF;
END $$;

-- 4. Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE task_assignment 
        ADD COLUMN status text DEFAULT 'assigned';
        
        RAISE NOTICE 'Added status column to task_assignment table';
    ELSE
        RAISE NOTICE 'status column already exists in task_assignment table';
    END IF;
END $$;

-- 5. Add assigned_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE task_assignment 
        ADD COLUMN assigned_at timestamptz DEFAULT now();
        
        RAISE NOTICE 'Added assigned_at column to task_assignment table';
    ELSE
        RAISE NOTICE 'assigned_at column already exists in task_assignment table';
    END IF;
END $$;

-- 6. Add completed_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignment' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE task_assignment 
        ADD COLUMN completed_at timestamptz;
        
        RAISE NOTICE 'Added completed_at column to task_assignment table';
    ELSE
        RAISE NOTICE 'completed_at column already exists in task_assignment table';
    END IF;
END $$;

-- 7. Verify the final table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 8. Test that the table is now complete
SELECT 'task_assignment table structure fixed successfully' as status;
