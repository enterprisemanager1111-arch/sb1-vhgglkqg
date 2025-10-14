-- Update the create_calendar_event_with_details function to handle date/time conversion
-- This version converts the ISO string to the appropriate format for the database

CREATE OR REPLACE FUNCTION create_calendar_event_with_details(
  _family_id uuid,
  _title text,
  _description text DEFAULT NULL,
  _event_date timestamptz,
  _end_date timestamptz DEFAULT NULL,
  _location text DEFAULT NULL,
  _created_by uuid,
  _assignees uuid[] DEFAULT '{}'
)
RETURNS json AS $$
DECLARE
  v_event_id uuid;
  v_assignment_count integer := 0;
  v_result json;
  v_event_date_time time;
  v_end_date_time time;
BEGIN
  -- Convert timestamptz to time for storage
  v_event_date_time := _event_date::time;
  v_end_date_time := CASE WHEN _end_date IS NOT NULL THEN _end_date::time ELSE NULL END;

  -- Insert the calendar event
  INSERT INTO calendar_events (
    family_id,
    title,
    description,
    event_date,
    end_date,
    location,
    created_by
  ) VALUES (
    _family_id,
    _title,
    _description,
    v_event_date_time,
    v_end_date_time,
    _location,
    _created_by
  ) RETURNING id INTO v_event_id;

  -- Create assignments for each assignee if provided
  IF array_length(_assignees, 1) > 0 THEN
    -- Create event_assignment table if it doesn't exist
    BEGIN
      CREATE TABLE IF NOT EXISTS event_assignment (
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
      
      -- Enable RLS if not already enabled
      ALTER TABLE event_assignment ENABLE ROW LEVEL SECURITY;
      
      -- Create simple RLS policy if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_assignment' 
        AND policyname = 'Allow all operations for authenticated users'
      ) THEN
        CREATE POLICY "Allow all operations for authenticated users"
          ON event_assignment
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Table might already exist, continue
        NULL;
    END;

    -- Insert assignments for each assignee
    FOR i IN 1..array_length(_assignees, 1) LOOP
      BEGIN
        INSERT INTO event_assignment (
          event_id,
          assignee_id,
          assigned_by,
          status
        ) VALUES (
          v_event_id,
          _assignees[i],
          _created_by,
          'assigned'
        );
        
        v_assignment_count := v_assignment_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but continue with other assignments
          RAISE WARNING 'Failed to create assignment for assignee %: %', _assignees[i], SQLERRM;
      END;
    END LOOP;
  END IF;

  -- Return result
  v_result := json_build_object(
    'event_id', v_event_id,
    'assignments_created', v_assignment_count,
    'total_assignees', COALESCE(array_length(_assignees, 1), 0),
    'success', true
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
