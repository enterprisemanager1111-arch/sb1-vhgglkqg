-- Ensure family_tasks table exists with correct structure
CREATE TABLE IF NOT EXISTS family_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  points integer DEFAULT 0,
  category text DEFAULT 'general',
  due_date timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  family_id uuid NOT NULL,
  created_by uuid NOT NULL,
  assignee_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add family_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_tasks_family_id_fkey' 
    AND table_name = 'family_tasks'
  ) THEN
    ALTER TABLE family_tasks 
    ADD CONSTRAINT family_tasks_family_id_fkey 
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
  END IF;

  -- Add created_by foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_tasks_created_by_fkey' 
    AND table_name = 'family_tasks'
  ) THEN
    ALTER TABLE family_tasks 
    ADD CONSTRAINT family_tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Add assignee_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_tasks_assignee_id_fkey' 
    AND table_name = 'family_tasks'
  ) THEN
    ALTER TABLE family_tasks 
    ADD CONSTRAINT family_tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS family_tasks_family_id_idx ON family_tasks(family_id);
CREATE INDEX IF NOT EXISTS family_tasks_completed_idx ON family_tasks(completed);
CREATE INDEX IF NOT EXISTS family_tasks_assignee_id_idx ON family_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS family_tasks_created_by_idx ON family_tasks(created_by);
CREATE INDEX IF NOT EXISTS family_tasks_due_date_idx ON family_tasks(due_date) WHERE due_date IS NOT NULL;

-- Enable RLS
ALTER TABLE family_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Family members can view family tasks" ON family_tasks;
CREATE POLICY "Family members can view family tasks"
  ON family_tasks
  FOR SELECT
  USING (
    family_id IN (
      SELECT f.id 
      FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Family members can create tasks" ON family_tasks;
CREATE POLICY "Family members can create tasks"
  ON family_tasks
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT f.id 
      FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Family members can update tasks" ON family_tasks;
CREATE POLICY "Family members can update tasks"
  ON family_tasks
  FOR UPDATE
  USING (
    family_id IN (
      SELECT f.id 
      FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Family members can delete tasks" ON family_tasks;
CREATE POLICY "Family members can delete tasks"
  ON family_tasks
  FOR DELETE
  USING (
    family_id IN (
      SELECT f.id 
      FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = auth.uid()
    )
  );
