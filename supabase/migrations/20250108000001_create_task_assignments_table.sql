/*
  # Create task_assignments table for multiple assignees per task

  This migration creates a proper task_assignments table to handle multiple
  assignees for a single task, which is more efficient than creating
  multiple tasks for the same work.

  1. New Table
    - `task_assignments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to family_tasks)
      - `assignee_id` (uuid, foreign key to profiles)
      - `assigned_by` (uuid, foreign key to profiles)
      - `assigned_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `status` (text, default 'assigned')

  2. Security
    - Enable RLS on task_assignments table
    - Add policies for family-based access control
    - Ensure only family members can manage assignments

  3. Indexes
    - Add performance indexes for common queries
    - Optimize for real-time subscriptions
*/

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
  assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled'))
);

-- Add indexes for task_assignments
CREATE INDEX IF NOT EXISTS task_assignments_task_id_idx ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_assignee_id_idx ON task_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS task_assignments_assigned_by_idx ON task_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS task_assignments_status_idx ON task_assignments(status);
CREATE INDEX IF NOT EXISTS task_assignments_assigned_at_idx ON task_assignments(assigned_at);

-- Enable RLS on task_assignments
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_assignments
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

-- Create function to automatically create task assignment when task is created with assignee_id
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

-- Create trigger to automatically create task assignment
DROP TRIGGER IF EXISTS create_task_assignment_trigger ON family_tasks;
CREATE TRIGGER create_task_assignment_trigger
  AFTER INSERT ON family_tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_assignment_on_insert();
