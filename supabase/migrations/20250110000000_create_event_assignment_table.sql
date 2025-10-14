-- Create event_assignment table for multiple assignees per event
-- This table handles multiple assignees for a single event

-- Create event_assignment table
CREATE TABLE IF NOT EXISTS event_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (event_id, assignee_id) -- A user can only be assigned to a specific event once
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS event_assignment_event_id_idx ON event_assignment(event_id);
CREATE INDEX IF NOT EXISTS event_assignment_assignee_id_idx ON event_assignment(assignee_id);
CREATE INDEX IF NOT EXISTS event_assignment_assigned_by_idx ON event_assignment(assigned_by);
CREATE INDEX IF NOT EXISTS event_assignment_status_idx ON event_assignment(status);

-- Enable RLS on event_assignment
ALTER TABLE event_assignment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_assignment
CREATE POLICY "Family members can view event assignments"
  ON event_assignment
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM calendar_events 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Family members can create event assignments"
  ON event_assignment
  FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM calendar_events 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    ) AND assigned_by = auth.uid()
  );

CREATE POLICY "Family members can update event assignments"
  ON event_assignment
  FOR UPDATE
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM calendar_events 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Family members can delete event assignments"
  ON event_assignment
  FOR DELETE
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM calendar_events 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_event_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_assignment_updated_at 
  BEFORE UPDATE ON event_assignment 
  FOR EACH ROW 
  EXECUTE FUNCTION update_event_assignment_updated_at();
