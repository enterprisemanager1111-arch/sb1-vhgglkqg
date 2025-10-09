-- Check if there are any constraints preventing multiple assignments
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'task_assignment'
ORDER BY tc.constraint_name;

-- Check current data in task_assignment table
SELECT 
    id,
    task_id,
    assigned_by,
    created_at
FROM task_assignment
ORDER BY created_at DESC
LIMIT 10;
