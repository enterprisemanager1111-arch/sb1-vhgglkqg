-- Check what columns actually exist in task_assignment table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;
