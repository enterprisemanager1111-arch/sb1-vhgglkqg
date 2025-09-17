/*
  # Fix missing database tables and functions

  This migration ensures all required tables exist with proper structure.
*/

-- Ensure calendar_events table exists with correct structure
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  location text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendees text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for calendar_events
CREATE INDEX IF NOT EXISTS calendar_events_family_id_idx ON calendar_events(family_id);
CREATE INDEX IF NOT EXISTS calendar_events_event_date_idx ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS calendar_events_created_by_idx ON calendar_events(created_by);

-- Enable RLS on calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for calendar_events
CREATE POLICY "Family members can view calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Family members can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Family members can delete their own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- Add update trigger for calendar_events
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure shopping_items table exists
CREATE TABLE IF NOT EXISTS shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'general',
  quantity text,
  completed boolean DEFAULT false,
  added_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for shopping_items if they don't exist
CREATE INDEX IF NOT EXISTS shopping_items_family_id_idx ON shopping_items(family_id);
CREATE INDEX IF NOT EXISTS shopping_items_completed_idx ON shopping_items(completed);
CREATE INDEX IF NOT EXISTS shopping_items_category_idx ON shopping_items(category);

-- Enable RLS on shopping_items
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for shopping_items (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_items' AND policyname = 'Family members can view shopping items'
  ) THEN
    CREATE POLICY "Family members can view shopping items"
      ON shopping_items
      FOR SELECT
      TO authenticated
      USING (family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_items' AND policyname = 'Family members can create shopping items'
  ) THEN
    CREATE POLICY "Family members can create shopping items"
      ON shopping_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        family_id IN (
          SELECT family_id FROM family_members WHERE user_id = auth.uid()
        ) AND added_by = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_items' AND policyname = 'Family members can update shopping items'
  ) THEN
    CREATE POLICY "Family members can update shopping items"
      ON shopping_items
      FOR UPDATE
      TO authenticated
      USING (family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_items' AND policyname = 'Family members can delete shopping items'
  ) THEN
    CREATE POLICY "Family members can delete shopping items"
      ON shopping_items
      FOR DELETE
      TO authenticated
      USING (family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      ));
  END IF;
END
$$;

-- Add update trigger for shopping_items
DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON shopping_items;
CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
  due_date timestampz,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for family_tasks if they don't exist
CREATE INDEX IF NOT EXISTS family_tasks_family_id_idx ON family_tasks(family_id);
CREATE INDEX IF NOT EXISTS family_tasks_completed_idx ON family_tasks(completed);
CREATE INDEX IF NOT EXISTS family_tasks_assignee_id_idx ON family_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS family_tasks_due_date_idx ON family_tasks(due_date) WHERE due_date IS NOT NULL;

-- Enable RLS on family_tasks
ALTER TABLE family_tasks ENABLE ROW LEVEL SECURITY;