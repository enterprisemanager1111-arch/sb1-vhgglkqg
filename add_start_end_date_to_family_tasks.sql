-- Add start_date and end_date columns to family_tasks table

-- Add start_date column
ALTER TABLE family_tasks 
ADD COLUMN start_date timestamptz;

-- Add end_date column
ALTER TABLE family_tasks 
ADD COLUMN end_date timestamptz;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'family_tasks'
AND column_name IN ('start_date', 'end_date')
ORDER BY column_name;

-- Test that the fix worked
SELECT 'start_date and end_date columns added successfully to family_tasks table' as status;
