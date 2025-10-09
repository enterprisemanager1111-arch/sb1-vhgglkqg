-- Check the current structure of family_tasks table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'family_tasks'
ORDER BY ordinal_position;
