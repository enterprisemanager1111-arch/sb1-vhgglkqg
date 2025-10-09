-- Test if multiple inserts work in task_assignment table
-- This simulates what the app should be doing

-- First, let's see the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- Test multiple insert (replace with actual UUIDs from your database)
-- This should work if the table structure is correct
INSERT INTO task_assignment (task_id, assigned_by)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004');

-- Check if the inserts worked
SELECT 
    id,
    task_id,
    assigned_by,
    created_at
FROM task_assignment
WHERE task_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;

-- Clean up test data
DELETE FROM task_assignment 
WHERE task_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Multiple insert test completed' as status;
