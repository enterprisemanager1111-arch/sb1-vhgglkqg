/*
  # Fix family_tasks foreign key relationships

  This migration ensures that the foreign key relationships between family_tasks
  and profiles tables are properly established so that Supabase can perform
  joins in queries.

  1. Database Relationship Fix
    - Ensure foreign key constraints exist between family_tasks and profiles
    - This enables Supabase to join family_tasks with profiles directly
    - Fixes the "Could not find a relationship between 'family_tasks' and 'profiles'" error
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper foreign key constraints
*/

-- Ensure family_tasks table exists with correct structure
CREATE TABLE IF NOT EXISTS family_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  completed boolean DEFAULT false,
  points integer DEFAULT 0,
  category text DEFAULT 'household',
  due_date timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints if they don't exist
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

-- Add indexes for family_tasks if they don't exist
CREATE INDEX IF NOT EXISTS family_tasks_family_id_idx ON family_tasks(family_id);
CREATE INDEX IF NOT EXISTS family_tasks_completed_idx ON family_tasks(completed);
CREATE INDEX IF NOT EXISTS family_tasks_assignee_id_idx ON family_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS family_tasks_created_by_idx ON family_tasks(created_by);
CREATE INDEX IF NOT EXISTS family_tasks_due_date_idx ON family_tasks(due_date) WHERE due_date IS NOT NULL;

-- Enable RLS on family_tasks
ALTER TABLE family_tasks ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for family_tasks
DROP POLICY IF EXISTS "Family members can view family tasks" ON family_tasks;
CREATE POLICY "Family members can view family tasks"
  ON family_tasks
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Family members can create tasks" ON family_tasks;
CREATE POLICY "Family members can create tasks"
  ON family_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Family members can update tasks" ON family_tasks;
CREATE POLICY "Family members can update tasks"
  ON family_tasks
  FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Family members can delete tasks" ON family_tasks;
CREATE POLICY "Family members can delete tasks"
  ON family_tasks
  FOR DELETE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger for family_tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_family_tasks_updated_at ON family_tasks;
CREATE TRIGGER update_family_tasks_updated_at
  BEFORE UPDATE ON family_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
