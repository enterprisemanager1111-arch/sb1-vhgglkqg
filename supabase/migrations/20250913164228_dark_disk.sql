/*
  # Complete Family Management Schema

  1. New Tables
    - `family_tasks`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key to families)
      - `title` (text, task description)
      - `description` (text, optional details)
      - `assignee_id` (uuid, foreign key to profiles)
      - `completed` (boolean, completion status)
      - `points` (integer, reward points)
      - `category` (text, task category)
      - `due_date` (timestamptz, optional deadline)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `shopping_items`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key to families)
      - `name` (text, item name)
      - `category` (text, item category)
      - `quantity` (text, optional quantity)
      - `completed` (boolean, purchase status)
      - `added_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `calendar_events`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key to families)
      - `title` (text, event title)
      - `description` (text, optional details)
      - `event_date` (timestamptz, event date and time)
      - `end_date` (timestamptz, optional end time)
      - `location` (text, optional location)
      - `created_by` (uuid, foreign key to profiles)
      - `attendees` (text[], array of user IDs)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for family-based access control
    - Ensure only family members can access family data

  3. Indexes
    - Add performance indexes for common queries
    - Optimize for real-time subscriptions
*/

-- Family Tasks Table
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

-- Shopping Items Table
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

-- Calendar Events Table
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

-- Enable Row Level Security
ALTER TABLE family_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Family Tasks Policies
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

CREATE POLICY "Family members can update tasks"
  ON family_tasks
  FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete their own tasks"
  ON family_tasks
  FOR DELETE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Shopping Items Policies
CREATE POLICY "Family members can view shopping items"
  ON shopping_items
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create shopping items"
  ON shopping_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
    AND added_by = auth.uid()
  );

CREATE POLICY "Family members can update shopping items"
  ON shopping_items
  FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete shopping items"
  ON shopping_items
  FOR DELETE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Calendar Events Policies
CREATE POLICY "Family members can view calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete their own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS family_tasks_family_id_idx ON family_tasks(family_id);
CREATE INDEX IF NOT EXISTS family_tasks_assignee_id_idx ON family_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS family_tasks_completed_idx ON family_tasks(completed);
CREATE INDEX IF NOT EXISTS family_tasks_due_date_idx ON family_tasks(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS shopping_items_family_id_idx ON shopping_items(family_id);
CREATE INDEX IF NOT EXISTS shopping_items_category_idx ON shopping_items(category);
CREATE INDEX IF NOT EXISTS shopping_items_completed_idx ON shopping_items(completed);

CREATE INDEX IF NOT EXISTS calendar_events_family_id_idx ON calendar_events(family_id);
CREATE INDEX IF NOT EXISTS calendar_events_event_date_idx ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS calendar_events_created_by_idx ON calendar_events(created_by);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  -- Only create trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_family_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_family_tasks_updated_at
      BEFORE UPDATE ON family_tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_shopping_items_updated_at'
  ) THEN
    CREATE TRIGGER update_shopping_items_updated_at
      BEFORE UPDATE ON shopping_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_calendar_events_updated_at'
  ) THEN
    CREATE TRIGGER update_calendar_events_updated_at
      BEFORE UPDATE ON calendar_events
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;