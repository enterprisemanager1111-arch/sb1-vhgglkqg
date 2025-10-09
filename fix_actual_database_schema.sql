-- Fix the actual database schema based on the error codes
-- PGRST204: assignee_id column missing from family_tasks
-- PGRST205: task_assignments table missing

-- 1. Add the missing assignee_id column to family_tasks table (nullable, not required)
DO $$
BEGIN
    -- Check if assignee_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_tasks' 
        AND column_name = 'assignee_id'
    ) THEN
        -- Add the assignee_id column as nullable (NOT required to save)
        ALTER TABLE family_tasks 
        ADD COLUMN assignee_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added nullable assignee_id column to family_tasks table';
    ELSE
        RAISE NOTICE 'assignee_id column already exists in family_tasks table';
    END IF;
END $$;

-- 2. Create the task_assignments table (not task_assignment)
CREATE TABLE IF NOT EXISTS task_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
    assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    assigned_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (task_id, assignee_id)
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS task_assignments_task_id_idx ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_assignee_id_idx ON task_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS task_assignments_status_idx ON task_assignments(status);

-- 4. Enable RLS on task_assignments
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for task_assignments
DROP POLICY IF EXISTS "Family members can view task assignments" ON task_assignments;
CREATE POLICY "Family members can view task assignments"
    ON task_assignments
    FOR SELECT
    TO authenticated
    USING (
        task_id IN (
            SELECT id FROM family_tasks 
            WHERE family_id IN (
                SELECT family_id FROM family_members 
                WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Family members can create task assignments" ON task_assignments;
CREATE POLICY "Family members can create task assignments"
    ON task_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        task_id IN (
            SELECT id FROM family_tasks 
            WHERE family_id IN (
                SELECT family_id FROM family_members 
                WHERE user_id = auth.uid()
            )
        )
        AND assigned_by = auth.uid()
    );

-- 6. Verify the schema was fixed
SELECT 'Schema fix completed' as status;

-- 7. Check the final schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('family_tasks', 'task_assignments')
ORDER BY table_name, ordinal_position;
