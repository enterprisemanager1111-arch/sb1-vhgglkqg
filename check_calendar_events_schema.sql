-- Check the current schema of calendar_events table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
ORDER BY ordinal_position;
