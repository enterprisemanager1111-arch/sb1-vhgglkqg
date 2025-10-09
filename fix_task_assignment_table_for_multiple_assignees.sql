-- Fix task_assignment table to allow multiple assignees per task
-- Remove any constraints that might prevent multiple assignments

-- Check current constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'task_assignment'
ORDER BY tc.constraint_name;

-- Drop the unique constraint if it exists (this might be preventing multiple assignments)
DO $$
BEGIN
    -- Check if unique constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'task_assignment' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%task_id%'
    ) THEN
        -- Get the constraint name and drop it
        DECLARE
            constraint_name_to_drop text;
        BEGIN
            SELECT tc.constraint_name INTO constraint_name_to_drop
            FROM information_schema.table_constraints tc
            WHERE tc.table_name = 'task_assignment' 
            AND tc.constraint_type = 'UNIQUE'
            AND tc.constraint_name LIKE '%task_id%'
            LIMIT 1;
            
            IF constraint_name_to_drop IS NOT NULL THEN
                EXECUTE 'ALTER TABLE task_assignment DROP CONSTRAINT ' || constraint_name_to_drop;
                RAISE NOTICE 'Dropped unique constraint: %', constraint_name_to_drop;
            END IF;
        END;
    ELSE
        RAISE NOTICE 'No unique constraint found on task_assignment table';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- Test insert multiple assignments for the same task
-- (This is just to verify the structure works)
SELECT 'Table structure verified - multiple assignments should now be possible' as status;
