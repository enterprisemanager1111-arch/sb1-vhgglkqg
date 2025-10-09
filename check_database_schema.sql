-- Check the actual database schema to understand what exists

-- 1. Check if family_tasks table exists and what columns it has
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'family_tasks'
ORDER BY ordinal_position;

-- 2. Check if task_assignments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('task_assignments', 'task_assignment');

-- 3. Check if task_assignment table exists and what columns it has
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 4. Check all tables that start with 'task'
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'task%';

-- 5. Check all foreign key constraints for family_tasks
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'family_tasks';
