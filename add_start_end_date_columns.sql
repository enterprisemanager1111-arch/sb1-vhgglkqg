-- Add start_date and end_date columns to family_tasks table
-- This will fix the issue where start_date and end_date are not being saved

-- Check if columns already exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'family_tasks' 
AND column_name IN ('start_date', 'end_date');

-- Add start_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_tasks' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE family_tasks 
        ADD COLUMN start_date timestamptz;
        
        RAISE NOTICE 'Added start_date column to family_tasks table';
    ELSE
        RAISE NOTICE 'start_date column already exists in family_tasks table';
    END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_tasks' 
        AND column_name = 'end_date'
    ) THEN
        ALTER TABLE family_tasks 
        ADD COLUMN end_date timestamptz;
        
        RAISE NOTICE 'Added end_date column to family_tasks table';
    ELSE
        RAISE NOTICE 'end_date column already exists in family_tasks table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'family_tasks' 
AND column_name IN ('start_date', 'end_date')
ORDER BY column_name;

-- Test that the fix worked
SELECT 'start_date and end_date columns added successfully to family_tasks table' as status;
