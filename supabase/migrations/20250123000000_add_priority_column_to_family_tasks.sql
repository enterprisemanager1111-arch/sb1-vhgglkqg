-- Add priority column to family_tasks table
ALTER TABLE family_tasks 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Normal';

-- Update existing rows: map category values to priority
-- 'household' or 'high' -> 'High Level', everything else -> 'Normal'
UPDATE family_tasks 
SET priority = CASE 
  WHEN category = 'household' OR category = 'high' OR category = 'High Level' THEN 'High Level'
  ELSE 'Normal'
END
WHERE priority IS NULL OR priority = 'Normal';

-- Create index for priority column
CREATE INDEX IF NOT EXISTS family_tasks_priority_idx ON family_tasks(priority);

