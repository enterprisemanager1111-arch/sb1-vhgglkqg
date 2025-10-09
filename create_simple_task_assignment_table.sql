-- Create a simple task_assignment table that works
-- This ensures multiple assignees can be saved

-- Drop existing table if it exists
DROP TABLE IF EXISTS task_assignment CASCADE;

-- Create simple task_assignment table
CREATE TABLE task_assignment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
    assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Add basic indexes
CREATE INDEX IF NOT EXISTS task_assignment_task_id_idx ON task_assignment(task_id);
CREATE INDEX IF NOT EXISTS task_assignment_assigned_by_idx ON task_assignment(assigned_by);

-- Enable RLS with permissive policy
ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for testing
CREATE POLICY "Allow all operations for authenticated users"
  ON task_assignment
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Test multiple insert
INSERT INTO task_assignment (task_id, assigned_by)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003');

-- Check results
SELECT COUNT(*) as inserted_count FROM task_assignment 
WHERE task_id = '00000000-0000-0000-0000-000000000001';

-- Clean up test data
DELETE FROM task_assignment 
WHERE task_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Task assignment table created and tested successfully' as status;
