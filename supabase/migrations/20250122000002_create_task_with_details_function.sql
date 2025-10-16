-- Create function to create task with details (task + assignments + notifications)
CREATE OR REPLACE FUNCTION create_task_with_details(
  _title text,
  _description text,
  _points integer DEFAULT 0,
  _category text DEFAULT 'general',
  _due_date timestamptz DEFAULT NULL,
  _start_date timestamptz DEFAULT NULL,
  _end_date timestamptz DEFAULT NULL,
  _family_id uuid,
  _created_by uuid,
  _assignees uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE(
  task_id uuid,
  success boolean,
  message text
) AS $$
DECLARE
  new_task_id uuid;
  assignee_id uuid;
  notification_id uuid;
BEGIN
  -- Insert the task into family_tasks
  INSERT INTO family_tasks (
    title,
    description,
    points,
    category,
    due_date,
    start_date,
    end_date,
    family_id,
    created_by,
    assignee_id
  ) VALUES (
    _title,
    _description,
    _points,
    _category,
    _due_date,
    _start_date,
    _end_date,
    _family_id,
    _created_by,
    CASE WHEN array_length(_assignees, 1) = 1 THEN _assignees[1] ELSE NULL END
  ) RETURNING id INTO new_task_id;

  -- Create task assignments for each assignee
  IF array_length(_assignees, 1) > 0 THEN
    FOR assignee_id IN SELECT unnest(_assignees)
    LOOP
      INSERT INTO task_assignment (
        task_id,
        user_id,
        status
      ) VALUES (
        new_task_id,
        assignee_id,
        'assigned'
      );
    END LOOP;
  END IF;

  -- Create notifications for each assignee
  IF array_length(_assignees, 1) > 0 THEN
    FOR assignee_id IN SELECT unnest(_assignees)
    LOOP
      INSERT INTO notifications (
        assignee_id,
        assigner_id,
        task_id,
        type,
        status
      ) VALUES (
        assignee_id,
        _created_by,
        new_task_id,
        'task',
        'unread'
      );
    END LOOP;
  END IF;

  -- Return success
  RETURN QUERY SELECT new_task_id, true, 'Task created successfully with assignments and notifications';
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT NULL::uuid, false, 'Failed to create task: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_task_with_details TO authenticated;
