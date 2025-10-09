-- Fix Task Creation Issue
-- This script fixes the foreign key relationships and creates the task_assignments table

-- 1. Ensure family_tasks table has proper foreign key constraints
DO $$
BEGIN
  -- Add foreign key constraint for assignee_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_tasks_assignee_id_fkey'
    AND table_name = 'family_tasks'
  ) THEN
    ALTER TABLE family_tasks 
    ADD CONSTRAINT family_tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key constraint for created_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_tasks_created_by_fkey'
    AND table_name = 'family_tasks'
  ) THEN
    ALTER TABLE family_tasks 
    ADD CONSTRAINT family_tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Create task_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
  assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled'))
);

-- 3. Add indexes for task_assignments
CREATE INDEX IF NOT EXISTS task_assignments_task_id_idx ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_assignee_id_idx ON task_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS task_assignments_assigned_by_idx ON task_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS task_assignments_status_idx ON task_assignments(status);
CREATE INDEX IF NOT EXISTS task_assignments_assigned_at_idx ON task_assignments(assigned_at);

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
    AND assignee_id IN (
      SELECT user_id FROM family_members 
      WHERE family_id IN (
        SELECT family_id FROM family_tasks 
        WHERE id = task_id
      )
    )
  );

DROP POLICY IF EXISTS "Family members can update task assignments" ON task_assignments;
CREATE POLICY "Family members can update task assignments"
  ON task_assignments
  FOR UPDATE
  TO authenticated
  USING (
    task_id IN (
      SELECT id FROM family_tasks 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT id FROM family_tasks 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Family members can delete task assignments" ON task_assignments;
CREATE POLICY "Family members can delete task assignments"
  ON task_assignments
  FOR DELETE
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

-- 6. Create function to automatically create task assignment when task is created with assignee_id
CREATE OR REPLACE FUNCTION create_task_assignment_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If the task has an assignee_id, create a task assignment
  IF NEW.assignee_id IS NOT NULL THEN
    INSERT INTO task_assignments (task_id, assignee_id, assigned_by, status)
    VALUES (NEW.id, NEW.assignee_id, NEW.created_by, 'assigned');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to automatically create task assignment
DROP TRIGGER IF EXISTS create_task_assignment_trigger ON family_tasks;
CREATE TRIGGER create_task_assignment_trigger
  AFTER INSERT ON family_tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_assignment_on_insert();

-- 8. Refresh the schema cache to ensure Supabase recognizes the relationships
NOTIFY pgrst, 'reload schema';
