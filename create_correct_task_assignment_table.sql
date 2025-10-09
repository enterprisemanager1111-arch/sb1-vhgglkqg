-- Create or fix task_assignment table with correct structure
-- Only task_id and assigned_by columns

-- Drop existing table if it exists to ensure clean structure
DROP TABLE IF EXISTS task_assignment CASCADE;

-- Create task_assignment table with only the required columns
CREATE TABLE task_assignment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
    assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (task_id, assigned_by) -- A user can only be assigned to a specific task once
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS task_assignment_task_id_idx ON task_assignment(task_id);
CREATE INDEX IF NOT EXISTS task_assignment_assigned_by_idx ON task_assignment(assigned_by);

-- Enable RLS on task_assignment
ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;

-- Policies for task_assignment
CREATE POLICY "Family members can view task assignments"
  ON task_assignment
  FOR SELECT
  TO authenticated
  USING (
    task_id IN (SELECT id FROM family_tasks WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Family members can create task assignments"
  ON task_assignment
  FOR INSERT
  TO authenticated
  WITH CHECK (
    task_id IN (SELECT id FROM family_tasks WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())) 
    AND assigned_by = auth.uid()
  );

CREATE POLICY "Family members can delete task assignments"
  ON task_assignment
  FOR DELETE
  TO authenticated
  USING (
    task_id IN (SELECT id FROM family_tasks WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_assignment_updated_at
  BEFORE UPDATE ON task_assignment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;
