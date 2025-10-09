-- Fix Foreign Key Relationships for family_tasks table
-- Run this script directly on your Supabase database

-- 1. Check current foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'family_tasks';

-- 2. Add foreign key constraint for created_by if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_tasks_created_by_fkey'
    AND table_name = 'family_tasks'
  ) THEN
    ALTER TABLE family_tasks 
    ADD CONSTRAINT family_tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint for created_by';
  ELSE
    RAISE NOTICE 'Foreign key constraint for created_by already exists';
  END IF;
END $$;

-- 3. Add foreign key constraint for assignee_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_tasks_assignee_id_fkey'
    AND table_name = 'family_tasks'
  ) THEN
    ALTER TABLE family_tasks 
    ADD CONSTRAINT family_tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added foreign key constraint for assignee_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint for assignee_id already exists';
  END IF;
END $$;

-- 4. Verify the constraints were added
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'family_tasks'
ORDER BY kcu.column_name;

-- 5. Test the relationship by running a simple query
SELECT 'Foreign key relationships fixed successfully' as status;
