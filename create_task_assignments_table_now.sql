-- Create task_assignments table immediately
-- Run this script directly on your Supabase database

-- 1. Create the task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
  assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled'))
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS task_assignments_task_id_idx ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_assignee_id_idx ON task_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS task_assignments_assigned_by_idx ON task_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS task_assignments_status_idx ON task_assignments(status);
CREATE INDEX IF NOT EXISTS task_assignments_assigned_at_idx ON task_assignments(assigned_at);

-- 3. Enable RLS
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
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

-- 5. Create function to automatically create task assignment when task is created with assignee_id
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

-- 6. Create trigger to automatically create task assignment
DROP TRIGGER IF EXISTS create_task_assignment_trigger ON family_tasks;
CREATE TRIGGER create_task_assignment_trigger
  AFTER INSERT ON family_tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_assignment_on_insert();

-- 7. Verify the table was created
SELECT 'task_assignments table created successfully' as status;

-- 8. Check if the table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
ORDER BY ordinal_position;
