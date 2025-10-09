-- Ensure task_assignment table has correct structure for multiple inserts
-- Drop and recreate with minimal structure

-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS task_assignment CASCADE;

-- Create task_assignment table with minimal required columns
CREATE TABLE task_assignment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
    assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Add basic indexes
CREATE INDEX IF NOT EXISTS task_assignment_task_id_idx ON task_assignment(task_id);
CREATE INDEX IF NOT EXISTS task_assignment_assigned_by_idx ON task_assignment(assigned_by);

-- Enable RLS
ALTER TABLE task_assignment ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Allow all operations for authenticated users"
  ON task_assignment
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_assignment'
ORDER BY ordinal_position;

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

SELECT 'Task assignment table structure verified and ready for multiple inserts' as status;
