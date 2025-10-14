-- Create a function to create the event_assignment table
-- This can be called from the application

CREATE OR REPLACE FUNCTION create_event_assignment_table()
RETURNS TEXT AS $$
BEGIN
    -- Drop table if exists to start fresh
    DROP TABLE IF EXISTS event_assignment CASCADE;
    
    -- Create event_assignment table
    CREATE TABLE event_assignment (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
      assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      assigned_at timestamptz DEFAULT now(),
      status text DEFAULT 'assigned',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE (event_id, assignee_id)
    );
    
    -- Add indexes
    CREATE INDEX event_assignment_event_id_idx ON event_assignment(event_id);
    CREATE INDEX event_assignment_assignee_id_idx ON event_assignment(assignee_id);
    CREATE INDEX event_assignment_assigned_by_idx ON event_assignment(assigned_by);
    
    -- Enable RLS
    ALTER TABLE event_assignment ENABLE ROW LEVEL SECURITY;
    
    -- Create simple RLS policy (allow all for authenticated users)
    CREATE POLICY "Allow all operations for authenticated users"
      ON event_assignment
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    
    RETURN 'Event assignment table created successfully';
END;
$$ LANGUAGE plpgsql;
