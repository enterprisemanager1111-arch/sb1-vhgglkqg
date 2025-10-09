-- Test inserting a task with start_date and end_date
-- This will help verify if the columns exist and work correctly

-- Try to insert a test task with start_date and end_date
INSERT INTO family_tasks (
    title, 
    description, 
    start_date, 
    end_date, 
    family_id, 
    created_by
) VALUES (
    'Test Task with Dates',
    'Testing start_date and end_date columns',
    '2025-01-08T00:00:00.000Z',
    '2025-01-15T23:59:59.000Z',
    'your-family-id-here',  -- Replace with actual family ID
    'your-user-id-here'     -- Replace with actual user ID
);

-- Check if the task was inserted successfully
SELECT id, title, start_date, end_date, created_at 
FROM family_tasks 
WHERE title = 'Test Task with Dates'
ORDER BY created_at DESC 
LIMIT 1;

-- Clean up test data
DELETE FROM family_tasks WHERE title = 'Test Task with Dates';
