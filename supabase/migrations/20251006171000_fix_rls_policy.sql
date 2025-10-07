-- Fix RLS policy for family_tasks to avoid hanging issues
-- Drop the existing policy that requires family_members table check
DROP POLICY IF EXISTS "Family members can create tasks" ON family_tasks;

-- Create a simpler policy that only checks if the user is authenticated
CREATE POLICY "Authenticated users can create tasks"
  ON family_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Also update the select policy
DROP POLICY IF EXISTS "Family members can view family tasks" ON family_tasks;

CREATE POLICY "Authenticated users can view tasks"
  ON family_tasks
  FOR SELECT
  TO authenticated
  USING (true);
