/*
  # Create calendar event with details function
  
  This function creates a calendar event and its assignments in a single transaction.
*/

-- Create the function
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
RETURNS TABLE(event_id uuid, assignment_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_event_id uuid;
  assignment_id uuid;
  assignment_ids uuid[] := '{}';
  assignee_id uuid;
BEGIN
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
    _event_date,
    _end_date,
    _location,
    _created_by
  ) RETURNING id INTO new_event_id;

  -- Create assignments for each assignee
  IF _assignees IS NOT NULL AND array_length(_assignees, 1) > 0 THEN
    FOREACH assignee_id IN ARRAY _assignees
    LOOP
      INSERT INTO event_assignment (
        event_id,
        assignee_id,
        assigned_by,
        status
      ) VALUES (
        new_event_id,
        assignee_id,
        _created_by,
        'assigned'
      ) RETURNING id INTO assignment_id;
      
      -- Add to assignment_ids array
      assignment_ids := array_append(assignment_ids, assignment_id);
    END LOOP;
  END IF;

  -- Return the created event ID and assignment IDs
  RETURN QUERY SELECT new_event_id, assignment_ids;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_calendar_event_with_details TO authenticated;
