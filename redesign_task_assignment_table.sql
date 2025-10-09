-- Redesign task_assignment table to match the required logic
-- Logic: task_id (from family_tasks) + user_id (from profiles) → task_assignment

-- 1. Check current structure of task_assignment table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 2. Drop existing task_assignment table if it exists (to start fresh)
DROP TABLE IF EXISTS task_assignment CASCADE;

-- 3. Create new task_assignment table with correct structure
CREATE TABLE task_assignment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    status text DEFAULT 'assigned',
    assigned_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (task_id, user_id) -- A user can only be assigned to a specific task once
);

-- 4. Add indexes for performance
CREATE INDEX task_assignment_task_id_idx ON task_assignment(task_id);
CREATE INDEX task_assignment_user_id_idx ON task_assignment(user_id);
CREATE INDEX task_assignment_status_idx ON task_assignment(status);

-- 5. Enable RLS
ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Family members can view task assignments"
    ON task_assignment
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

CREATE POLICY "Family members can create task assignments"
    ON task_assignment
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

-- 7. Verify the new table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

-- 8. Test that the table is ready
SELECT 'task_assignment table redesigned successfully' as status;
