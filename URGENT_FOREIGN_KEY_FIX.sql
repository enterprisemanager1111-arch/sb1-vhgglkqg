-- URGENT: Fix Foreign Key Relationships for family_tasks table
-- This error confirms the foreign key constraints are missing

-- Check what foreign key constraints currently exist
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

-- Add the missing foreign key constraint for assignee_id
-- This is what the error is specifically complaining about
ALTER TABLE family_tasks 
ADD CONSTRAINT family_tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Also add the foreign key constraint for created_by (likely missing too)
ALTER TABLE family_tasks 
ADD CONSTRAINT family_tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify the constraints were added
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
    AND tc.table_name = 'family_tasks'
ORDER BY kcu.column_name;

-- Test that the relationship now works
SELECT 'Foreign key constraints added successfully' as status;
